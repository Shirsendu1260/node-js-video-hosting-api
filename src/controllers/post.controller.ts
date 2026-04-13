import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Post } from "../models/post.model.js";
import { Comment } from "../models/comment.model.js";
import { User } from '../models/user.model.js';
import { cloudinaryUploader, cloudinaryDeleter } from '../utils/cloudinary.js';
import type { IErrorMessage } from "../utils/ApiError.js";
import getBase64DecodedId from "../utils/decodeBase64Id.js";
import Joi from 'joi';
import mongoose from 'mongoose';



const subFolder = 'post/';



const createPost = asyncHandler(async (req, res) => {
    const { content } = req.body as { content: string };

    if(!req.user) {
        throw new ApiError(401, 'You need to be authenticated to create a post.');
    }

    const validatorSchema = Joi.object({
        content: Joi.string()
                    .trim()
                    .min(1)
                    .max(2000)
                    .messages({
                        'string.max': 'Content cannot exceed 2000 characters.',
                    })
    });

    const { error } = validatorSchema.validate(
        { content },
        { abortEarly: false }
    );

    if(error) {
        const errorArray: IErrorMessage[] = error.details.map(detail => {
            return { 
                [detail.path[0] as string]: detail.message 
            }
        });

        console.log(errorArray);
        throw new ApiError(400, 'Post create validation failed.', errorArray);
    }

    const file = req.file as Express.Multer.File | undefined;
    const postImageOnLocalPath = file?.path; // Not a mandatory file, user can create post with or without image

    const postImageOnCloudinary = postImageOnLocalPath ? await cloudinaryUploader(postImageOnLocalPath, subFolder) : null;

    const postCreated = await Post.create({
        creator: req.user?._id,
        content,
        image: postImageOnCloudinary?.secure_url
        // likesCount and dislikesCount are automatically set to 0 by Mongoose Schema
    });

    if(!postCreated) {
        throw new ApiError(500, 'Unable to create the post, please try again later.')
    }

    return res.status(201).json(
        new ApiResponse(201, postCreated, 'Post created successfully.')
    );
});



const getUserPosts = asyncHandler(async (req, res) => {
    let { 
        page = 1, 
        limit = 4,
        sortType = -1,
        username
    } = req.query as {
        page?: string,
        limit?: string,
        sortType?: string, // -1 -> 'desc', 1 -> 'asc'
        username?: string
    };

    const pageNo = Number(page);
    const limitCount = Number(limit);
    const sortTypeFinal = sortType === 'desc' ? -1 : 1;

    // Check if user with provided username actually exists in DB or not
    const user = await User.findOne({ username });
    if(!user) {
        throw new ApiError(404, 'User not found.');
    }

    const postAggregate = Post.aggregate([
        // Match by the user
        {
            $match: {
                creator: new mongoose.Types.ObjectId(user._id)
            }
        },

        {
            $sort: { createdAt: sortTypeFinal }
        },

        // Lookup to get user details
        {
            $lookup: {
                from: 'users',
                localField: 'creator',
                foreignField: '_id',
                as: 'creator',

                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },

        // Flat the creator lookup data
        {
            $addFields: {
                creator: { $first: '$creator' }
            }
        }
    ]);

    const options = {
        page: pageNo,
        limit: limitCount
    };

    const result = await Post.aggregatePaginate(postAggregate, options);

    if(!result || result.docs.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, result, 'No posts created.')
        );
    }

    return res.status(200).json(
        new ApiResponse(200, result, 'All posts are fetched successfully.')
    );
});



const updatePost = asyncHandler(async (req, res) => {
    const { content } = req.body as { content: string };
    const { postId } = req.params as {
        postId: string // Right now base64 encoded
    };

    const decodedPostId = getBase64DecodedId(postId);
    const post = await Post.findById(decodedPostId).select('_id creator').lean();

    if(!post) {
        throw new ApiError(404, 'Post not found.');
    }

    if(post.creator.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, 'You do not have permission to perform this action.');
    }

    const validatorSchema = Joi.object({
        content: Joi.string()
                    .trim()
                    .min(1)
                    .max(2000)
                    .messages({
                        'string.max': 'Content cannot exceed 2000 characters.',
                    })
    });

    const { error } = validatorSchema.validate(
        { content },
        { abortEarly: false }
    );

    if(error) {
        const errorArray: IErrorMessage[] = error.details.map(detail => {
            return { 
                [detail.path[0] as string]: detail.message 
            }
        });

        console.log(errorArray);
        throw new ApiError(400, 'Post update validation failed.', errorArray);
    }

    const postUpdated = await Post.findOneAndUpdate(
        { _id: decodedPostId, creator: req.user?._id },
        {
            $set: { content }
        },
        {
            returnDocument: 'after',
            runValidators: true
        }
    );

    if(!postUpdated) {
        throw new ApiError(500, 'Failed to update post!');
    }

    return res.status(200).json(
        new ApiResponse(200, postUpdated, 'Post updated successfully.')
    );
});



const deletePost = asyncHandler(async (req, res) => {
    const { postId } = req.params as {
        postId: string // Right now base64 encoded
    };

    const decodedPostId = getBase64DecodedId(postId);
    const post = await Post.findById(decodedPostId).select('_id image creator').lean();

    if(!post) {
        throw new ApiError(404, 'Post not found.');
    }

    if(post.creator.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, 'You do not have permission to perform this action.');
    }

    // Delete all comments related to this post
    await Comment.deleteMany({
        post: new mongoose.Types.ObjectId(decodedPostId)
    });

    // Delete post image from Cloudinary if uploaded earlier
    if(post.image) {
        const isOldPostImgDeletedFromCloudinary = await cloudinaryDeleter(post.image);
        if (!isOldPostImgDeletedFromCloudinary) {
            throw new ApiError(400, 'Unable to delete the post image from storage, please try again.');
        }
    }

    // Delete post
    const postDeleted = await Post.findByIdAndDelete(decodedPostId);
    if (!postDeleted) {
        throw new ApiError(500, 'Unable to delete the post, please try again.');
    }

    return res.status(200).json(
        new ApiResponse(200, {}, 'Post deleted successfully.')
    );
});



export {
    createPost,
    getUserPosts,
    updatePost,
    deletePost
};