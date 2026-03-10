import { Router } from 'express';
import { signUpUser, signInUser } from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();

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
	After Multer processes them, your signUpUser function can access them via req.files.avatar[0] and req.files.coverImage[0].
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
	Multer is middleware — meaning it runs before your controller and attaches data to the req object (req.files. 
	This is the standard Express pattern: middleware enriches the request, controller uses it. */

	upload.fields([
		{ name: 'avatar', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 }
	]),

	signUpUser
); // Example -> http://localhost:8000/api/v1/users/sign-up

router.route('/sign-in').post(signInUser);

export default router;