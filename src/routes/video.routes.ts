import { Router } from 'express';
import {
    getAllVideos,
    publishVideo,
    getVideoById,
    incrementVideoView,
    updateVideo,
    updateVideoThumbnail,
    deleteVideo,
    togglePublishStatus
} from '../controllers/video.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT, verifyOptionalJWT } from '../middlewares/auth.middleware.js';



const router = Router();



////////////////////////////////  PUBLIC ROUTES  ////////////////////////////////

/**
 * @openapi
 * /video/all:
 *   get:
 *     tags:
 *       - Video
 *     summary: Get all videos or filter videos by their creator.
 *     description: >
 *       Returns a paginated list of published videos. Can also filter by creator username,
 *       search by keyword (on title/description), sort order, and shorts flag (for fetching shorts videos).
 *       If the authenticated user requests their own channel's videos,
 *       his/her unpublished videos are also fetched.
 *     parameters:
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *         description: Filter videos by this creator's username
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
 *         name: query
 *         schema:
 *           type: string
 *         description: Keyword to search in a video's title and description
 *         example: auto ride
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [views, createdAt]
 *           default: views
 *       - in: query
 *         name: sortType
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: isShorts
 *         schema:
 *           type: boolean
 *           default: false
 *         description: To fetch shorts, set to true
 *     responses:
 *       200:
 *         description: All videos fetched successfully (empty result if no videos found).
 *       404:
 *         description: User not found.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/all').get(verifyOptionalJWT, getAllVideos);

/**
 * @openapi
 * /video/v/{videoId}:
 *   get:
 *     tags:
 *       - Video
 *     summary: Get a single video by its Base64url encoded ID.
 *     description: >
 *       Returns full video details including creator.
 *       The videoId must be Base64url encoded. Hidden videos are only visible to admin users.
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB video ID
 *     responses:
 *       200:
 *         description: Video fetched successfully.
 *       400:
 *         description: Invalid ID format.
 *       404:
 *         description: Video not found.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/v/:videoId').get(getVideoById);

/**
 * @openapi
 * /video/{videoId}/view:
 *   patch:
 *     tags:
 *       - Video
 *     summary: Increment view count of a video.
 *     description: >
 *       Increments the view count by 1. If the user is authenticated,
 *       the video is also added to their watch history (duplicate entries are ignored). 
 *       View to be registered after 6 seconds of video watching.
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB video ID
 *     responses:
 *       200:
 *         description: Video viewed successfully.
 *       400:
 *         description: Invalid ID format.
 *       500:
 *         description: Failed to register view.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/:videoId/view').patch(verifyOptionalJWT, incrementVideoView);



////////////////////////////////  AUTHENTICATED ROUTES  ////////////////////////////////

/**
 * @openapi
 * /video/publish:
 *   post:
 *     tags:
 *       - Video
 *     summary: Upload and publish a new video.
 *     description: >
 *       Uploads a video file and optional thumbnail to Cloudinary using chunked upload.
 *       If the video duration is above 60 seconds, isShorts is forced to false to trigger a long-format video upload.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - video
 *               - title
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Video file required (mp4, webm, mkv files are allowed, max 15MB).
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *                 description: Optional thumbnail image (jpg, jpeg, png files are allowed, max 15MB).
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: My First Video
 *               description:
 *                 type: string
 *                 maxLength: 5000
 *                 example: This is a tutorial on API
 *               isShorts:
 *                 type: boolean
 *                 default: false
 *                 description: Mark as a Short video (auto-set to false if video is longer than 60 seconds)
 *     responses:
 *       201:
 *         description: Video published successfully.
 *       400:
 *         description: Video publication validation error or missing video file.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/publish').post(
	verifyJWT,
	upload.fields([
		{ name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 }
	]),
	publishVideo
);

/**
 * @openapi
 * /video/v/{videoId}:
 *   patch:
 *     tags:
 *       - Video
 *     summary: Update video title and description.
 *     description: >
 *       Updates the title and/or description of a video.
 *       Only the creator of the video can update.
 *       isShorts cannot be changed after upload.
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
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: Updated Video Title
 *               description:
 *                 type: string
 *                 maxLength: 5000
 *                 example: Updated description
 *     responses:
 *       200:
 *         description: Video updated successfully.
 *       400:
 *         description: Video metadata update validation error.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       404:
 *         description: Video not found or not the creator.
 *       429:
 *         description: Rate limit exceeded.
 *   delete:
 *     tags:
 *       - Video
 *     summary: Delete a video.
 *     description: >
 *       Permanently deletes the video file and its thumbnail from Cloudinary,
 *       then removes the document from the database.
 *       Only the creator can delete their own video.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB video ID
 *     responses:
 *       200:
 *         description: Video deleted successfully.
 *       400:
 *         description: Invalid ID or Cloudinary deletion failed.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       403:
 *         description: Forbidden (you do not have permission to perform this action.)
 *       404:
 *         description: Video not found.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/v/:videoId').patch(verifyJWT, updateVideo);
router.route('/v/:videoId').delete(verifyJWT, deleteVideo);

/**
 * @openapi
 * /video/{videoId}/thumbnail:
 *   patch:
 *     tags:
 *       - Video
 *     summary: Update video thumbnail.
 *     description: >
 *       Replaces the existing thumbnail with a new one.
 *       If a previous thumbnail exists on Cloudinary, it is deleted first, then new one is uploaded.
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - thumbnail
 *             properties:
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *                 description: New thumbnail image (jpg, jpeg, png files are allowed, max 15MB)
 *     responses:
 *       200:
 *         description: Thumbnail is updated successfully.
 *       400:
 *         description: File missing or upload failed.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/:videoId/thumbnail').patch(
	verifyJWT,
	upload.single('thumbnail'),
	updateVideoThumbnail
);

/**
 * @openapi
 * /video/{videoId}/publish-status:
 *   patch:
 *     tags:
 *       - Video
 *     summary: Toggle video publish/unpublish status.
 *     description: >
 *       Flips the isPublished flag of the video between true and false.
 *       Unpublished videos are hidden from public users but remain in the database.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB video ID
 *     responses:
 *       200:
 *         description: Publish status toggled successfully.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       500:
 *         description: Failed to update video publication status!
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/:videoId/publish-status').patch(verifyJWT, togglePublishStatus);



export default router;