import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.model.js';
import { cloudinaryUploader } from '../utils/cloudinary.js';
import Joi from 'joi';

const subFolder = 'user/';

const signUpUser = asyncHandler(async (req, res) => {
	/******** Step 1: Get user details from request object ********/
    const { fullName, username, email, gender, password } = req.body;
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
    });

    const { error, value } = validatorSchema.validate(
    	{ fullName, username, email, gender, password }, 
    	{ abortEarly: false } // Ensures Joi finds all errors, not just the first one
    );
    
    if(error) {
    	// console.log(error);
    	const errorArray = error.details.map(detail => detail.message); // Collect all error messages into an array
    	throw new ApiError(400, 'Validation failed.', errorArray); // 400: Bad Request, means server cannot process the request because of a client-side error
    }


	/******** Step 3: Check if user already exists or not ********/
    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    }); // Finds the first matching document from 'users' collection with matching username or email

    if(existingUser) {
        throw new ApiError(409, 'User already exists.'); // 409: Conflict, means the requet could not be completed because it conflicts with the current state of the target resource on the server (User data already exists)
    }


	/******** Step 4: Check for files ********/
    // Multer gives access of req.files
    // if req.files?.avatar is undefined, req.files?.avatar[0] will throw error. Safer way:
    const avatarOnLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageOnLocalPath = req.files?.coverImage?.[0]?.path;

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
    That's exactly why req.files?.coverImage?.[0]?.path returns 
    undefined instead of crashing — the key simply doesn't exist. */


	/******** Step 5: If they exist, then upload in Cloudinary ********/
    if(!avatarOnLocalPath) {
        throw new ApiError(400, 'Avatar image is required.');
    }

    const avatarOnCloudinary = await cloudinaryUploader(avatarOnLocalPath, subFolder);
    const coverImageOnCloudinary = coverImageOnLocalPath ? await cloudinaryUploader(coverImageOnLocalPath, subFolder) : null;

    if(!avatarOnCloudinary) {
        throw new ApiError(400, 'Avatar image is required.');
    }


	/******** Step 6: Create user object and entry the data in database ********/
    const user = await User.create({
        fullName,
        username: username.toLowerCase(),
        email,
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

const signInUser = asyncHandler(async (req, res) => {
	return res.status(200).json({
		message: 'User signed in successfully'
	});
});

export { signUpUser, signInUser };