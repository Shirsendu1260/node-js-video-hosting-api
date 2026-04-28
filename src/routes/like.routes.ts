import { Router } from 'express';
import {
    toggleCommentLikeDislike,
    togglePostLikeDislike,
    toggleVideoLikeDislike,
    getLikedVideos,
    getLikedPosts
} from '../controllers/like.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';



const router = Router();



////////////////////////////////  AUTHENTICATED ROUTES  ////////////////////////////////

router.route('/video/:videoId').post(verifyJWT, toggleVideoLikeDislike);
router.route('/post/:postId').post(verifyJWT, togglePostLikeDislike);
router.route('/comment/:commentId').post(verifyJWT, toggleCommentLikeDislike);
router.route('/liked-videos').get(verifyJWT, getLikedVideos);
router.route('/liked-posts').get(verifyJWT, getLikedPosts);



export default router;
