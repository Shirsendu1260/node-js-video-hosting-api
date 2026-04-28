import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import type { IErrorMessage } from "../utils/ApiError.js";
import getBase64DecodedId from "../utils/decodeBase64Id.js";
import Joi from 'joi';
import mongoose from 'mongoose';



const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body as {
        name: string,
        description?: string
    };

    if(!req.user) {
        throw new ApiError(401, 'You need to be authenticated to create a playlist.');
    }

    const validatorSchema = Joi.object({
        name: Joi.string()
                    .trim()
                    .min(1)
                    .max(200)
                    .required()
                    .messages({
                        'string.empty': 'Name is required.',
                        'any.required': 'Name is required.',
                        'string.min': 'Name must be at least 1 character.',
                        'string.max': 'Name cannot exceed 200 characters.',
                    }),
        description: Joi.string()
                        .trim()
                        .max(5000)
                        .allow('') // Allow empty strings as valid input
                        .messages({
                            'string.max': 'Description cannot exceed 5000 characters.',
                        }),
    });

    const { error } = validatorSchema.validate(
        { name, description },
        { abortEarly: false }
    );

    if(error) {
        const errorArray: IErrorMessage[] = error.details.map(detail => {
            return { 
                [detail.path[0] as string]: detail.message 
            }
        });

        // console.log(errorArray);
        throw new ApiError(400, 'Playlist create validation failed.', errorArray);
    }

    const playlistCreated = await Playlist.create({
        name,
        description,
        creator: req.user?._id
    });

    if(!playlistCreated) {
        throw new ApiError(500, 'Unable to create the playlist, please try again later.')
    }

    return res.status(201).json(
        new ApiResponse(201, playlistCreated, 'Playlist created successfully.')
    );
});



const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params as { userId: string };
    let { 
        page = 1, 
        limit = 4,
        sortType = -1
    } = req.query as {
        page?: string,
        limit?: string,
        sortType?: string, // -1 -> 'desc', 1 -> 'asc'
    };

    const pageNo = Number(page);
    const limitCount = Number(limit);
    const sortTypeFinal = sortType === 'desc' ? -1 : 1;

    const decodedUserId = getBase64DecodedId(userId);
    const user = await User.findById(decodedUserId).select('_id username').lean();

    if(!user) {
        throw new ApiError(404, 'User not found.');
    }

    const playlistAggregate = Playlist.aggregate([
        // Match by the user
        {
            $match: {
                creator: new mongoose.Types.ObjectId(user._id)
            }
        },

        {
            $sort: { name: sortTypeFinal }
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

    const result = await Playlist.aggregatePaginate(playlistAggregate, options);

    if(!result || result.docs.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, result, 'No playlists found.')
        );
    }

    return res.status(200).json(
        new ApiResponse(200, result, 'All playlists are fetched successfully.')
    );
});



const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params as { playlistId: string };
    const decodedPlaylistId = getBase64DecodedId(playlistId);
    const playlist = await Playlist.findById(decodedPlaylistId).lean();

    if(!playlist) {
        throw new ApiError(404, 'Playlist not found.');
    }

    // If user is not the logged-in user, or if he/she is looking at someone else's account
    // we need to filter only published videos, 
    // else we need to filter published + unpublished (by the logged-in user) videos both
    let publishedFlag = false;
    if(!req.user || (playlist.creator.toString() !== req.user._id.toString())) {
        publishedFlag = true;
    }

    let { 
        page = 1, 
        limit = 4
    } = req.query as {
        page?: string,
        limit?: string
    };

    const pageNo = Number(page);
    const limitCount = Number(limit);

    // Build the video aggregation for the video documents that is going to be collected from video ids
    const videoAggregate = Video.aggregate([
        // 1. Match the documents for this playlist
        {
            $match: {
                $and: [
                    // Only collect those video documents whose ids are in the video ids array from playlist
                    {
                        _id: { $in: playlist.videos }
                    },

                    // The spread operator (...):
                    // This unpacks an array. Example: [...[1, 2], 3] becomes [1, 2, 3]
                    // It unpacks whatever the ternary operator generates.
                    // If true: ...[{ isPublished: true }] unpacks the match condition { isPublished: true } and puts it into the $and array.
                    // If false: ...[] unpacks nothing.
                    ...(publishedFlag ? [{ isPublished: true }]: []),
                ]
            }
        },

        // 2. Lookup to get the each video's creator details
        {
            $lookup: {
                from: 'users',
                localField: 'creator',
                foreignField: '_id',
                as: 'creator',

                // Another nested pipeline to only extract username, fullName and avatar
                // for the creator of each video
                pipeline: [
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },

        // 3. Flatten the creator field
        {
            $addFields: {
                creator: {
                    $first: '$creator'
                }
            }
        }
    ]);

    const options = {
        page: pageNo,
        limit: limitCount
    };

    const result = await Video.aggregatePaginate(videoAggregate, options);

    // Put playlist info hardcoded into the 'result' object
    const finalResult = {
        playlistId: playlist._id,
        playlistName: playlist.name,
        playlistDescription: playlist.description,
        ...result // Spreads 'totalDocs', 'docs' array, 'limit', 'page' etc.
    };

    if(!result || result.docs.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, result, 'No videos found.')
        );
    }

    return res.status(200).json(
        new ApiResponse(200, finalResult, 'All playlist videos are fetched successfully.')
    );
});



const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params as {
        playlistId: string,
        videoId: string
    };

    const decodedPlaylistId = getBase64DecodedId(playlistId);
    const decodedVideoId = getBase64DecodedId(videoId);
    const video = await Video.findById(decodedVideoId).select('_id').lean();

    if(!video) {
        throw new ApiError(404, 'Video not found.');
    }

    const playlistUpdated = await Playlist.findOneAndUpdate(
        {
            _id: decodedPlaylistId,
            creator: req.user?._id // Only logged-in creator can add a video to playlist
        },
        {
            // We are using $addToSet instead of $push because this prevents the same video from 
            // appearing multiple times in the playlist, keeping the document small
            $addToSet: {
                videos: video._id
            }
        },
        {
            returnDocument: 'after',
            runValidators: true
        }
    );

    if(!playlistUpdated) {
        throw new ApiError(404, 'Playlist not found or permission denied.');
    }

    return res.status(200).json(
        new ApiResponse(200, playlistUpdated, 'Video added to playlist successfully.')
    );
});



const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params as {
        playlistId: string,
        videoId: string
    };

    const decodedPlaylistId = getBase64DecodedId(playlistId);
    const decodedVideoId = getBase64DecodedId(videoId);

    // Skipping the Video.findById check for a video's existance, we are attempting directly here
    const playlistUpdated = await Playlist.findOneAndUpdate(
        {
            _id: decodedPlaylistId,
            creator: req.user?._id // Only logged-in creator can delete a video from playlist
        },
        {
            // $pull looks into an array and removes all instances of a value that match a 
            // specific condition 
            $pull: {
                videos: decodedVideoId
            }
        },
        {
            returnDocument: 'after',
            runValidators: true
        }
    );

    if(!playlistUpdated) {
        throw new ApiError(404, 'Playlist not found or permission denied.');
    }

    return res.status(200).json(
        new ApiResponse(200, playlistUpdated, 'Video deleted from playlist successfully.')
    );
});



const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params as { playlistId: string };

    const decodedPlaylistId = getBase64DecodedId(playlistId);
    const playlist = await Playlist.findById(decodedPlaylistId).select('_id creator').lean();

    if(!playlist) {
        throw new ApiError(404, 'Playlist not found.');
    }

    if(playlist.creator.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, 'You do not have permission to perform this action.');
    }

    // Delete post
    const playlistDeleted = await Playlist.findByIdAndDelete(decodedPlaylistId);
    if (!playlistDeleted) {
        throw new ApiError(500, 'Unable to delete the playlist, please try again.');
    }

    return res.status(200).json(
        new ApiResponse(200, {}, 'Playlist deleted successfully.')
    );
});



const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params as { playlistId: string };
    const { name, description } = req.body as {
        name: string,
        description?: string
    };

    const decodedPlaylistId = getBase64DecodedId(playlistId);

    if(!req.user) {
        throw new ApiError(401, 'You need to be authenticated to update this playlist.');
    }

    const validatorSchema = Joi.object({
        name: Joi.string()
                    .trim()
                    .min(1)
                    .max(200)
                    .required()
                    .messages({
                        'string.empty': 'Name is required.',
                        'any.required': 'Name is required.',
                        'string.min': 'Name must be at least 1 character.',
                        'string.max': 'Name cannot exceed 200 characters.',
                    }),
        description: Joi.string()
                        .trim()
                        .max(5000)
                        .allow('') // Allow empty strings as valid input
                        .messages({
                            'string.max': 'Description cannot exceed 5000 characters.',
                        }),
    });

    const { error } = validatorSchema.validate(
        { name, description },
        { abortEarly: false }
    );

    if(error) {
        const errorArray: IErrorMessage[] = error.details.map(detail => {
            return { 
                [detail.path[0] as string]: detail.message 
            }
        });

        // console.log(errorArray);
        throw new ApiError(400, 'Playlist update validation failed.', errorArray);
    }

    const playlistUpdated = await Playlist.findOneAndUpdate(
        { 
            _id: decodedPlaylistId, 
            creator: req.user?._id
        },
        {
            $set: { name, description }
        },
        {
            returnDocument: 'after',
            runValidators: true
        }
    );

    if(!playlistUpdated) {
        throw new ApiError(500, 'Unable to update the playlist, please try again later.')
    }

    return res.status(200).json(
        new ApiResponse(200, playlistUpdated, 'Playlist updated successfully.')
    );
});



export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
};
