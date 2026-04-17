import { Router } from 'express';
import {
    getComments,
    getNestedComments,
    addComment, 
    updateComment,
    deleteComment
} from '../controllers/comment.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';



const router = Router();



////////////////////////////////  PUBLIC ROUTES  ////////////////////////////////

router.route('/comment/:videoId').get(getComments);
router.route('/comment/:postId').get(getComments);
router.route('/comment/:videoId/:parentCommentId').get(getNestedComments);
router.route('/comment/:postId/:parentCommentId').get(getNestedComments);



////////////////////////////////  AUTHENTICATED ROUTES  ////////////////////////////////

router.route('/comment/:videoId/add').post(verifyJWT, addComment);
router.route('/comment/:postId/add').post(verifyJWT, addComment);
router.route('/comment/:videoId/:parentCommentId/add').post(verifyJWT, addComment);
router.route('/comment/:postId/:parentCommentId/add').post(verifyJWT, addComment);
router.route('/comment/:commentId').patch(verifyJWT, updateComment);
router.route('/comment/:commentId').delete(verifyJWT, deleteComment);



export default router;