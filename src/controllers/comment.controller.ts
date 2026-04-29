import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Comment } from '../models/comment.model.js';
import type { IErrorMessage } from "../utils/ApiError.js";
import getBase64DecodedId from "../utils/decodeBase64Id.js";
import Joi from 'joi';
import mongoose from 'mongoose';
import type { PipelineStage } from 'mongoose';



const getComments = asyncHandler(async (req, res) => {
    const { videoId, postId } = req.params as {
        videoId?: string, // base64 encoded
        postId?: string // base64 encoded
    }; // User either wants to get comments of a Video or a post

    const {
    	page = 1,
        limit = 4,
        sortType = -1, // By default DESCENDING 
    } = req.query as {
    	page?: string,
    	limit?: string,
    	sortType?: string
    };

    const pageNumber = Number(page);
    const limitCount = Number(limit);
    const sortTypeFinal = sortType === 'desc' ? -1 : 1;

    if (!videoId && !postId) {
        throw new ApiError(400, 'Either videoId or postId is required.');
    }

    const pipeline: PipelineStage[] = [];


    /*** 1. $match by video or post ***/
    type MatchCondition = {
        video?: mongoose.Types.ObjectId,
        post?: mongoose.Types.ObjectId,
        isChildComment: false,
        isHidden: false
    };

    const matchCondition: MatchCondition = {
        isChildComment: false,
        isHidden: false
    };

    if(videoId) {
    	const decodedVideoId = getBase64DecodedId(videoId);

        if (!mongoose.Types.ObjectId.isValid(decodedVideoId)) {
            throw new ApiError(400, 'Invalid Video ID.');
        }

        matchCondition.video = new mongoose.Types.ObjectId(decodedVideoId);
    }

    if(postId) {
    	const decodedPostId = getBase64DecodedId(postId);

        if (!mongoose.Types.ObjectId.isValid(decodedPostId)) {
            throw new ApiError(400, 'Invalid Post ID.');
        }

    	matchCondition.post = new mongoose.Types.ObjectId(decodedPostId);
    }

    pipeline.push({
        $match: matchCondition
    });


    /*** 2. $sort by the given sort type (1 or -1) ***/
    pipeline.push({
        $sort: {
            createdAt: sortTypeFinal
        }
    });


    /*** 3. $lookup to get user details ***/
    pipeline.push({
        $lookup: {
            from: 'users',
            localField: 'creator',
            foreignField: '_id',
            as: 'creator',

            pipeline: [
                {
                    $project: {
                        username: 1,
                        avatar: 1
                    }
                }
            ]
        }
    });

    pipeline.push({
        $addFields: {
            creator: {
                $first: '$creator'
            }
        }
    });


    const options = {
        page: pageNumber,
        limit: limitCount
    };

    const result = await Comment.aggregatePaginate(Comment.aggregate(pipeline), options);

    if(!result || result.docs.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, result, '0 comments. Be the first to comment.')
        );
    }

    return res.status(200).json(
        new ApiResponse(200, result, 'All comments fetched successfully.')
    );
});



const getNestedComments = asyncHandler(async (req, res) => {
    const { videoId, postId, parentCommentId } = req.params as {
        videoId?: string, // base64 encoded
        postId?: string, // base64 encoded
        parentCommentId: string // base64 encoded
    }; // User here wants to get replies of a main comment for either a video or a post

    const {
        page = 1,
        limit = 4
    } = req.query as {
        page?: string,
        limit?: string
    };

    const pageNumber = Number(page);
    const limitCount = Number(limit);
    const decodedParentCommentId = getBase64DecodedId(parentCommentId);

    if (!videoId && !postId) {
        throw new ApiError(400, 'Either videoId or postId is required.');
    }

    const parentComment = await Comment.findById(decodedParentCommentId).lean();

    if(!parentComment) {
        throw new ApiError(404, 'Parent comment does not exist.');
    }

    const pipeline: PipelineStage[] = [];


    /*** 1. $match by video or post ***/
    type MatchCondition = {
        video?: mongoose.Types.ObjectId,
        post?: mongoose.Types.ObjectId,
        isChildComment: true,
        parentComment: mongoose.Types.ObjectId,
    };

    const matchCondition: MatchCondition = {
        isChildComment: true, // for replies
        parentComment: new mongoose.Types.ObjectId(decodedParentCommentId)
    };

    if(videoId) {
        const decodedVideoId = getBase64DecodedId(videoId);

        if (!mongoose.Types.ObjectId.isValid(decodedVideoId)) {
            throw new ApiError(400, 'Invalid Video ID.');
        }

        matchCondition.video = new mongoose.Types.ObjectId(decodedVideoId);
    }

    if(postId) {
        const decodedPostId = getBase64DecodedId(postId);

        if (!mongoose.Types.ObjectId.isValid(decodedPostId)) {
            throw new ApiError(400, 'Invalid Post ID.');
        }

        matchCondition.post = new mongoose.Types.ObjectId(decodedPostId);
    }

    pipeline.push({
        $match: matchCondition
    });


    /*** 2. $sort by the sort type (1 or -1) gievn ***/
    pipeline.push({
        $sort: {
            createdAt: -1 // For nested comments, it will always show by latest comments
        }
    });


    /*** 3. $lookup to get user details ***/
    pipeline.push({
        $lookup: {
            from: 'users',
            localField: 'creator',
            foreignField: '_id',
            as: 'creator',

            pipeline: [
                {
                    $project: {
                        username: 1,
                        avatar: 1
                    }
                }
            ]
        }
    });

    pipeline.push({
        $addFields: {
            creator: {
                $first: '$creator'
            }
        }
    });


    const options = {
        page: pageNumber,
        limit: limitCount
    };

    const result = await Comment.aggregatePaginate(Comment.aggregate(pipeline), options);

    if(!result || result.docs.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, result, 'No replies found.')
        );
    }

    return res.status(200).json(
        new ApiResponse(200, result, 'All replies are fetched successfully.')
    );
});



const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body as {
        content: string
    };

    const { videoId, postId, parentCommentId } = req.params as {
        videoId?: string, // base64 encoded
        postId?: string, // base64 encoded
        parentCommentId?: string // Either user wants to write a comment as main comment or under a main comment as a reply
    }; // User either wants to write a comment for a video or a post

    if (!videoId && !postId) {
        throw new ApiError(400, 'Either videoId or postId is required.');
    }

    const validatorSchema = Joi.object({
        content: Joi.string()
                    .trim()
                    .min(1)
                    .max(1000)
                    .required()
                    .messages({
                        'string.empty': 'Content is required.',
                        'any.required': 'Content is required.',
                        'string.min': 'Content must be at least 1 character.',
                        'string.max': 'Content cannot exceed 1000 characters.',
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
            };
        });

        // console.log(errorArray);
        throw new ApiError(400, 'Comment validation failed.', errorArray);
    }

    let fields: {
        content: string,
        video?: mongoose.Types.ObjectId,
        post?: mongoose.Types.ObjectId,
        creator: mongoose.Types.ObjectId,
        isChildComment: boolean,
        parentComment?: mongoose.Types.ObjectId
    } = { 
        content,
        creator: new mongoose.Types.ObjectId(req.user?._id),
        isChildComment: false // By default we are stating that it is a main comment
    };

    if(videoId) {
        const decodedVideoId = getBase64DecodedId(videoId);

        if (!mongoose.Types.ObjectId.isValid(decodedVideoId)) {
            throw new ApiError(400, 'Invalid Video ID.');
        }

        fields.video = new mongoose.Types.ObjectId(decodedVideoId);
    }

    if(postId) {
        const decodedPostId = getBase64DecodedId(postId);

        if (!mongoose.Types.ObjectId.isValid(decodedPostId)) {
            throw new ApiError(400, 'Invalid Post ID.');
        }

        fields.post = new mongoose.Types.ObjectId(decodedPostId);
    }

    if(parentCommentId) {
        const decodedParentCommentId = getBase64DecodedId(parentCommentId);
        const parentComment = await Comment.findById(decodedParentCommentId);

        if(!parentComment) {
            throw new ApiError(404, 'Parent comment not found.');
        }

        fields.isChildComment = true;
        fields.parentComment = new mongoose.Types.ObjectId(parentComment._id);
    }

    const commentAdded = await Comment.create(fields);

    if(!commentAdded) {
        throw new ApiError(500, 'Failed to add this comment!');
    }

    return res.status(201).json(
        new ApiResponse(201, commentAdded, 'Comment added successfully.')
    );
});



const updateComment = asyncHandler(async (req, res) => {
    const { content } = req.body as {
        content: string
    };

    const { commentId } = req.params as {
        commentId: string // Right now base64 encoded
    };

    const decodedCommentId = getBase64DecodedId(commentId);
    const comment = await Comment.findById(decodedCommentId).select('_id creator').lean();

    if(!comment) {
        throw new ApiError(404, 'Comment not found.');
    }

    if(comment.creator.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, 'You do not have permission to perform this action.');
    }

    const validatorSchema = Joi.object({
        content: Joi.string()
                    .trim()
                    .min(1)
                    .max(1000)
                    .required()
                    .messages({
                        'string.empty': 'Content is required.',
                        'any.required': 'Content is required.',
                        'string.min': 'Content must be at least 1 character.',
                        'string.max': 'Content cannot exceed 1000 characters.',
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
            };
        });

        // console.log(errorArray);
        throw new ApiError(400, 'Comment validation failed.', errorArray);
    }

    const commentUpdated = await Comment.findOneAndUpdate(
        { _id: decodedCommentId, creator: req.user?._id },
        { 
            $set: { content } 
        },
        {
            returnDocument: 'after',
            runValidators: true // Enforces Schema validation on update
        }
    );

    if(!commentUpdated) {
        throw new ApiError(500, 'Failed to update comment!');
    }

    return res.status(200).json(
        new ApiResponse(200, {}, 'Comment updated successfully.')
    );
});



const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params as {
        commentId: string // Right now base64 encoded
    };

    const decodedCommentId = getBase64DecodedId(commentId);
    const comment = await Comment.findById(decodedCommentId).select('_id creator').lean();

    if(!comment) {
        throw new ApiError(404, 'Comment not found.');
    }

    if(comment.creator.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, 'You do not have permission to perform this action.');
    }

    // Delete the child comments (replies) first
    // deleteMany() never returns null, it always returns { deletedCount: number }
    await Comment.deleteMany({
        parentComment: new mongoose.Types.ObjectId(decodedCommentId)
    });

    const commentDeleted = await Comment.findByIdAndDelete(decodedCommentId);
    if (!commentDeleted) {
        throw new ApiError(500, 'Unable to delete the comment, please try again.');
    }

    return res.status(200).json(
        new ApiResponse(200, {}, 'Comment deleted successfully.')
    );
});



export {
	getComments,
	getNestedComments,
	addComment, 
	updateComment,
	deleteComment
};