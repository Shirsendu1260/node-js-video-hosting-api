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

/**
 * @openapi
 * /post/p/{username}:
 *   get:
 *     tags:
 *       - Post
 *     summary: Get all posts created by a user by his/her username.
 *     description: >
 *       Returns a paginated list of community posts created by the given user. 
 *       Hidden posts are not shown.
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         example: testuser
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
 *         description: All posts are fetched successfully (empty if none).
 *       404:
 *         description: User not found.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/p/:username').get(getUserPosts);



////////////////////////////////  AUTHENTICATED ROUTES  ////////////////////////////////

/**
 * @openapi
 * /post/create:
 *   post:
 *     tags:
 *       - Post
 *     summary: Create a new community post.
 *     description: >
 *       Creates a post with text content and an optional image.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *                 example: Hello everyone! This is my first post.
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional post image (jpg, jpeg, png files are allowed, max 15MB)
 *     responses:
 *       201:
 *         description: Post created successfully.
 *       400:
 *         description: Post create validation error.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/create').post(verifyJWT, upload.single('image'), createPost);

/**
 * @openapi
 * /post/p/{postId}:
 *   patch:
 *     tags:
 *       - Post
 *     summary: Update a post.
 *     description: >
 *       Updates the text content of a post. Only the creator can do this.
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
 *                 maxLength: 2000
 *                 example: Updated post content
 *     responses:
 *       200:
 *         description: Post updated successfully.
 *       400:
 *         description: Post update validation error.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       403:
 *         description: Forbidden (you do not have permission to perform this action)
 *       404:
 *         description: Post not found.
 *       429:
 *         description: Rate limit exceeded.
 *   delete:
 *     tags:
 *       - Post
 *     summary: Delete a post.
 *     description: >
 *       Deletes the post, its image from Cloudinary (if it exists),
 *       and all comments associated with it. Only the creator can delete.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB post ID
 *     responses:
 *       200:
 *         description: Post deleted successfully.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       403:
 *         description: Forbidden (you do not have permission to perform this action)
 *       404:
 *         description: Post not found.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/p/:postId').patch(verifyJWT, updatePost);
router.route('/p/:postId').delete(verifyJWT, deletePost);



export default router;
