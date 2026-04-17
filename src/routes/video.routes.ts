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

router.route('/video/all').get(verifyOptionalJWT, getAllVideos);
router.route('/video/:videoId').get(getVideoById);
router.route('/video/:videoId/view').patch(verifyOptionalJWT, incrementVideoView);



////////////////////////////////  AUTHENTICATED ROUTES  ////////////////////////////////

router.route('/video/publish').post(
	verifyJWT,
	upload.fields([
		{ name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 }
	]),
	publishVideo
);
router.route('/video/:videoId').patch(verifyJWT, updateVideo);
router.route('/video/:videoId/thumbnail').patch(
	verifyJWT,
	upload.single('thumbnail'),
	updateVideoThumbnail
);
router.route('/video/:videoId').delete(verifyJWT, deleteVideo);
router.route('/video/:videoId/publish-status').patch(verifyJWT, togglePublishStatus);



export default router;