import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import mongoose from 'mongoose';
import type { PipelineStage } from 'mongoose';



// Get channel stats like total video views, total subscribers, total videos, total video likes etc.
const getChannelStats = asyncHandler(async (req, res) => {
    const { username } = req.params as { username: string };
    const user = await User.findOne({ username }).select('_id').lean();

    if(!user) {
    	throw new ApiError(404, 'User not found.');
    }

    const stats = await User.aggregate([
    	// 1. Filter by this specific user/channel
    	{
    		$match: {
    			_id: new mongoose.Types.ObjectId(user._id)
    		}
    	},

        // 2. Get all videos created by this channel
        {
            $lookup: {
                from: 'videos',
                localField: '_id',
                foreignField: 'creator',
                as: 'videos',

                // Only extracting required fields to make the data size for each video less
                pipeline: [
                    {
                        $project: { 
                            _id: 1,
                            views: 1,
                            likesCount: 1
                        }
                    }
                ]
            }
        },
        // At this point, the key named 'videos' is ready containing an array of Video documents 
        // for this User document

        // 3. Get all subscribers for this channel
        {
            $lookup: {
                from: 'subscriptions',
                localField: '_id',
                foreignField: 'channel',
                as: 'subscribers',

                // Only extracting id to make the data size for each subscriber less
                pipeline: [
                    {
                        $project: { _id: 1 }
                    }
                ]
            }
        },
        // At this point, the key named 'subscribers' is ready containing an array of Subscription 
        // documents for this User document

        // 4. Count the derived fields
        {
            $addFields: {
                totalVideos: { $size: '$videos' },
                totalSubscribers: { $size: '$subscribers' },

                totalVideoViews: {
                    // $reduce transforms an array into a single value (e.g., summing up numbers)
                    $reduce: {
                        // The array of objects we are iterating over
                        input: '$videos',

                        // The value where our sum starts (The accumulator starts at 0)
                        initialValue: 0,

                        // The calculation logic for each iteration
                        in: {
                            // $add: Performs the addition
                            // $$value: This is the accumulator. It holds the running total as the 
                            //          loop moves from one video to the next.
                            // $$this: Refers to the current video document in the loop
                            // $$this.views: Grabs the 'views' field from that current video
                            $add: ['$$value', '$$this.views']
                        }
                    }
                },
                // In MongoDB aggregation, internal variables created by operators like 
                // $reduce must use a double dollar sign '$$'.
                // Incorrect: $value
                // Correct: $$value
                // If we use a single $, MongoDB looks for a field named 'value' inside our 
                // document, doesn't find it, and returns null or 0.

                totalVideoLikes: {
                    $reduce: {
                        input: '$videos',
                        initialValue: 0,
                        in: {
                            $add: ['$$value', '$$this.likesCount']
                        }
                    }
                }
            }
        },

        // 5. Extracting required fields
        {
            $project: {
                username: 1,
                totalVideos: 1,
                totalSubscribers: 1,
                totalVideoViews: 1,
                totalVideoLikes: 1
            }
        }
    ]);

    if (!stats[0]) {
        throw new ApiError(404, 'Stats not found.');
    }


    return res.status(200).json(
        new ApiResponse(200, stats[0], 'Stats fetched successfully.')
    );
});



const getChannelVideos = asyncHandler(async (req, res) => {
    /****** Step 1: Collect page, limit, sortBy, sortType, and username from request ******/
    let { 
        page = 1, 
        limit = 4,
        sortBy = 'createdAt', // options -> views, createdAt
        sortType = -1, // By default DESCENDING 
        isShorts = false
    } = req.query as {
        page?: string,
        limit?: string,
        sortBy?: string,
        sortType?: string, // -1 -> 'desc', 1 -> 'asc'
        isShorts?: string, // true/false as string is passed
    };
    const { username } = req.params as { username: string };

    const user = await User.findOne({ username }).select('_id username');
    if(!user) {
        throw new ApiError(404, 'User not found.');
    }

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
    

    /****** 
    Step 3: 
    Filter videos using $match based on creator, shorts flag, publish flag (also with unpublished videos 
    of logged in user)
    ******/
    type MatchCondition = {
        creator: mongoose.Types.ObjectId
        isShorts: boolean, // Utilizes the compound indexes
        isPublished?: boolean, // Utilizes the compound indexes
    };

    let matchCondition: MatchCondition = {
        creator: new mongoose.Types.ObjectId(user._id),
        isShorts: isShortsFlag
    };

    if(!req.user || (user && user._id.toString() !== req.user._id.toString())) {
        matchCondition.isPublished = true;
    }

    pipeline.push({
        $match: matchCondition
    });


    /******
    Step 4: Sorts the filtered documents.
    ******/
    type SortStage = {
        $sort: Record<string, 1 | -1>;
    };

    const sortStage: SortStage = { $sort: {} };

    sortStage.$sort = {
        [sortBy as string]: sortTypeFinal as 1 | -1
    };

    pipeline.push(sortStage);


    /******
    Step 5: Attach creator details to each video gathered from prev. step
    ******/
    pipeline.push({
        $lookup: {
            from: 'users',
            localField: 'creator',
            foreignField: '_id',
            as: 'creator',

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

    const result = await Video.aggregatePaginate(Video.aggregate(pipeline), options);

    if(!result || result.docs.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, result, 'No results found.')
        );
    }

    return res.status(200).json(
        new ApiResponse(200, result, 'All videos fetched successfully.')
    );
});



export {
	getChannelStats, 
    getChannelVideos
};