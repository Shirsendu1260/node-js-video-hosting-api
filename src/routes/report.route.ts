import { Router } from 'express';
import {
    submitReport,
    updateReportStatus,
    getAllReports
} from '../controllers/report.controller.js';
import { verifyJWT, verifyAdmin } from '../middlewares/auth.middleware.js';



const router = Router();



////////////////////////////////  AUTHENTICATED ROUTES  ////////////////////////////////

router.route('/report/:targetId').post(verifyJWT, submitReport);
router.route('/report/status/:reportId').patch(verifyJWT, verifyAdmin, updateReportStatus);
router.route('/report/all').get(verifyJWT, verifyAdmin, getAllReports);



export default router;