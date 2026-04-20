import { Router } from 'express';
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
} from '../controllers/subscription.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';



const router = Router();



////////////////////////////////  PUBLIC ROUTES  ////////////////////////////////

router.route('/:channelId/subscribers').get(getUserChannelSubscribers);
router.route('/:channelId/channels').get(getSubscribedChannels);



////////////////////////////////  AUTHENTICATED ROUTES  ////////////////////////////////

router.route('/:channelId').post(verifyJWT, toggleSubscription);



export default router;