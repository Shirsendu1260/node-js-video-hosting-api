import { Router } from 'express';
import {
    createPost,
    getUserPosts,
    updatePost,
    deletePost
} from '../controllers/post.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';



const router = Router();



////////////////////////////////  PUBLIC ROUTES  ////////////////////////////////

router.route('/p/:username').get(getUserPosts);



////////////////////////////////  AUTHENTICATED ROUTES  ////////////////////////////////

router.route('/create').post(verifyJWT, upload.single('image'), createPost);
router.route('/p/:postId').patch(verifyJWT, updatePost);
router.route('/p/:postId').delete(verifyJWT, deletePost);



export default router;
