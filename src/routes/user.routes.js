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
    changePassword
} from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';



const router = Router();



////////////////////////////////  PUBLIC ROUTES  ////////////////////////////////

router.route('/sign-up').post(
	/*
	Request hits /sign-up -> Multer middleware runs first (parses incoming files from the form)
    -> Files available on req.files -> signUpUser controller runs
    */

    /* Multer always stores files in arrays because upload.fields() supports multiple 
    files per field. Even with maxCount: 1, it's still an array with one item. */

	/*
    upload.fields([...]) — tells Multer to look for two specific file fields in the incoming multipart/form-data request:
	avatar -> max 1 file
	coverImage -> max 1 file
	After Multer processes them, signUpUser function can access them via req.files.avatar[0] and req.files.coverImage[0].
	*/

	/*
	The Full Request Flow (Big Picture):
	Client sends POST request
	Express app receives it
	app.use('/api/v1/users', userRouter)  <- mounts this router
	Router matches /sign-up
	Multer middleware processes files and req.files is available with the files information
	signUpUser controller handles logic
	Response sent back to client
	*/

	/*
	Multer is middleware — meaning it runs before your controller and attaches data to the req object (req.files). 
	This is the standard Express pattern: middleware enriches the request, controller uses it. */

	upload.fields([
		{ name: 'avatar', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 }
	]),

	signUpUser
); // Example -> http://localhost:8000/api/v1/users/sign-up

router.route('/sign-in').post(signInUser);



////////////////////////////////  AUTHENTICATED ROUTES  ////////////////////////////////

router.route('/sign-out').post(verifyJWT, signOutUser); 
// verifyJWT -> Middleware here 
// Then 'signOutUser' will be called with the help of next() in 'verifyJWT' middleware
// At this point, we have access of req.user (created by 'verifyJWT' middlware) in 'signOutUser'

router.route('/refresh-access-token').post(refreshAccessToken);
// No need to apply middleware 'verifyJWT' as checking is already done in this routes's controller function

router.route('/get-auth-user').get(verifyJWT, getAuthUser);
router.route('/update-profile-details').patch(verifyJWT, updateProfileDetails);
router.route('/update-profile-avatar').patch(verifyJWT, upload.single('avatar'), updateProfileAvatar); // upload.single('avatar'): Upload single file via 'avatar' field
router.route('/update-profile-coverimage').patch(verifyJWT, upload.single('coverImage'), updateProfileCoverImage);
router.route('/change-password').patch(verifyJWT, changePassword);



export default router;