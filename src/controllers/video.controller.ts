import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { cloudinaryUploader, cloudinaryDeleter } from '../utils/cloudinary.js';
import type { IErrorMessage } from "../utils/ApiError.js";
import getBase64DecodedId from "../utils/decodeBase64Id.js";
import mongoose from 'mongoose';
import type { PipelineStage } from 'mongoose';
import Joi from 'joi';



const subFolder = 'video/';



// Get all videos/shorts based on query, sort, pagination
const getAllVideos = asyncHandler(async (req, res) => {
    /****** Step 1: Collect page, limit, query, sortBy, sortType, and username from the request query ******/
    let { 
        page = 1, 
        limit = 4, 
        query, // search keyword
        sortBy = 'views', // options -> views, createdAt
        sortType = -1, // By default DESCENDING 
        isShorts = false, 
        username
    } = req.query as {
        page?: string,
        limit?: string,
        query?: string,
        sortBy?: string,
        sortType?: string, // -1 -> 'desc', 1 -> 'asc'
        isShorts?: string, // true/false as string is passed
        username?: string
    };

    const pageNo = Number(page);
    const limitCount = Number(limit);
    const sortTypeFinal = sortType === 'desc' ? -1 : 1;
    const isShortsFlag = (isShorts === 'true') ? true : false;

    const sortByOptions = ['views', 'createdAt'];
    if(sortBy) {
        if(!sortByOptions.includes(sortBy)) {
            sortBy = 'views';
        }
    }


    /****** Step 2: Create an empty array pipeline for MongoDB aggregation stages ******/
    const pipeline: PipelineStage[] = [];
    // Need to tell TS that this array is an array of mongoose.PipelineStage
    // Basically it contains aggregation pipeline stages


    /****** 
    Step 3: 
    Filter videos using $match based on creator, shorts flag, publish flag (also with unpublished videos 
    of logged in user), and search keywords.
    ******/
    type MatchCondition = {
        creator?: mongoose.Types.ObjectId
        isShorts: boolean, // Utilizes the compound indexes
        isPublished?: boolean, // Utilizes the compound indexes
        $text?: { // Utilizes the text index
            $search: string
        }
    };

    let matchCondition: MatchCondition = {
        isShorts: isShortsFlag
    };

    const user = await User.findOne({ username }).select('_id');

    // Filter by creator if username was provided
    if(user) {
        matchCondition.creator = new mongoose.Types.ObjectId(user._id);
    }

    // If user is not the logged-in user, or if he/she is looking at someone else's account
    // filter only published videos, 
    // else filter published + unpublished (by the logged-in user) videos both
    if(!req.user || (user && user._id.toString() !== req.user._id.toString())) {
        matchCondition.isPublished = true;
    }

    // Used the text index for efficient keyword searching
    if(query) {
        matchCondition.$text = {
            $search: query as string
        };
    }

    // Appending the pipeline stage
    pipeline.push({
        $match: matchCondition
    });

    // Added a 'score' field to rank search results for $sort stage (how well the keywords matched)
    if(query) {
        pipeline.push({
            $addFields: {
                score: {
                    $meta: 'textScore'
                }
            }
        });
    }

    // How this works:
    // Tokenization: When we search for "NodeJS Backend," MongoDB breaks the string into "NodeJS" and "Backend."
    // Scoring: It looks at our weights. Since we set title: 5 and description: 1, a video with "NodeJS" in 
    //          the title gets a much higher "score" than a video that only mentions it in the description.
    // Efficiency: Because of the Text Index, MongoDB doesn't read our videos. It looks at its pre-built 
    //             word map and jumps straight to the IDs of the matching videos.


    /******
    Step 4: Sorts the filtered documents.
    ******/
    type SortStage = {
        // Record<Key, Value> is a TypeScript utility to define object structure
        $sort: Record<
            string, // The key: Can be any field name (e.g., 'views', 'createdAt')
            1 | -1 | { $meta: "textScore" } // The value: Must be one of these 3 specific options
        >;
        // Tells TS that any string key is allowed, but the value must be one of the three things 
        // MongoDB actually accepts
    };

    // Initialize it with an empty sort object to satisfy the type
    const sortStage: SortStage = { $sort: {} };

    // If user is searching, the most relevant matched result must come first
    // We use the 'score' field created in prev. step via $meta: 'textScore'
    // In MongoDB, when sorting by a $meta text score, we don't actually use -1 (score: -1) or 1. While -1 or 1 might 
    // happen to work in some drivers, the standard technical way to do it is to tell MongoDB explicitly 
    // to use the metadata.
    if(query) {
        sortStage.$sort = {
            score: { $meta: 'textScore' }
        };
    }
    // If user is not searching, sort by whatever sortBy (views, createdAt) and sortType (1 or -1) user provided
    else {
        sortStage.$sort = {
            [sortBy as string]: sortTypeFinal as 1 | -1
        };
        // TS sees 'sortType' (number) as too broad for the $sort type 
        // which specifically requires exactly 1 or -1 (literal types). 
        // We use 'as 1 | -1' to narrow the type and guarantee the value is valid.
    }

    pipeline.push(sortStage);


    /******
    Step 5: Attach creator details to each video gathered from prev. step
    ******/
    pipeline.push({
        // Creator lookup
        $lookup: {
            from: 'users',
            localField: 'creator',
            foreignField: '_id',
            as: 'creator',

            // Nested Projection inside the creator lookup, it uses $project to ensure it only grabs the username, 
            // fullName, and avatar
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
    });

    // Since $lookup always returns an array (even if there is only one creator), 
    // $first: '$creator' converts that array into a single object for easier use in the frontend
    pipeline.push({
        $addFields: {
            creator: {
                $first: '$creator'
            }
        }
    });


    /******
    Step 6: Apply pagination and return the result
    We pass the entire pipeline to aggregatePaginate. 
    It will add the final $skip and $limit stages based on user's given page and limit.
    ******/
    const options = {
        page: pageNo,
        limit: limitCount
    };

    // Video.aggregate(pipeline) creates the aggregation pipeline
    const result = await Video.aggregatePaginate(Video.aggregate(pipeline), options);

    // 'data' is result here
    // "data": {
    //     "docs": [ {...}, {...} ], // video docs
    //     "totalDocs": 45, // count of total video docs
    //     "limit": 10,
    //     "page": 1,
    //     "totalPages": 5,
    //     "pagingCounter": 1,
    //     "hasPrevPage": false,
    //     "hasNextPage": true,
    //     "prevPage": null,
    //     "nextPage": 2
    // }

    // If no results found
    if(!result || result.docs.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, result, 'No results found.')
        );
    }

    return res.status(200).json(
        new ApiResponse(200, result, 'All videos fetched successfully.')
    );
});



// Get video, upload to cloudinary, create video
const publishVideo = asyncHandler(async (req, res) => {
    const { title, description, isShorts } = req.body as {
        title: string,
        description: string,
        isShorts: boolean
    };

    const validatorSchema = Joi.object({
        title: Joi.string()
                    .trim()
                    .min(1)
                    .max(100)
                    .required()
                    .messages({
                        'string.empty': 'Title is required.',
                        'any.required': 'Title is required.',
                        'string.min': 'Title must be at least 1 character.',
                        'string.max': 'Title cannot exceed 100 characters.',
                    }),
        description: Joi.string()
                        .trim()
                        .max(5000)
                        .allow('') // Allow empty strings as valid input
                        .messages({
                            'string.max': 'Description cannot exceed 5000 characters.',
                        }),
        isShorts: Joi.boolean()
                        .default(false) // Defaults to false if not provided (means, long format video)
                        .messages({
                            'boolean.base': 'Shorts toggle field must be true or false.',
                        })
    });

    const { error } = validatorSchema.validate(
        { title, description, isShorts },
        { abortEarly: false }
    );

    if(error) {
        const errorArray: IErrorMessage[] = error.details.map(detail => {
            return {
                [detail.path[0] as string]: detail.message
            };
        });

        console.log(errorArray);
        throw new ApiError(400, 'Video publication validation failed.', errorArray);
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const videoOnLocalPath = files?.video?.[0]?.path;
    const thumbnailOnLocalPath = files?.thumbnail?.[0]?.path;

    if(!videoOnLocalPath) {
        throw new ApiError(400, 'Video file is required.');
    }

    const videoOnCloudinary = await cloudinaryUploader(videoOnLocalPath, subFolder);
    const thumbnailOnCloudinary = thumbnailOnLocalPath ? await cloudinaryUploader(thumbnailOnLocalPath, subFolder) : null;
    
    if(!videoOnCloudinary) {
        throw new ApiError(400, 'Unable to upload the Video file, please try again.');
    }

    /*
    {
      "asset_id": "8f23406323c21a69006509c31498d9e2",
      "public_id": "my_folder/video_123",
      "version": 1711725184,
      "version_id": "5e2b8f72c91a03e1b2c4d5e6f7g8h9i0",
      "signature": "abcdef1234567890demo",
      "width": 1920,
      "height": 1080,
      "format": "mp4",
      "resource_type": "video",
      "created_at": "2026-03-29T11:43:04Z",
      "tags": [],
      "pages": 0,
      "bytes": 5242880,
      "type": "upload",
      "etag": "1234567890demo",
      "placeholder": false,
      "url": "http://res.cloudinary.com/demo/video/upload/v1711725184/my_folder/video_123.mp4",
      "secure_url": "https://res.cloudinary.com/demo/video/upload/v1711725184/my_folder/video_123.mp4",
      "playback_url": "https://res.cloudinary.com/demo/video/upload/sp_auto/v1711725184/my_folder/video_123.m3u8",
      "duration": 15.5,
      "audio": {
        "codec": "aac",
        "bit_rate": "128000",
        "frequency": 44100,
        "channels": 2
      },
      "video": {
        "pix_format": "yuv420p",
        "codec": "h264",
        "level": 40,
        "bit_rate": "2500000"
      },
      "frame_rate": 30.0,
      "bit_rate": 2628000,
      "original_filename": "my_raw_video_file"
    }
    */

    let tempIsShorts: boolean = isShorts;

    // If video duration is above 60s, it can't be a short video
    if(videoOnCloudinary.duration > 60) {
        tempIsShorts = false;
    }
    // If user didn't specify
    else if(isShorts === undefined) {
        tempIsShorts = true;
    }

    // At this point, if video is below 60s, then 'tempIsShorts' is either true or false
    // based on what user set in 'isShorts'

    const video = await Video.create({
        videoFile: videoOnCloudinary.secure_url,
        playbackUrl: videoOnCloudinary.playback_url,
        thumbnail: thumbnailOnCloudinary?.secure_url,
        creator: req.user?._id,
        title,
        description,
        duration: videoOnCloudinary.duration,
        views: 0,
        isPublished: true,
        isShorts: tempIsShorts
    });

    if(!video) {
        throw new ApiError(500, 'Unable to publish the video, please try again.');
    }

    return res.status(201).json(
        new ApiResponse(201, video, 'Video created successfully.')
    );
});



// Get video by id
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params as {
        videoId: string // Right now base64 encoded
    };

    const decodedVideoId = getBase64DecodedId(videoId);

    // Now query, at this point decoded id is a valid mongodb string id
    const video = await Video.findById(decodedVideoId);

    if(!video) {
        throw new ApiError(404, "Video not found");
    }

    return res.status(200).json(
        new ApiResponse(200, video, 'Video fetched successfully.')
    );
});



// Increments the video view count
// Called from the frontend only after the video has played for 6 seconds to ensure valid engagement
const incrementVideoView = asyncHandler(async (req, res) => {
    const { videoId } = req.params as {
        videoId: string // Right now base64 encoded
    };

    const decodedVideoId = getBase64DecodedId(videoId);

    const video = await Video.findByIdAndUpdate(
        decodedVideoId,
        {
            $inc: { views: 1 }  // Increment views by 1
        },
        {
            returnDocument: 'after',
            runValidators: true
        }
    );

    if(!video) {
        throw new ApiError(500, 'Failed to register a view to this video!')
    }

    // If the viewer is logged in, add this video to his/her watch history
    // by updating this viewer's User document by pushing this video's id into their watchHistory array
    if(req.user) {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                // We are using $addToSet instead of $push because this prevents the same video from 
                // appearing multiple times in the history, keeping the document small
                $addToSet: {
                    watchHistory: video._id
                }
            },
            {
                returnDocument: 'after',
                runValidators: true
            }
        );
    }

    return res.status(200).json(
        new ApiResponse(200, video, 'Video viewed successfully.')
    );
});



// Update video details like title, description
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params as {
        videoId: string // Right now base64 encoded
    };

    const decodedVideoId = getBase64DecodedId(videoId);

    const { title, description, isShorts } = req.body as {
        title: string,
        description: string,
        isShorts: boolean
    };

    const validatorSchema = Joi.object({
        title: Joi.string()
                    .trim()
                    .min(1)
                    .max(100)
                    .required()
                    .messages({
                        'string.empty': 'Title is required.',
                        'any.required': 'Title is required.',
                        'string.min': 'Title must be at least 1 character.',
                        'string.max': 'Title cannot exceed 100 characters.',
                    }),
        description: Joi.string()
                    .trim()
                    .max(5000)
                    .allow('') // Allow empty strings as valid input
                    .messages({
                        'string.max': 'Description cannot exceed 5000 characters.',
                    })

        // Not validating isShorts, as once uploaded user cannot change video type (short/normal video)
    });

    const { error } = validatorSchema.validate(
        { title, description },
        { abortEarly: false }
    );

    if(error) {
        const errorArray: IErrorMessage[] = error.details.map(detail => {
            return {
                [detail.path[0] as string]: detail.message
            };
        });

        console.log(errorArray);
        throw new ApiError(400, 'Video metadata updation validation failed.', errorArray);
    }

    const fields: { title?: string, description?: string } = {};

    // Explicitly check for undefined to allow empty strings '' or 0
    if((title !== undefined) && (title !== '')) { fields.title = title };
    if(description !== undefined) { fields.description = description };

    const video = await Video.findOneAndUpdate(
        { _id: decodedVideoId, creator: req.user?._id },
        { $set: fields },
        {
            returnDocument: 'after',
            runValidators: true // Enforces Schema validation on update
        }
    );

    if(!video) {
        throw new ApiError(500, 'Failed to update video details!')
    }

    return res.status(200).json(
        new ApiResponse(200, video, 'Video updated successfully.')
    );
});



// Update video thumbnail file
const updateVideoThumbnail = asyncHandler(async (req, res) => {
    const { videoId } = req.params as {
        videoId: string // Right now base64 encoded
    };

    const decodedVideoId = getBase64DecodedId(videoId);
    const videoBeforeUpdate = await Video.findById(decodedVideoId).lean().select('_id thumbnail');

    const file = req.file as Express.Multer.File | undefined;
    const thumbnailOnLocalPath = file?.path;

    if(!thumbnailOnLocalPath) {
        throw new ApiError(400, 'Thumbnail is required.');
    }

    const oldThumbnailUrl = videoBeforeUpdate?.thumbnail;
    if(oldThumbnailUrl) {
        // Delete old uploaded thumbnail (if present) from cloudinary
        const isOldThumbnailDeletedFromCloudinary = await cloudinaryDeleter(oldThumbnailUrl);
        if(!isOldThumbnailDeletedFromCloudinary) {
            throw new ApiError(400, 'Unable to delete the old uploaded thumbnail, please try again.');
        }
    }

    const thumbnailOnCloudinary = await cloudinaryUploader(thumbnailOnLocalPath, subFolder);

    // In thumbnailOnCloudinary?.secure_url, added optional chaining because cloudinaryUploader returns UploadApiResponse | null, so it won't crash
    if(!thumbnailOnCloudinary?.secure_url) {
        throw new ApiError(400, 'Unable to upload the cover image, please try again.');
    }

    const videoThumbnailUpdated = await Video.findByIdAndUpdate(
        decodedVideoId,
        {
            $set: { thumbnail: thumbnailOnCloudinary?.secure_url }
        },
        {
            returnDocument: 'after',
            runValidators: true // Enforces Schema validation on update
        }
    ).lean();

    return res.status(200).json(
        new ApiResponse(200, videoThumbnailUpdated, 'Thumbnail is updated successfully.')
    );
});



const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params as {
        videoId: string // Right now base64 encoded
    };

    const decodedVideoId = getBase64DecodedId(videoId);

    // leans() helps to return plain JavaScript object without Mongoose features like .save(), findById() etc.
    const video = await Video.findById(decodedVideoId).select('videoFile creator').lean();

    if(!video) {
        throw new ApiError(404, "Video not found");
    }

    if(video.creator.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You do not have permission to perform this action.");
    }

    // Delete from Cloudinary first
    const isOldVideoDeletedFromCloudinary = await cloudinaryDeleter(video.videoFile);
    if (!isOldVideoDeletedFromCloudinary) {
        throw new ApiError(400, 'Unable to delete the video from storage, please try again.');
    }

    // Only delete from DB after Cloudinary confirms deletion
    const videoDeleted = await Video.findByIdAndDelete(decodedVideoId);
    if (!videoDeleted) {
        throw new ApiError(500, 'Unable to delete the video metadata, please try again.');
    }

    return res.status(200).json(
        new ApiResponse(200, {}, 'Video deleted successfully.')
    );
});



const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params as {
        videoId: string // Right now base64 encoded
    };

    const decodedVideoId = getBase64DecodedId(videoId);

    const video = await Video.findByIdAndUpdate(
        decodedVideoId,

        // Aggregate pipeline to toggle publish status
        [
            {
                $set: {
                    // Flips true-false & false-true, whatever resides in 'isPublished' field
                    // To do this we need $not, which is available in aggregation pipelines
                    // That's why we used that
                    isPublished: { $not: '$isPublished' }
                }
            }
        ],

        {
            returnDocument: 'after',
            runValidators: true // Enforces Schema validation on update
        }
    );

    if(!video) {
        throw new ApiError(500, 'Failed to update video publication status!')
    }

    return res.status(200).json(
        new ApiResponse(200, video, video.isPublished ? 'Video published successfully.' : 'Video unpublished successfully.')
    );
});



export {
    getAllVideos,
    publishVideo,
    getVideoById,
    incrementVideoView,
    updateVideo,
    updateVideoThumbnail,
    deleteVideo,
    togglePublishStatus
};