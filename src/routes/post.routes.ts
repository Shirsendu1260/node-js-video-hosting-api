import { Router } from 'express';
import {
    createPost,
    getUserPosts,
    updatePost,
    deletePost
} from '../controllers/post.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';



const router = Router();



////////////////////////////////  PUBLIC ROUTES  ////////////////////////////////

router.route('/channel/post/:username').get(getUserPosts);



////////////////////////////////  AUTHENTICATED ROUTES  ////////////////////////////////

router.route('/channel/post/create').post(verifyJWT, createPost);
router.route('/channel/post/:postId').patch(verifyJWT, updatePost);
router.route('/channel/post/:postId').delete(verifyJWT, deletePost);



export default router;