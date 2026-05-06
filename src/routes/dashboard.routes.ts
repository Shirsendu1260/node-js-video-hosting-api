import { Router } from 'express';
import {
    getChannelStats, 
    getChannelVideos
} from '../controllers/dashboard.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';



const router = Router();



////////////////////////////////  AUTHENTICATED ROUTES  ////////////////////////////////

/**
 * @openapi
 * /dashboard/{username}/stats:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get channel statistics.
 *     description: >
 *       Returns stats for the given channel including total videos,
 *       total video views, total likes across all videos, total subscribers,
 *       and total subscribed channels.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         example: testuser
 *     responses:
 *       200:
 *         description: Channel stats fetched successfully.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       404:
 *         description: User not found or stats not found.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/:username/stats').get(verifyJWT, getChannelStats);

/**
 * @openapi
 * /dashboard/{username}/videos:
 *   get:
 *     tags:
 *       - Dashboard
 *     summary: Get all videos of a channel.
 *     description: >
 *       Returns paginated videos for a channel. If the authenticated user is the channel owner,
 *       unpublished videos are also shown. It supports sorting by views or date and filtering by Shorts.
 *     security:
 *       - bearerAuth: []
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
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [views, createdAt]
 *           default: createdAt
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
 *     responses:
 *       200:
 *         description: All videos fetched successfully (empty if none).
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       404:
 *         description: User not found.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/:username/videos').get(verifyJWT, getChannelVideos);



export default router;