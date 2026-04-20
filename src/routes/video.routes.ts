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

router.route('/all').get(verifyOptionalJWT, getAllVideos);
router.route('/:videoId').get(getVideoById);
router.route('/:videoId/view').patch(verifyOptionalJWT, incrementVideoView);



////////////////////////////////  AUTHENTICATED ROUTES  ////////////////////////////////

router.route('/publish').post(
	verifyJWT,
	upload.fields([
		{ name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 }
	]),
	publishVideo
);
router.route('/:videoId').patch(verifyJWT, updateVideo);
router.route('/:videoId/thumbnail').patch(
	verifyJWT,
	upload.single('thumbnail'),
	updateVideoThumbnail
);
router.route('/:videoId').delete(verifyJWT, deleteVideo);
router.route('/:videoId/publish-status').patch(verifyJWT, togglePublishStatus);



export default router;