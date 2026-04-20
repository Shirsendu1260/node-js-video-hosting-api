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

router.route('/:videoId').get(getComments);
router.route('/:postId').get(getComments);
router.route('/:videoId/:parentCommentId').get(getNestedComments);
router.route('/:postId/:parentCommentId').get(getNestedComments);



////////////////////////////////  AUTHENTICATED ROUTES  ////////////////////////////////

router.route('/:videoId/add').post(verifyJWT, addComment);
router.route('/:postId/add').post(verifyJWT, addComment);
router.route('/:videoId/:parentCommentId/add').post(verifyJWT, addComment);
router.route('/:postId/:parentCommentId/add').post(verifyJWT, addComment);
router.route('/:commentId').patch(verifyJWT, updateComment);
router.route('/:commentId').delete(verifyJWT, deleteComment);



export default router;