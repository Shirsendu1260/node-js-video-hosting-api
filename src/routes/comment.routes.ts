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

router.route('/v/:videoId').get(getComments);
router.route('/p/:postId').get(getComments);
router.route('/v/:videoId/reply/:parentCommentId').get(getNestedComments);
router.route('/p/:postId/reply/:parentCommentId').get(getNestedComments);



////////////////////////////////  AUTHENTICATED ROUTES  ////////////////////////////////

router.route('/v/:videoId/add').post(verifyJWT, addComment);
router.route('/p/:postId/add').post(verifyJWT, addComment);
router.route('/v/:videoId/reply/:parentCommentId/add').post(verifyJWT, addComment);
router.route('/p/:postId/reply/:parentCommentId/add').post(verifyJWT, addComment);
router.route('/:commentId').patch(verifyJWT, updateComment);
router.route('/:commentId').delete(verifyJWT, deleteComment);



export default router;