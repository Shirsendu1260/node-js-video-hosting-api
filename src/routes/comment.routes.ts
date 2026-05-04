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

/**
 * @openapi
 * /comment/v/{videoId}:
 *   get:
 *     tags:
 *       - Comment
 *     summary: Get comments for a video.
 *     description: >
 *       Returns paginated (non-reply) comments for a given video. Hidden comments are not shown.
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB video ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 4
 *       - in: query
 *         name: sortType
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: All comments fetched successfully (empty if none).
 *       400:
 *         description: Invalid ID format or missing videoId.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/v/:videoId').get(getComments);

/**
 * @openapi
 * /comment/p/{postId}:
 *   get:
 *     tags:
 *       - Comment
 *     summary: Get comments for a post.
 *     description: >
 *       Returns paginated (non-reply) comments for a given post. Hidden comments are not shown.
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB post ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 4
 *       - in: query
 *         name: sortType
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: All comments fetched successfully (empty if none).
 *       400:
 *         description: Invalid ID format or missing postId.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/p/:postId').get(getComments);

/**
 * @openapi
 * /comment/v/:videoId/reply/:parentCommentId:
 *   get:
 *     tags:
 *       - Comment
 *     summary: Get replies (nested comments) for a video comment.
 *     description: >
 *       Returns paginated replies to a specific comment on a video. 
 *       Hidden comments are not shown.
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB video ID
 *       - in: path
 *         name: parentCommentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB comment ID (parent comment)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 4
 *     responses:
 *       200:
 *         description: All replies are fetched successfully (empty if none).
 *       400:
 *         description: Invalid ID format or missing videoId.
 *       404:
 *         description: Parent comment does not exist.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/v/:videoId/reply/:parentCommentId').get(getNestedComments);

/**
 * @openapi
 * /comment/p/:postId/reply/:parentCommentId:
 *   get:
 *     tags:
 *       - Comment
 *     summary: Get replies (nested comments) for a post comment.
 *     description: >
 *       Returns paginated replies to a specific comment on a post. 
 *       Hidden comments are not shown.
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB post ID
 *       - in: path
 *         name: parentCommentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB comment ID (parent comment)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 4
 *     responses:
 *       200:
 *         description: All replies are fetched successfully (empty if none).
 *       400:
 *         description: Invalid ID format or missing postId.
 *       404:
 *         description: Parent comment does not exist.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/p/:postId/reply/:parentCommentId').get(getNestedComments);



////////////////////////////////  AUTHENTICATED ROUTES  ////////////////////////////////

/**
 * @openapi
 * /comment/v/{videoId}/add:
 *   post:
 *     tags:
 *       - Comment
 *     summary: Add a comment to a video.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB video ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 example: Nice video!
 *     responses:
 *       201:
 *         description: Comment added successfully.
 *       400:
 *         description: Comment validation error or Invalid ID format or missing videoId.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/v/:videoId/add').post(verifyJWT, addComment);

/**
 * @openapi
 * /comment/p/{postId}/add:
 *   post:
 *     tags:
 *       - Comment
 *     summary: Add a comment to a post.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 example: Nice post!
 *     responses:
 *       201:
 *         description: Comment added successfully.
 *       400:
 *         description: Comment validation error or Invalid ID format or missing postId.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/p/:postId/add').post(verifyJWT, addComment);

/**
 * @openapi
 * /comment/v/{videoId}/reply/{parentCommentId}/add:
 *   post:
 *     tags:
 *       - Comment
 *     summary: Reply to a comment on a video.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB video ID
 *       - in: path
 *         name: parentCommentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB comment ID being replied to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 example: I agree with this comment!
 *     responses:
 *       201:
 *         description: Reply added successfully.
 *       400:
 *         description: Comment validation error or Invalid ID format or missing videoId.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       404:
 *         description: Parent comment not found.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/v/:videoId/reply/:parentCommentId/add').post(verifyJWT, addComment);

/**
 * @openapi
 * /comment/p/{postId}/reply/{parentCommentId}/add:
 *   post:
 *     tags:
 *       - Comment
 *     summary: Reply to a comment on a post.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB post ID
 *       - in: path
 *         name: parentCommentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB comment ID being replied to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 example: I agree with this comment!
 *     responses:
 *       201:
 *         description: Reply added successfully.
 *       400:
 *         description: Comment validation error or Invalid ID format or missing postId.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       404:
 *         description: Parent comment not found.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/p/:postId/reply/:parentCommentId/add').post(verifyJWT, addComment);

/**
 * @openapi
 * /comment/{commentId}:
 *   patch:
 *     tags:
 *       - Comment
 *     summary: Update a comment.
 *     description: >
 *       Updates the content of an existing comment. Only the comment creator can do this.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 example: Updated comment text
 *     responses:
 *       200:
 *         description: Comment updated successfully.
 *       400:
 *         description: Comment validation error or Invalid ID format.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       403:
 *         description: Forbidden (you do not have permission to perform this action).
 *       404:
 *         description: Comment not found.
 *       429:
 *         description: Rate limit exceeded.
 *   delete:
 *     tags:
 *       - Comment
 *     summary: Delete a comment
 *     description: >
 *       Deletes a comment and all its replies.
 *       Only the comment creator can delete it.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       403:
 *         description: Forbidden (you do not have permission to perform this action).
 *       404:
 *         description: Comment not found.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/:commentId').patch(verifyJWT, updateComment);
router.route('/:commentId').delete(verifyJWT, deleteComment);



export default router;