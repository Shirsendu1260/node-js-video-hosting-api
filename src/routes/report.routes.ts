import { Router } from 'express';
import {
    submitReport,
    updateReportStatus,
    getAllReports
} from '../controllers/report.controller.js';
import { verifyJWT, verifyAdmin } from '../middlewares/auth.middleware.js';



const router = Router();



////////////////////////////////  AUTHENTICATED ROUTES  ////////////////////////////////

router.route('/:targetId').post(verifyJWT, submitReport);
router.route('/status/:reportId').patch(verifyJWT, verifyAdmin, updateReportStatus);
router.route('/all').get(verifyJWT, verifyAdmin, getAllReports);



export default router;