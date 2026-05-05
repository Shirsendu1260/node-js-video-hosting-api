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

/**
 * @openapi
 * /like/video/{videoId}:
 *   post:
 *     tags:
 *       - Like
 *     summary: Toggle like or dislike on a video.
 *     description: >
 *       If the user has not reacted to this video, a like or dislike is created.
 *       If the user sends the same reaction again, it is removed.
 *       If the user switches from like to dislike or vice versa, the old reaction
 *       is replaced with the new one.
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
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [like, dislike]
 *                 example: like
 *     responses:
 *       200:
 *         description: Like/dislike toggled successfully.
 *       400:
 *         description: Creator cannot like/dislike their own video or invalid action (like/dislike).or Invalid entity (Video).
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       404:
 *         description: Video not found.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/video/:videoId').post(verifyJWT, toggleVideoLikeDislike);

/**
 * @openapi
 * /like/post/{postId}:
 *   post:
 *     tags:
 *       - Like
 *     summary: Toggle like or dislike on a post.
 *     description: >
 *       If the user has not reacted to this post, a like or dislike is created.
 *       If the user sends the same reaction again, it is removed.
 *       If the user switches from like to dislike or vice versa, the old reaction
 *       is replaced with the new one.
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
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [like, dislike]
 *                 example: like
 *     responses:
 *       200:
 *         description: Like/dislike toggled successfully.
 *       400:
 *         description: Creator cannot like/dislike their own post or invalid action (like/dislike).or Invalid entity (Post).
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       404:
 *         description: Post not found.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/post/:postId').post(verifyJWT, togglePostLikeDislike);

/**
 * @openapi
 * /like/comment/{commentId}:
 *   post:
 *     tags:
 *       - Like
 *     summary: Toggle like or dislike on a comment.
 *     description: >
 *       If the user has not reacted to this comment, a like or dislike is created.
 *       If the user sends the same reaction again, it is removed.
 *       If the user switches from like to dislike or vice versa, the old reaction
 *       is replaced with the new one.
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
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [like, dislike]
 *                 example: like
 *     responses:
 *       200:
 *         description: Like/dislike toggled successfully.
 *       400:
 *         description: Creator cannot like/dislike their own comment or invalid action (like/dislike).or Invalid entity (Comment).
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       404:
 *         description: Comment not found.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/comment/:commentId').post(verifyJWT, toggleCommentLikeDislike);

/**
 * @openapi
 * /like/liked-videos:
 *   get:
 *     tags:
 *       - Like
 *     summary: Get all videos liked by the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liked videos fetched successfully.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/liked-videos').get(verifyJWT, getLikedVideos);

/**
 * @openapi
 * /like/liked-posts:
 *   get:
 *     tags:
 *       - Like
 *     summary: Get all posts liked by the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liked posts fetched successfully.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/liked-posts').get(verifyJWT, getLikedPosts);



export default router;
