import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Like } from "../models/like.model.js";
import type { IErrorMessage } from "../utils/ApiError.js";
import mongoose, { isValidObjectId } from 'mongoose';



const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
});

const togglePostLike = asyncHandler(async (req, res) => {
    const { postId } = req.params;
});

const getLikedVideos = asyncHandler(async (req, res) => {
    
});

export {
    toggleCommentLike,
    togglePostLike,
    toggleVideoLike,
    getLikedVideos
};