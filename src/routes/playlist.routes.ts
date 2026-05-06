import { Router } from 'express';
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
} from '../controllers/playlist.controller.js';
import { verifyJWT, verifyOptionalJWT } from '../middlewares/auth.middleware.js';



const router = Router();



////////////////////////////////  PUBLIC ROUTES  ////////////////////////////////

/**
 * @openapi
 * /playlist/p/{playlistId}:
 *   get:
 *     tags:
 *       - Playlist
 *     summary: Get a playlist by ID.
 *     description: >
 *       Returns playlist details with its videos.
 *     parameters:
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB playlist ID
 *     responses:
 *       200:
 *         description: All playlist videos are fetched successfully (empty if none found).
 *       404:
 *         description: Playlist not found.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/p/:playlistId').get(verifyOptionalJWT, getPlaylistById);

/**
 * @openapi
 * /playlist/all/{userId}:
 *   get:
 *     tags:
 *       - Playlist
 *     summary: Get all playlists of a user.
 *     description: >
 *       Returns all playlists created by the given user.
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB ObjectId of the user
 *     responses:
 *       200:
 *         description: All playlists are fetched successfully.
 *       404:
 *         description: User not found.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/all/:userId').get(getUserPlaylists);



////////////////////////////////  AUTHENTICATED ROUTES  ////////////////////////////////

/**
 * @openapi
 * /playlist/create:
 *   post:
 *     tags:
 *       - Playlist
 *     summary: Create a new playlist.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: My Playlist
 *               description:
 *                 type: string
 *                 example: A collection of my favourite videos
 *     responses:
 *       201:
 *         description: Playlist created successfully.
 *       400:
 *         description: Playlist create validation error.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/create').post(verifyJWT, createPlaylist);

/**
 * @openapi
 * /playlist/p/{playlistId}:
 *   patch:
 *     tags:
 *       - Playlist
 *     summary: Update playlist name or description.
 *     description: >
 *       Only the playlist creator can update it.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB playlist ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: My Favourite Tutorials
 *               description:
 *                 type: string
 *                 example: Best tutorials I've watched
 *     responses:
 *       200:
 *         description: Playlist updated successfully.
 *       400:
 *         description: Playlist update validation error.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       403:
 *         description: Forbidden (you need to be authenticated to update this playlist).
 *       404:
 *         description: Playlist not found.
 *       429:
 *         description: Rate limit exceeded.
 *   delete:
 *     tags:
 *       - Playlist
 *     summary: Delete a playlist.
 *     description: >
 *       Permanently deletes a playlist. Only the creator can delete it.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB playlist ID
 *     responses:
 *       200:
 *         description: Playlist deleted successfully.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       403:
 *         description: Forbidden (you need to be authenticated to update this playlist).
 *       404:
 *         description: Playlist not found.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/p/:playlistId').patch(verifyJWT, updatePlaylist);
router.route('/p/:playlistId').delete(verifyJWT, deletePlaylist);

/**
 * @openapi
 * /playlist/add/p/{playlistId}/v/{videoId}:
 *   patch:
 *     tags:
 *       - Playlist
 *     summary: Add a video to a playlist.
 *     description: >
 *       Adds the specified video to the playlist. Only the playlist creator can do this.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB playlist ID
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB video ID
 *     responses:
 *       200:
 *         description: Video added to playlist successfully.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       403:
 *         description: Forbidden (you need to be authenticated to update this playlist).
 *       404:
 *         description: Playlist or video not found or permission denied.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/add/p/:playlistId/v/:videoId').patch(verifyJWT, addVideoToPlaylist);

/**
 * @openapi
 * /playlist/remove/p/{playlistId}/v/{videoId}:
 *   patch:
 *     tags:
 *       - Playlist
 *     summary: Remove a video from a playlist
 *     description: >
 *       Removes the specified video from the playlist. Only the playlist creator can do this.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB playlist ID
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB video ID
 *     responses:
 *       200:
 *         description: Video removed from playlist successfully.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       403:
 *         description: Forbidden (you need to be authenticated to update this playlist).
 *       404:
 *         description: Playlist or video not found or permission denied.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/remove/p/:playlistId/v/:videoId').patch(verifyJWT, removeVideoFromPlaylist);



export default router;