import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import getBase64DecodedId from "../utils/decodeBase64Id.js";
import mongoose from 'mongoose';



// Endpoint to toggle subscribtion (subscribe/unsubscribe)
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params as { channelId: string };
    const decodedChannelId = getBase64DecodedId(channelId);

    if(!req.user) {
        throw new ApiError(401, 'You need to be authenticated to subscribe this channel.');
    }

    if(decodedChannelId === req.user?._id.toString()) {
        throw new ApiError(400, 'You cannot subscribe/unsubscribe to your own channel.');
    }

    // A channel is indeed a user, so get it details
    const channel = await User.findById(decodedChannelId).select('_id').lean();
    if(!channel) {
        throw new ApiError(404, 'Channel not found.');
    }

    let result = { subscribed: false };

    // If logged in, check if the user had subscribed this channel or not
    const userSubsThisChannel = await Subscription.findOne({
        subscriber: new mongoose.Types.ObjectId(req.user._id), // Logged in user is subscriber of this channel
        channel: new mongoose.Types.ObjectId(channel._id) // This user is the channel
    });

    if(userSubsThisChannel) {
        // This channel was already subscribed (subscribed: true) by this user, unsubscribe this
        await Subscription.findByIdAndDelete(userSubsThisChannel._id);
        result.subscribed = false; // Unsubscribe done
    }
    else {
        // This channel was not subscribed (subscribed: false) by this user, subscribe this
        await Subscription.create({
            subscriber: new mongoose.Types.ObjectId(req.user._id),
            channel: new mongoose.Types.ObjectId(channel._id),
        })
        result.subscribed = true; // Done subscribing
    }

    return res.status(200).json(
        new ApiResponse(
            200, 
            result, 
            result.subscribed 
                ? 'Channel subscribed successfully.' 
                : 'Channel unsubscribed successfully.'
        )
    );
});



const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params as { channelId: string };
    const decodedChannelId = getBase64DecodedId(channelId);

    let { 
        page = 1, 
        limit = 4
    } = req.query as {
        page?: string,
        limit?: string
    };

    const pageNo = Number(page);
    const limitCount = Number(limit);

    // A channel is indeed a user, so get it details
    const channel = await User.findById(decodedChannelId).select('_id').lean();
    if(!channel) {
        throw new ApiError(404, 'Channel not found.');
    }

    const subscribersAggregate = Subscription.aggregate([
        // Match all documents where 'channel' key is this user channel's id
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channel._id)
            }
        },

        // Lookup to get each subscriber's avatar, fullname and username
        {
            $lookup: {
                from: 'users',
                localField: 'subscriber',
                foreignField: '_id',
                as: 'subscriber',

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

        // Flat the subscriber lookup data
        {
            $addFields: { 
                subscriber: { $first: '$subscriber' } 
            }
        },

        // Sort by their names in alphabetical order
        {
            $sort: {
                'subscriber.fullName': 1
            }
        }
    ]);

    const options = {
        page: pageNo,
        limit: limitCount
    };

    const result = await Subscription.aggregatePaginate(subscribersAggregate, options);

    if(!result || result.docs.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, result, 'No subscribers found.')
        );
    }

    return res.status(200).json(
        new ApiResponse(200, result, 'All subscribers are fetched successfully.')
    );
});



const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params as { channelId: string };
    const decodedChannelId = getBase64DecodedId(channelId);

    let { 
        page = 1, 
        limit = 4
    } = req.query as {
        page?: string,
        limit?: string
    };

    const pageNo = Number(page);
    const limitCount = Number(limit);

    // A channel is indeed a user, so get it details
    const channel = await User.findById(decodedChannelId).select('_id').lean();
    if(!channel) {
        throw new ApiError(404, 'Channel not found.');
    }

    const subscribedChannelsAggregate = Subscription.aggregate([
        // Match all documents where 'subscriber' key is this user channel's id
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(channel._id)
            }
        },

        // Lookup to get each channel's avatar, fullname and username
        {
            $lookup: {
                from: 'users',
                localField: 'channel',
                foreignField: '_id',
                as: 'channel',

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

        // Flat the channel lookup data
        {
            $addFields: { 
                channel: { $first: '$channel' } 
            }
        },

        // Sort by their names in alphabetical order
        {
            $sort: {
                'channel.fullName': 1
            }
        }
    ]);

    const options = {
        page: pageNo,
        limit: limitCount
    };

    const result = await Subscription.aggregatePaginate(subscribedChannelsAggregate, options);

    if(!result || result.docs.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, result, 'No subscribed channels found.')
        );
    }

    return res.status(200).json(
        new ApiResponse(200, result, 'All subscribed channels are fetched successfully.')
    );
});



export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
};
