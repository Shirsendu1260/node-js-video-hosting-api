import { Router } from 'express';
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
} from '../controllers/subscription.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';



const router = Router();



////////////////////////////////  AUTHENTICATED ROUTES  ////////////////////////////////

/**
 * @openapi
 * /subscription/{channelId}/subscribers:
 *   get:
 *     tags:
 *       - Subscription
 *     summary: Get all subscribers of a channel.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB ObjectId of the channel (user)
 *     responses:
 *       200:
 *         description: All subscribers are fetched successfully (empty if none found).
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       404:
 *         description: Channel not found.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/:channelId/subscribers').get(verifyJWT, getUserChannelSubscribers);

/**
 * @openapi
 * /subscription/{channelId}/channels:
 *   get:
 *     tags:
 *       - Subscription
 *     summary: Get all channels a user is subscribed to.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB ObjectId of the user
 *     responses:
 *       200:
 *         description: All subscribed channels are fetched successfully.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       404:
 *         description: Channel not found.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/:channelId/channels').get(verifyJWT, getSubscribedChannels);

/**
 * @openapi
 * /subscription/{channelId}:
 *   post:
 *     tags:
 *       - Subscription
 *     summary: Toggle subscription (subscribe/unsubscribe) to a channel.
 *     description: >
 *       If the user is not subscribed, a subscription is created.
 *       If already subscribed, the subscription is removed.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB ObjectId of the channel to subscribe/unsubscribe
 *     responses:
 *       200:
 *         description: Subscription toggled successfully.
 *       400:
 *         description: You need to be authenticated to subscribe this channel.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       404:
 *         description: Channel not found.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/:channelId').post(verifyJWT, toggleSubscription);



export default router;