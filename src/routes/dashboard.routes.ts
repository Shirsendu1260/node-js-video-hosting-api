import { Router } from 'express';
import {
    getChannelStats, 
    getChannelVideos
} from '../controllers/dashboard.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';



const router = Router();



////////////////////////////////  AUTHENTICATED ROUTES  ////////////////////////////////

router.route('/channel/:username/stats').get(verifyJWT, getChannelStats);
router.route('/channel/:username/videos').get(verifyJWT, getChannelVideos);



export default router;