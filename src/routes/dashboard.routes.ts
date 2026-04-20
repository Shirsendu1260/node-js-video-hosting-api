import { Router } from 'express';
import {
    getChannelStats, 
    getChannelVideos
} from '../controllers/dashboard.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';



const router = Router();



////////////////////////////////  AUTHENTICATED ROUTES  ////////////////////////////////

router.route('/:username/stats').get(verifyJWT, getChannelStats);
router.route('/:username/videos').get(verifyJWT, getChannelVideos);



export default router;