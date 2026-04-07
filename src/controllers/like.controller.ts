import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Post } from "../models/post.model.js";
import getBase64DecodedId from "../utils/decodeBase64Id.js";
import mongoose from 'mongoose';
import type { AggregatePaginateModel } from "mongoose";



type ToggleAction = 'like' | 'remove_like' | 'dislike' | 'remove_dislike';
type ToggleLikeDislikeReturnType = { liked: boolean } | { disliked: boolean };
// Either like added or removed
// Or dislike added or removed
// This is what the function will return



// Common helper function for any entity (here Video, Post or Comment)
const toggleLikeDislike = async (
    entityField: 'video' | 'post' | 'comment',
    action: ToggleAction,
    entityId: mongoose.Types.ObjectId, // video id, post id, or comment id
    userId: mongoose.Types.ObjectId
): Promise<ToggleLikeDislikeReturnType> => { // Resolved to either { liked: boolean } or { disliked: boolean }, if succeed
    const filter = {
        [entityField]: entityId, // eg. video: xyzpqr
        likedBy: userId
    };

    const modelObj = {
        video: Video,
        post: Post,
        comment: Comment
    } as const; // Make all properties to not modifyable
    const ModelFinal = modelObj[entityField] as AggregatePaginateModel<any>;

    if(!ModelFinal) {
        throw new ApiError(400, 'Invalid entity!');
    }

    // Rules to create accurate data:
    // 1. See if the user has already liked/disliked or not. If they did, we return early.
    // 2. If a user likes something they disliked earlier, we must delete the Dislike document and subtract 1 
    //    from the dislikesCount of the entity.
    // 3. We only change the count if a like/dislike document actually added or removed.

    if(action === 'like') {
        // Check if like already exists or not
        const likeExists = await Like.findOne({ ...filter, isDislike: false });
        if(likeExists) return { liked: true }; // Like already exists, do nothing

        // Check if user already disliked or not, with deleting it first if exists
        const dislikeExists = await Like.findOneAndDelete({ ...filter, isDislike: true });
        // If the doc. is found and deleted, it returns it. If not found, returns null.

        // Create the new like document
        await Like.create({ ...filter, isDislike: false });

        // Update like & dislike count based on dislike's presence
        // We did this step to accurately manage like & dislike count if user liked twice or more at once
        await ModelFinal.findByIdAndUpdate(
            entityId,
            {
                $inc: {
                    likesCount: 1,
                    dislikesCount: dislikeExists ? -1 : 0 
                    // If disliked earlier then decrease the count as the dislike document is 
                    // currently deleted if it existed
                }
            }
        );

        return { liked: true };
    }

    if(action === 'remove_like') {
        // Check if user already liked or not, with deleting it if exists
        const likeExists = await Like.findOneAndDelete({ ...filter, isDislike: false });

        // If liked earlier then decrease the count as the like document is currently 
        // deleted if it existed
        if(likeExists) {
            await ModelFinal.findByIdAndUpdate(
                entityId, 
                {
                    $inc: { likesCount: -1 }
                }
            );
        }

        return { liked: false };
    }

    // Our unique: true indexes are the ultimate safety net. If two requests somehow 
    //      bypass our findOne check in controller at the exact same millisecond, MongoDB will throw an 
    //      error on the second Like.create(), preventing a duplicate document bacause of unique: true.
    // Example: Moving from Dislike -> Like correctly does +1 Like and −1 Dislike in a single database call.
    // Using if(likeExists) in the remove_like block ensures that if a user tries to unlike something 
    //      they never liked, our counter doesn't drop into negative  (e.g., -1 likes).

    if(action === 'dislike') {
        // Check if dislike already exists or not
        const dislikeExists = await Like.findOne({ ...filter, isDislike: true });
        if(dislikeExists) return { disliked: true }; // Do nothing

        // Check if user already liked or not, with deleting it first if exists
        const likeExists = await Like.findOneAndDelete({ ...filter, isDislike: false });

        // Create the new dislike document
        await Like.create({ ...filter, isDislike: true });

        // Update like & dislike count based on like's presence
        // We did this step to accurately manage like & dislike count if user disliked twice or more at once
        await ModelFinal.findByIdAndUpdate(
            entityId,
            {
                $inc: {
                    dislikesCount: 1,
                    likesCount: likeExists ? -1 : 0 
                    // If liked earlier then decrease the count as the like document is 
                    // currently deleted if it existed
                }
            }
        );

        return { disliked: true };
    }

    if(action === 'remove_dislike') {
        // Check if user already disliked or not, with deleting it if exists
        const dislikeExists = await Like.findOneAndDelete({ ...filter, isDislike: true });

        // If liked earlier then decrease the count as the dislike document is currenltly 
        // deleted if it existed
        if(dislikeExists) {
            await ModelFinal.findByIdAndUpdate(
                entityId, 
                {
                    $inc: { dislikesCount: -1 }
                }
            );
        }

        return { disliked: false };
    }

   throw new ApiError(400, 'Invalid action.');
}



const toggleVideoLikeDislike = asyncHandler(async (req, res) => {
    const { videoId } = req.params as { videoId: string };
    const { action } = req.body as { action: ToggleAction };

    const decodedVideoId = getBase64DecodedId(videoId);
    const video = await Video.findById(decodedVideoId).select('_id creator').lean();

    if(!video) {
        throw new ApiError(404, 'Video not found');
    }

    if (video.creator.toString() === req.user?._id.toString()) {
        throw new ApiError(400, 'You cannot like/dislike your own video.');
    }

    const result = await toggleLikeDislike(
        'video', // entityField
        action, // action
        new mongoose.Types.ObjectId(video._id), // entityId
        new mongoose.Types.ObjectId(req.user?._id) // userId
    );

    return res.status(200).json(
        new ApiResponse(200, result, 'Toggle successful.')
    );
});



const toggleCommentLikeDislike = asyncHandler(async (req, res) => {
    const { commentId } = req.params as { commentId: string };
    const { action } = req.body as { action: ToggleAction };

    const decodedCommentId = getBase64DecodedId(commentId);
    const comment = await Comment.findById(decodedCommentId).select('_id creator').lean();

    if(!comment) {
        throw new ApiError(404, 'Comment not found');
    }

    if (comment.creator.toString() === req.user?._id.toString()) {
        throw new ApiError(400, 'You cannot like/dislike your own comment.');
    }

    const result = await toggleLikeDislike(
        'comment', // entityField
        action, // action
        new mongoose.Types.ObjectId(comment._id), // entityId
        new mongoose.Types.ObjectId(req.user?._id) // userId
    );

    return res.status(200).json(
        new ApiResponse(200, result, 'Toggle successful.')
    );
});



const togglePostLikeDislike = asyncHandler(async (req, res) => {
    const { postId } = req.params as { postId: string };
    const { action } = req.body as { action: ToggleAction };

    const decodedPostId = getBase64DecodedId(postId);
    const post = await Post.findById(decodedPostId).select('_id creator').lean();

    if(!post) {
        throw new ApiError(404, 'Post not found');
    }

    if (post.creator.toString() === req.user?._id.toString()) {
        throw new ApiError(400, 'You cannot like/dislike your own post.');
    }

    const result = await toggleLikeDislike(
        'post', // entityField
        action, // action
        new mongoose.Types.ObjectId(post._id), // entityId
        new mongoose.Types.ObjectId(req.user?._id) // userId
    );

    return res.status(200).json(
        new ApiResponse(200, result, 'Toggle successful.')
    );
});



const getLikedVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 4 } = req.query as {
        page?: string,
        limit?: string
    };

    const pageNumber = Number(page);
    const limitCount = Number(limit);

    if(!req.user) {
        throw new ApiError(400, 'You are not authenticated to see your liked videos.');
    }

    const videoAggregate = Like.aggregate([
        // 1. Find all Like documents for this user where he/she liked videos
        {
            $match: {
                video: { $exists: true },
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
                isDislike: false // Like
            }
        },

        // 2. Filter by latest liked videost
        {
            $sort: { createdAt: -1 }
        },

        // 3. Lookup to get video details with creator and views count
        //    $lookup always returns an array (e.g., video: [...])
        {
            $lookup: {
                from: 'videos',
                localField: 'video',
                foreignField: '_id',
                as: 'video',

                // Nested pipeline to get user details
                pipeline: [
                    // Creator lookup
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'creator', // from 'videos'
                            foreignField: '_id', // from 'users'
                            as: 'creator',

                            // Nested pipeline to extract required details from creator
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },

                    // $addFields with $first: Since $lookup always returns an array (even if there is only one creator), 
                    // $first: '$creator' converts that array into a single object for easier use in the frontend
                    {
                        $addFields: {
                            creator: { $first: '$creator' }
                        }
                    }
                ]
            }
        },

        // 4. Flatten the video array.
        //    If we don't use $unwind, in frontend, we will have to access data like 
        //    result.docs[0].video[0].title, which is annoying and error-prone. $unwind flattens that 
        //    array into a single object so we can just use result.docs[0].video.title
        {
            $unwind: "$video"
        },

        // 5. Finally construct each object at the top level
        {
            $addFields: {
                _id: '$video._id',
                title: '$video.title',
                thumbnail: '$video.thumbnail',
                creator: '$video.creator',
                likedAt: '$createdAt'
            }
        },

        // Remove the redundant video object and other reduntant fields
        {
            $project: { 
                // Drop redundant video object, data is already flattened to top-level
                video: 0, 

                // Remove Mongoose version key, it's useless for the frontend
                __v: 0, 

                // User already knows they liked these, no need to return their own id
                likedBy: 0
            }
        }
    ]);

    const options = {
        page: pageNumber,
        limit: limitCount
    };

    const result = await Like.aggregatePaginate(videoAggregate, options);

    // {
    //     "docs": [
    //         {
    //             "_id": "65f123...", 
    //             "title": "Video Title",
    //             "thumbnail": "https://...",
    //             "likedAt": "2026-04-04T...",
    //             "creator": {
    //                 "username": "shirsendu",
    //                 "fullName": "Shirsendu Mali",
    //                 "avatar": "https://..."
    //             }
    //         },
    //         ...
    //     ],
    //     "totalDocs": 1,
    //     "limit": 4,
    //     "page": 1,
    //     "totalPages": 1,
    //     "pagingCounter": 1,
    //     "hasPrevPage": false,
    //     "hasNextPage": false,
    //     "prevPage": null,
    //     "nextPage": null
    // }

    if(!result || result.docs.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, result, '0 liked videos.')
        );
    }

    return res.status(200).json(
        new ApiResponse(200, result, 'All liked videos fetched successfully.')
    );
});

export {
    toggleCommentLikeDislike,
    togglePostLikeDislike,
    toggleVideoLikeDislike,
    getLikedVideos
};