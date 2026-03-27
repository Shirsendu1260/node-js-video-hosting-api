import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import type { IErrorMessage } from "../utils/ApiError.js";
import mongoose from 'mongoose';



// Get channel stats like total video views, total subscribers, total videos, total likes etc.
const getChannelStats = asyncHandler(async (req, res) => {
    
});

const getChannelVideos = asyncHandler(async (req, res) => {
    
});

export {
	getChannelStats, 
    getChannelVideos
};