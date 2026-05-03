import { Router } from 'express';
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
} from '../controllers/subscription.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';



const router = Router();



////////////////////////////////  AUTHENTICATED ROUTES  ////////////////////////////////

router.route('/:channelId/subscribers').get(verifyJWT, getUserChannelSubscribers);
router.route('/:channelId/channels').get(verifyJWT, getSubscribedChannels);
router.route('/:channelId').post(verifyJWT, toggleSubscription);



export default router;