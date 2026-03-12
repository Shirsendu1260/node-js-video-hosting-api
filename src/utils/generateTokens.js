import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';

export const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessJWTToken();
        const refreshToken = user.generateRefreshJWTToken();

        // Save refresh token in DB
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        /* validateBeforeSave: false — skips Mongoose validation when saving. Important here because 
        we are only updating refreshToken, not submitting the full user form, so you don't want 
        password/email validators to run again. */

        return { accessToken, refreshToken };
    } catch(error) {
        throw new ApiError(500, error?.message || 'Unable to create access and refresh tokens.');
    }
};