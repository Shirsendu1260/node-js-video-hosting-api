import { Router } from 'express';
import { 
	signUpUser, 
    signInUser, 
    signOutUser, 
    refreshAccessToken, 
    getAuthUser, 
    updateProfileDetails, 
    updateProfileAvatar, 
    updateProfileCoverImage, 
    changePassword,
    getUserChannelDetails,
    getWatchHistory
} from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { authLimiter, signUpLimiter } from '../middlewares/rateLimiter.middleware.js';



const router = Router();



////////////////////////////////  PUBLIC ROUTES  ////////////////////////////////

/**
 * @openapi
 * /user/sign-up:
 *   post:
 *     tags:
 *       - User
 *     summary: Register a new user
 *     description: >
 *       Creates a new user account. Avatar image is required and Cover image is optional. 
 *       Rate limited to 5 sign-up requests per IP per day.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - username
 *               - email
 *               - gender
 *               - password
 *               - confirmedPassword
 *               - avatar
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Test User
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 example: testuser
 *               email:
 *                 type: string
 *                 format: email
 *                 example: testuser@example.com
 *               gender:
 *                 type: string
 *                 enum: [M, F, O]
 *                 example: F
 *               password:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 description: Password must include uppercase, lowercase, and number.
 *                 example: Secret@123
 *               confirmedPassword:
 *                 type: string
 *                 example: Secret@123
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Required avatar image (jpg, jpeg, png files are allowed, max 15MB).
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: Optional avatar image (jpg, jpeg, png files are allowed, max 15MB).
 *     responses:
 *       201:
 *         description: User signed up successfully.
 *       400:
 *         description: Sign-up validation error or missing avatar file.
 *       409:
 *         description: Username or email already exists.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/sign-up').post(
	signUpLimiter, // Max 5 account creation per IP per 'window'

	// Request hits /sign-up -> Multer middleware runs first (parses incoming files from the form)
    // -> Files available on req.files -> signUpUser controller runs

    /* Multer always stores files in arrays because upload.fields() supports multiple 
    files per field. Even with maxCount: 1, it's still an array with one item.
	upload.fields([...]) --> tells Multer to look for two specific file fields in the incoming multipart/form-data request:
	avatar -> max 1 file
	coverImage -> max 1 file
	After Multer processes them, signUpUser function can access them via req.files.avatar[0] and req.files.coverImage[0].
	Multer is middleware, meaning it runs before our controller and attaches data to the req object (req.files). 
	This is the standard Express pattern: middleware enriches the request, controller uses it. */

	upload.fields([
		{ name: 'avatar', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 }
	]),

	signUpUser
); // Example -> http://localhost:8000/api/v1/users/sign-up

/**
 * @openapi
 * /user/sign-in:
 *   post:
 *     tags:
 *       - User
 *     summary: Log in an existing user
 *     description: >
 *       Authenticates a user using username or email and password.
 *       Returns access and refresh tokens in both cookies and response body.
 *       Rate limited to 6 sign-in requests per IP per 15 minutes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: testuser
 *               email:
 *                 type: string
 *                 format: email
 *                 example: testuser@example.com
 *               password:
 *                 type: string
 *                 example: Secret@123
 *           examples:
 *             withEmail:
 *               summary: Sign-in with email
 *               value:
 *                 email: testuser@example.com
 *                 password: Secret@123
 *             withUsername:
 *               summary: Sign-in with username
 *               value:
 *                 username: testuser
 *                 password: Secret@123
 *     responses:
 *       200:
 *         description: User signed in successfully.
 *       400:
 *         description: Sign-in validation error.
 *       401:
 *         description: Invalid password.
 *       404:
 *         description: User not found.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/sign-in').post(authLimiter, signInUser);

// As in the controller, we used req.params to get 'username', so here also we need to use 'username' with ':' as a prefix
/**
 * @openapi
 * /user/c/{username}:
 *   get:
 *     tags:
 *       - User
 *     summary: Get profile details of a channel (user).
 *     description: >
 *       Returns channel profile details which includes subscribers count, subscribed channels count,
 *       and whether the currently authenticated user is subscribed to this channel or not.
 *       No auth required, it is a public endpoint.
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         example: testuser
 *     responses:
 *       200:
 *         description: Channel fetched successfully.
 *       400:
 *         description: Invalid or missing username.
 *       404:
 *         description: Channel not found.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/c/:username').get(getUserChannelDetails);



////////////////////////////////  AUTHENTICATED ROUTES  ////////////////////////////////

/**
 * @openapi
 * /user/sign-out:
 *   post:
 *     tags:
 *       - User
 *     summary: Sign out the current authenticated user.
 *     description: >
 *       Clears the access and refresh tokens from cookies.
 *       Removes refresh token from database.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User signed out successfully.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/sign-out').post(verifyJWT, signOutUser); 
// verifyJWT -> Middleware here 
// Then 'signOutUser' will be called with the help of next() in 'verifyJWT' middleware
// At this point, we have access of req.user (created by 'verifyJWT' middlware) in 'signOutUser'

/**
 * @openapi
 * /user/refresh-access-token:
 *   post:
 *     tags:
 *       - User
 *     summary: Refresh the access token
 *     description: >
 *       Issues a new access token to the user using a valid refresh token sent from the user.
 *       The refresh token can be sent via cookie or in the request body.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refrsehToken:
 *                 type: string
 *                 description: Refresh token (only needed if not sent via cookie)
 *     responses:
 *       200:
 *         description: Access token is refreshed successfully.
 *       401:
 *         description: Invalid or expired refresh token.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/refresh-access-token').post(authLimiter, refreshAccessToken);
// No need to apply middleware 'verifyJWT' as checking is already done in this routes's controller function

/**
 * @openapi
 * /user/get-auth-user:
 *   get:
 *     tags:
 *       - User
 *     summary: Get the current authenticated user.
 *     description: >
 *       Returns the profile of the current authenticated user based on JWT token.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user is fetched successfully.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/get-auth-user').get(verifyJWT, getAuthUser);

/**
 * @openapi
 * /user/update-profile-details:
 *   patch:
 *     tags:
 *       - User
 *     summary: Update profile details.
 *     description: >
 *       Updates authenticated user's fullname, username, email, and gender.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - username
 *               - email
 *               - gender
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Test User New
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 example: testusernew
 *               email:
 *                 type: string
 *                 format: email
 *                 example: testusernew@example.com
 *               gender:
 *                 type: string
 *                 enum: [M, F, O]
 *                 example: F
 *     responses:
 *       200:
 *         description: Profile updated successfully.
 *       400:
 *         description: Profile update validation error.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       409:
 *         description: Username or email already exists.
 *       500:
 *         description: Unable to update the user details, please try again.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/update-profile-details').patch(verifyJWT, updateProfileDetails);

/**
 * @openapi
 * /user/update-profile-avatar:
 *   patch:
 *     tags:
 *       - User
 *     summary: Update profile avatar image.
 *     description: >
 *       Replaces the current avatar with a new uploaded image.
 *       The old avatar is deleted from Cloudinary before uploading the new one.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: New avatar image (jpg, jpeg, png files are allowed, max 15MB)
 *     responses:
 *       200:
 *         description: Avatar image is updated successfully.
 *       400:
 *         description: Missing avatar image or old avatar deletion failed or upload failed.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/update-profile-avatar').patch(verifyJWT, upload.single('avatar'), updateProfileAvatar); // upload.single('avatar'): Upload single file via 'avatar' field

/**
 * @openapi
 * /user/update-profile-coverimage:
 *   patch:
 *     tags:
 *       - User
 *     summary: Update profile cover image.
 *     description: >
 *       Replaces the current cover image with a new uploaded image.
 *       The old cover image is deleted from Cloudinary before uploading the new one.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - coverImage
 *             properties:
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: New cover image (jpg, jpeg, png files are allowed, max 15MB)
 *     responses:
 *       200:
 *         description: Cover image is updated successfully.
 *       400:
 *         description: Missing cover image or old cover image deletion failed or upload failed.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/update-profile-coverimage').patch(verifyJWT, upload.single('coverImage'), updateProfileCoverImage);

/**
 * @openapi
 * /user/change-password:
 *   patch:
 *     tags:
 *       - User
 *     summary: Change account password.
 *     description: >
 *       Verifies the old password and then sets a new one. The new password must meet the password rules.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *               - confirmedPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: OldPass@123
 *               newPassword:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 description: Password must include uppercase, lowercase, and number.
 *                 example: NewPass@456
 *               confirmedPassword:
 *                 type: string
 *                 example: NewPass@456
 *     responses:
 *       200:
 *         description: Password changed successfully.
 *       400:
 *         description: Password validation error or incorrect old password.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/change-password').patch(verifyJWT, changePassword);

/**
 * @openapi
 * /user/watch-history:
 *   get:
 *     tags:
 *       - User
 *     summary: Get watch history of the authenticated user.
 *     description: >
 *       Returns a paginated list of the user's previously watched videos, with creator details.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 4
 *         description: Number of videos per page
 *     responses:
 *       200:
 *         description: Watch history fetched successfully (empty array if no history).
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       404:
 *         description: User not found.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/watch-history').get(verifyJWT, getWatchHistory);


export default router;
