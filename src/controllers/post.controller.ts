import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { cloudinaryUploader, cloudinaryDeleter } from '../utils/cloudinary.js';
import type { IErrorMessage } from "../utils/ApiError.js";
import mongoose, { isValidObjectId } from 'mongoose';



const createPost = asyncHandler(async (req, res) => {
    
});

const getUserPosts = asyncHandler(async (req, res) => {
    
});

const updatePost = asyncHandler(async (req, res) => {
    
});

const deletePost = asyncHandler(async (req, res) => {
    
});

export {
    createPost,
    getUserPosts,
    updatePost,
    deletePost
};