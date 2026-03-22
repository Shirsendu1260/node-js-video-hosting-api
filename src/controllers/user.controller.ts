import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import { cloudinaryUploader, cloudinaryDeleter } from '../utils/cloudinary.js';
import { generateAccessAndRefreshTokens } from '../utils/generateTokens.js';
import { COOKIE_SEND_OPTIONS } from '../constants.js';
import jwt from 'jsonwebtoken';
import type { JwtPayload, Secret } from 'jsonwebtoken';
import type { IErrorMessage } from "../utils/ApiError.js";
import Joi from 'joi';



const subFolder = 'user/';



////////////////////////////////  SIGN UP  ////////////////////////////////
const signUpUser = asyncHandler(async (req, res) => {
	/******** Step 1: Get user details from request object ********/
    const { fullName, username, email, gender, password, confirmedPassword } = req.body as {
        fullName: string,
        username: string,
        email: string,
        gender: string,
        password: string,
        confirmedPassword: string
    };
    // req.body is typed as 'any' by Express by default
    // We destructure and immediately cast to a known shape
    // console.log(fullName, username, email, gender, password);


	/******** Step 2: Validate request data	********/
    const validatorSchema = Joi.object({
    	fullName: Joi.string()
                        .trim()
                        .required()
                        .messages({
                          'string.empty': 'Fullname is required.', // The field has empty string
                          'any.required': 'Fullname is required.' // The field is completely absent from 'req'
                        }),
    	username: Joi.string()
                        .trim()
                        .alphanum()
                        .min(3)
                        .max(30)
                        .required()
                        .messages({
                          'string.alphanum': 'Username can only contain letters and numbers.',
                          'string.min': 'Username must be at least 3 characters.',
                          'string.max': 'Username cannot exceed 30 characters.',
                          'string.empty': 'Username is required.',
                          'any.required': 'Username is required.'
                        }),
    	email: Joi.string()
                    .trim()
                    .email()
                    .required()
                    .messages({
                      'string.email': 'Please provide a valid email address.',
                      'string.empty': 'Email is required.',
                      'any.required': 'Email is required.'
                    }),
    	gender: Joi.string()
                    .trim()
                    .valid('M', 'F', 'O')
                    .required()
                    .messages({
                      'any.only': 'Gender must be Male, Female, or Others.',
                      'any.required': 'Gender is required.'
                    }),
    	password: Joi.string()
                    .alphanum()
                    .min(6)
                    .max(50)
                    .required()
                    .messages({
                      'string.min': 'Password must be at least 6 characters.',
                      'string.max': 'Password cannot exceed 50 characters.',
                      'string.empty': 'Password is required.',
                      'any.required': 'Password is required.'
                    }),
        confirmedPassword: Joi.string()
                                .valid(Joi.ref('password'))
                                // Joi.ref('password') -> Reference the value of 'password' field
                                // .valid() -> The value must match this reference
                                .required()
                                .messages({
                                    'any.only': 'Confirmed password must be exactly same as the password.',
                                    'string.empty': 'Confirmed password is required.',
                                    'any.required': 'Confirmed password is required.'
                                })
    });

    const { error } = validatorSchema.validate(
    	{ fullName, username, email, gender, password, confirmedPassword }, 
    	{ abortEarly: false } // Ensures Joi finds all errors, not just the first one
    );
    
    if(error) {
        // detail.path[0] is typed as 'string | number' by Joi
        // We cast to string because our field names are always strings
    	// console.log(error);
    	const errorArray: IErrorMessage[] = error.details.map(detail => {
            return { [detail.path[0] as string]: detail.message };
            // '[]' around 'detail.path[0]' tells TS - don't use this as a literal key name, evaluate it as a variable first
            /* const field = 'email';
            { field: 'msg' }; // Wrong -> gives { field: 'msg' }
            { [field]: 'msg' }; // Correct -> gives { email: 'msg' } */
        }); // Collect all error messages into an array
        console.log(errorArray);
    	throw new ApiError(400, 'Sign-up validation failed.', errorArray); // 400: Bad Request, means server cannot process the request because of a client-side error
    }


	/******** Step 3: Check if user already exists or not ********/
    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    }); // Finds the first matching document from 'users' collection with matching username or email

    if(existingUser) {
        throw new ApiError(409, 'User already exists.'); // 409: Conflict, means the request could not be completed because it conflicts with the current state of the target resource on the server (Current state i.e. User data already exists)
    }


	/******** Step 4: Check for files ********/
    // req.files has two possible shapes depending on which Multer method we use:
    // upload.single()  ->  Express.Multer.File[]  (array)
    // upload.fields()  ->  { [fieldname: string]: Express.Multer.File[] }  (object/dictionary)
    // Since we used upload.fields(), we cast it to the dictionary shape
    // so TypeScript knows files.avatar and files.coverImage are valid keys
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    // if files?.avatar is undefined, files?.avatar[0] will throw error. Below is the safer way
    const avatarOnLocalPath = files?.avatar?.[0]?.path;
    const coverImageOnLocalPath = files?.coverImage?.[0]?.path;

    /* It's an object that Multer attaches to the request after processing 
    uploaded files. Without Multer, req.files would be undefined. */

    /* If a user uploads both avatar and coverImage, req.files will be:
    {
        avatar: [
            {
                fieldname: 'avatar',        // Name of the form field
                originalname: 'dada.jpg',   // Original file name from user's device
                encoding: '7bit',           // File encoding
                mimetype: 'image/jpeg',     // File type
                destination: './public/temp', // Where Multer saved it locally
                filename: 'dada.jpg',       // Name given by Multer on disk
                path: './public/temp/dada.jpg', // Full local path <- this is what you use
                size: 102400                // File size in bytes
            }
        ],
        coverImage: [
            {
                fieldname: 'coverImage',
                originalname: 'cover.png',
                encoding: '7bit',
                mimetype: 'image/png',
                destination: './public/temp',
                filename: 'cover.png',
                path: './public/temp/cover.png',
                size: 204800
            }
        ]
    } */

    /* If user only uploads avatar (no coverImage):
    {
        avatar: [
            {
                path: './public/temp/dada.jpg',
                // ...rest of fields
            }
        ]
        // coverImage key won't exist at all
    }
    That's exactly why files?.coverImage?.[0]?.path returns 
    undefined instead of crashing — the key simply doesn't exist. */


	/******** Step 5: If they exist, then upload in Cloudinary ********/
    if(!avatarOnLocalPath) {
        throw new ApiError(400, 'Avatar image is required.');
    }

    const avatarOnCloudinary = await cloudinaryUploader(avatarOnLocalPath, subFolder);
    const coverImageOnCloudinary = coverImageOnLocalPath ? await cloudinaryUploader(coverImageOnLocalPath, subFolder) : null;

    if(!avatarOnCloudinary) {
        throw new ApiError(400, 'Unable to upload the avatar image, please try again.');
    }


	/******** Step 6: Create user object and entry the data in database ********/
    const user = await User.create({
        fullName,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        gender,
        avatar: avatarOnCloudinary.secure_url,
        coverImage: coverImageOnCloudinary?.secure_url ?? '', // coverImage may or may not be uploaded by user
        password // At this point password is hashed using pre() middleware
    });


	/******** Step 7: Remove password and refresh token from response object ********/
    const userJustCreated = await User.findById(user._id).select('-password -refreshToken'); // Exclude password and refreshToken from response


	/******** Step 8: Check for user creation ********/
    if(!userJustCreated) {
        throw new ApiError(500, 'Unable to register the user, please try again.'); // 500: Internal Server Error
    }


	/******** Step 9: Return response ********/
    return res.status(201).json( // 201: Created, means new resource created on DB
        // Create ApiResponse object
        new ApiResponse(201, userJustCreated, 'User signed up successfully.')
    );
});



////////////////////////////////  SIGN IN  ////////////////////////////////
const signInUser = asyncHandler(async (req, res) => {
    /******** Step 1: Collect request data ********/
    let { username, email, password } = req.body as {
        username?: string,
        email?: string,
        password: string
    };
    username = username?.toLowerCase();
    email = email?.toLowerCase();
    // console.log(username, email);


    /******** Step 2: Check for login credentials (username, email, password) from request ********/
    // User should be able to login with either one
    const validatorSchema = Joi.object({
        username: Joi.string()
                        .trim()
                        .messages({
                          'string.empty': 'Username is required.',
                          'any.required': 'Username is required.'
                        }),
        email: Joi.string()
                    .trim()
                    .email()
                    .messages({
                      'string.email': 'Please provide a valid email address.',
                      'string.empty': 'Email is required.',
                      'any.required': 'Email is required.'
                    }),
        password: Joi.string()
                        .required()
                        .messages({
                          'string.empty': 'Password is required.',
                          'any.required': 'Password is required.'
                        })
    })
    .or('username', 'email')
    .messages({
      'object.missing': 'Please provide either username or email.'
    });

    // Validate
    const { error } = validatorSchema.validate(
        { username, email, password },
        { abortEarly: false }
    )

    // Collect error messages
    if(error) {
        const errorArray: IErrorMessage[] = error.details.map(detail => {
            return { [detail.path[0] as string]: detail.message };
        });
        console.log(errorArray);
        throw new ApiError(400, 'Sign-in validation failed.', errorArray);
    }


    /******** Step 3: Find the user in DB ********/
    // Build $or conditions array without null, because Mongoose's TS types don't accept null
    const orConditions = [];
    if(username) orConditions.push({ username });
    if(email) orConditions.push({ email });
    let user = await User.findOne({
        $or: orConditions
    });


    /******** Step 4: If user exists, check entered password is correct or not ********/
    if(!user) {
        throw new ApiError(404, 'User not found.');
    }


    /******** Step 5: If password is correct, generate access and refresh JWT tokens ********/
    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid) {
        throw new ApiError(401, 'Invalid password.');
    }


    /******** Step 6: Prepare to send this tokens to user via secure cookies ********/
    // `req.user._id` comes from the **auth middleware (verifyJWT)** which attaches the user to the request. 
    // This is why `verifyJWT` middleware must run before `signOutUser`.
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    user = await User.findById(user._id).select('-password -refreshToken'); // At this point, new refresh token is saved in Db


	/******** Step 7: Send login success response and the tokens within cookie ********/
    return res.status(200)
                .cookie('accessToken', accessToken, COOKIE_SEND_OPTIONS)
                .cookie('refreshToken', refreshToken, COOKIE_SEND_OPTIONS)
                .json(
                    new ApiResponse(200, { user, accessToken, refreshToken }, 'User signed in successfully.')
                );
});



////////////////////////////////  SIGN OUT  ////////////////////////////////
const signOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user?._id, 
        {
            $set: { refreshToken: undefined } // Makes -> refreshToken: null
        }, // what to update
        {
            returnDocument: 'after'
        } // Return response AFTER the value is updated (i.e with 'refreshToken' deleted/cleared)
    );

    return res.status(200)
                .clearCookie('accessToken', COOKIE_SEND_OPTIONS) // Given by cookie-parser
                .clearCookie('refreshToken', COOKIE_SEND_OPTIONS)
                .json(new ApiResponse(200, {}, 'User signed out successfully.')); // {} -> sending empty data
});



////////////////////////////////  REFRESH ACCESS TOKEN  ////////////////////////////////
const refreshAccessToken = asyncHandler(async (req, res) => {
    /******** Step 1: Collect refresh token from cookie ********/
    const userCollectedRefreshToken: string | undefined = req.cookies.refreshToken || req.body.refreshToken;

    if(!userCollectedRefreshToken) {
        throw new ApiError(401, 'Unauthorized request.');
    }


    try {
        /******** Step 2: Verify the collected refresh token with one that resides in server (DB) ********/
        const secretKey = process.env.REFRESH_TOKEN_SECRET_KEY;
        if(!secretKey) throw new ApiError(500, 'REFRESH_TOKEN_SECRET_KEY is not defined.');
        const secret: Secret = secretKey;

        const decodedUserCollectedRefreshToken = jwt.verify(userCollectedRefreshToken, secret) as JwtPayload;
        // Token in client's cookie -> encrypted
        // Token in DB we stored -> raw


        /******** Step 3: Get user details with the help of decoded refresh token's payload ********/
        const user = await User.findById(decodedUserCollectedRefreshToken?._id).select('-password');

        if(!user) {
            throw new ApiError(401, 'Invalid refresh token.');
        }


        /******** Step 4: Check both refresh tokens are same or not, if same then user is authenticated ********/
        if(userCollectedRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, 'Refresh token is expired or used.');
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);


        /******** Step 5: Send successful response with the tokens sent through cookie ********/
        return res.status(200)
                    .cookie('accessToken', accessToken, COOKIE_SEND_OPTIONS)
                    .cookie('refreshToken', refreshToken, COOKIE_SEND_OPTIONS)
                    .json(
                        new ApiResponse(200, { accessToken, refreshToken }, 'Access token is refreshed successfully.')
                    );
    }
    catch(error: unknown) {
        if (error instanceof ApiError) throw error
        throw new ApiError(401, error instanceof Error ? error.message : 'Invalid refresh token');
    }
});



////////////////////////////////  GET CURRENT AUTHENTICATED USER  ////////////////////////////////
const getAuthUser = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, req.user, 'Authenticated user is fetched successfully.')
    )
});



////////////////////////////////  UPDATE PROFILE  ////////////////////////////////
const updateProfileDetails = asyncHandler(async (req, res) => {
    const { fullName, username, email, gender } = req.body as {
        fullName: string
        username: string
        email: string
        gender: string
    };
    // console.log(fullName, username, email, gender);

    const validatorSchema = Joi.object({
        fullName: Joi.string()
                        .trim()
                        .required()
                        .messages({
                          'string.empty': 'Fullname is required.',
                          'any.required': 'Fullname is required.'
                        }),
        username: Joi.string()
                        .trim()
                        .alphanum()
                        .min(3)
                        .max(30)
                        .required()
                        .messages({
                          'string.alphanum': 'Username can only contain letters and numbers.',
                          'string.min': 'Username must be at least 3 characters.',
                          'string.max': 'Username cannot exceed 30 characters.',
                          'string.empty': 'Username is required.',
                          'any.required': 'Username is required.'
                        }),
        email: Joi.string()
                    .trim()
                    .email()
                    .required()
                    .messages({
                      'string.email': 'Please provide a valid email address.',
                      'string.empty': 'Email is required.',
                      'any.required': 'Email is required.'
                    }),
        gender: Joi.string()
                    .trim()
                    .valid('M', 'F', 'O')
                    .required()
                    .messages({
                      'any.only': 'Gender must be Male, Female, or Others.',
                      'any.required': 'Gender is required.'
                    })
    });

    const { error } = validatorSchema.validate(
        { fullName, username, email, gender }, 
        { abortEarly: false } // Ensures Joi finds all errors, not just the first one
    );
    
    if(error) {
        // console.log(error);
        const errorArray: IErrorMessage[] = error.details.map(detail => {
            return { [detail.path[0] as string]: detail.message };
        });
        console.log(errorArray);
        throw new ApiError(400, 'Profile update validation failed.', errorArray); // 400: Bad Request, means server cannot process the request because of a client-side error
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                username: username.toLowerCase(),
                email: email.toLowerCase(),
                gender
            }
        },
        {
            returnDocument: 'after'
        }
    ).select('-password -refreshToken');

    if(!user) {
        throw new ApiError(500, 'Unable to update the user details, please try again.');
    }

    return res.status(200).json(
        new ApiResponse(200, user, 'Profile updated successfully.')
    );
});



////////////////////////////////  UPDATE PROFILE AVATAR  ////////////////////////////////
const updateProfileAvatar = asyncHandler(async (req, res) => {
    const file = req.file as Express.Multer.File | undefined;
    const avatarOnLocalPath = file?.path;

    if(!avatarOnLocalPath) {
        throw new ApiError(400, 'Avatar image is required.');
    }

    const oldAvatarUrl = req.user?.avatar;
    if(!oldAvatarUrl) throw new ApiError(400, "Avatar URL not found.");

    // Delete old uploaded avatar image from cloudinary
    // Avatar url cannot be absent in db for each user
    const isOldAvatarDeletedFromCloudinary = await cloudinaryDeleter(oldAvatarUrl);
    if(!isOldAvatarDeletedFromCloudinary) {
        throw new ApiError(400, 'Unable to delete the old uploaded avatar image, please try again.');
    }

    const avatarOnCloudinary = await cloudinaryUploader(avatarOnLocalPath, subFolder);

    // In avatarOnCloudinary?.secure_url, added optional chaining because cloudinaryUploader returns UploadApiResponse | null, so it won't crash
    if(!avatarOnCloudinary?.secure_url) {
        throw new ApiError(400, 'Unable to upload the avatar image, please try again.');
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { avatar: avatarOnCloudinary?.secure_url }
        },
        { returnDocument: 'after' }
    ).select('-password -refreshToken');

    return res.status(200).json(
        new ApiResponse(200, user, 'Avatar image is updated successfully.')
    );
});



////////////////////////////////  UPDATE PROFILE COVERIMAGE  ////////////////////////////////
const updateProfileCoverImage = asyncHandler(async (req, res) => {
    const file = req.file as Express.Multer.File | undefined;
    const coverImageOnLocalPath = file?.path;

    if(!coverImageOnLocalPath) {
        throw new ApiError(400, 'Cover image is required.');
    }

    const oldCoverImgUrl = req.user?.coverImage;
    if(oldCoverImgUrl) {
        // Delete old uploaded cover image from cloudinary
        // Cover image url may or may not present in db for each user
        const isOldAvatarDeletedFromCloudinary = await cloudinaryDeleter(oldCoverImgUrl);
        if(!isOldAvatarDeletedFromCloudinary) {
            throw new ApiError(400, 'Unable to delete the old uploaded cover image, please try again.');
        }
    }

    const coverImageOnCloudinary = await cloudinaryUploader(coverImageOnLocalPath, subFolder);

    // In coverImageOnCloudinary?.secure_url, added optional chaining because cloudinaryUploader returns UploadApiResponse | null, so it won't crash
    if(!coverImageOnCloudinary?.secure_url) {
        throw new ApiError(400, 'Unable to upload the cover image, please try again.');
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { coverImage: coverImageOnCloudinary?.secure_url }
        },
        { returnDocument: 'after' }
    ).select('-password -refreshToken');

    return res.status(200).json(
        new ApiResponse(200, user, 'Cover image is updated successfully.')
    );
});



////////////////////////////////  CHANGE PASSWORD  ////////////////////////////////
const changePassword = asyncHandler(async (req, res) => {
    /******** Step 1: Collect data ********/
    const { oldPassword, newPassword, confirmedPassword } = req.body as {
        oldPassword: string
        newPassword: string
        confirmedPassword: string
    };


    /******** Step 2: As user is logged in, gather user details ********/
    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(404, "User not found.");
    }


    /******** Step 3: Validate given passwords ********/
    const isPasswordValid = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordValid) {
        throw new ApiError(400, 'Incorrect old password.');
    }

    if(newPassword !== confirmedPassword) {
        throw new ApiError(400, 'New and confirmed passwords are not same.');
    }


    /******** Step 4: Set new password ********/
    user.password = newPassword; 
    // At this stage, before save(), pre() hook will be run to hash this new password
    await user.save({ validateBeforeSave: false });


    /******** Step 5: Return response ********/
    return res.status(200).json(
        new ApiResponse(200, {}, 'Password changed successfully.')
    );
});



export { 
    signUpUser, 
    signInUser, 
    signOutUser, 
    refreshAccessToken, 
    getAuthUser, 
    updateProfileDetails, 
    updateProfileAvatar, 
    updateProfileCoverImage, 
    changePassword
};