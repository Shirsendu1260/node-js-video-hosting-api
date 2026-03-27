import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import type { IErrorMessage } from "../utils/ApiError.js";
import mongoose, { isValidObjectId } from 'mongoose';



const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
};