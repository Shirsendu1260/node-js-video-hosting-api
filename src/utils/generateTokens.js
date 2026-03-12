import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';

export const generateAccessAndRefreshTokens = async (userId) => {
    try {
        let user = await User.findById(userId);
        const accessToken = await user.generateAccessJWTToken();
        const refreshToken = await user.generateRefreshJWTToken();

        // Save refresh token in DB
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        /* validateBeforeSave: false — skips Mongoose validation when saving. Important here because 
        we are only updating refreshToken, not submitting the full user form, so you don't want 
        password/email validators to run again. */

        console.log('TOKEN USER:', user.fullName);

        return { accessToken, refreshToken };
    } catch(error) {
        // console.error('Catch block reached while generating tokens! ERROR:', error.message);
        throw new ApiError(500, error?.message || 'Unable to create access and refresh tokens.');
    }
};