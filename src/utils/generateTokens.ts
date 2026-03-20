import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import type { UserDocument } from '../models/user.model.js';

export const generateAccessAndRefreshTokens = async (
    userId: UserDocument['_id']
): Promise<{ accessToken: string, refreshToken: string }> => {
    try {
        let user = await User.findById(userId);
        if (!user) throw new ApiError(404, "User not found.");

        // generateAccessJWTToken() & generateRefreshJWTToken return Promise<string>.
        // we need 'await' to unwrap the Promise and get the actual string.
        // Function declared as async -> always returns a Promise -> always needs await when calling it
        const accessToken = await user.generateAccessJWTToken();
        const refreshToken = await user.generateRefreshJWTToken();

        // Save refresh token in DB
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        /* validateBeforeSave: false — skips Mongoose validation when saving. Important here because 
        we are only updating refreshToken, not submitting the full user form, so we don't want 
        password/email validators to run again. */

        console.log('TOKEN USER:', user.fullName);

        return { accessToken, refreshToken };
    } catch(error: unknown) {
        // console.error('Catch block reached while generating tokens! ERROR:', error.message);

        // If what was thrown is already an ApiError (like the 404 above), just re-throw it as-is
        if(error instanceof ApiError) throw error;

        // Otherwise throw a generic 500
        throw new ApiError(500, error instanceof Error ? error.message : 'Unable to create access and refresh tokens.');
    }
};