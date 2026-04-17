import { Router } from 'express';
import {
    toggleCommentLikeDislike,
    togglePostLikeDislike,
    toggleVideoLikeDislike,
    getLikedVideos
} from '../controllers/like.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';



const router = Router();



////////////////////////////////  AUTHENTICATED ROUTES  ////////////////////////////////

router.route('/video/like/:videoId').post(verifyJWT, toggleVideoLikeDislike);
router.route('/post/like/:postId').post(verifyJWT, togglePostLikeDislike);
router.route('/comment/like/:commentId').post(verifyJWT, toggleCommentLikeDislike);
router.route('/video/all/liked').get(verifyJWT, getLikedVideos);



export default router;