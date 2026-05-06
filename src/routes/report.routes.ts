import { Router } from 'express';
import {
    submitReport,
    updateReportStatus,
    getAllReports
} from '../controllers/report.controller.js';
import { verifyJWT, verifyAdmin } from '../middlewares/auth.middleware.js';



const router = Router();



////////////////////////////////  AUTHENTICATED ROUTES  ////////////////////////////////

/**
 * @openapi
 * /report/r/{targetId}:
 *   post:
 *     tags:
 *       - Report
 *     summary: Submit a report on a video, post, or comment.
 *     description: >
 *       Allows an authenticated user to report a content.
 *       A content can be a video, post, or comment.
 *       Each user can only submit one report per content.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: targetId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the content
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetModel
 *               - reason
 *             properties:
 *               targetModel:
 *                 type: string
 *                 enum: [Video, Post, Comment]
 *                 example: Video
 *               reason:
 *                 type: string
 *                 enum: [Hate Speech, Harassment, Violence, Spam, Scam, Inappropriate, Other]
 *                 example: Spam
 *               details:
 *                 type: string
 *                 maxLength: 5000
 *                 example: This is a spam content.
 *     responses:
 *       201:
 *         description: Report sent successfully.
 *       400:
 *         description: Report submit validation error or already reported or invalid content ID.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/r/:targetId').post(verifyJWT, submitReport);

/**
 * @openapi
 * /report/status/{reportId}:
 *   patch:
 *     tags:
 *       - Report
 *     summary: Update the status of a report (Admin only).
 *     description: >
 *       Allows an admin to update a report's status.
 *       When status is set to RES (Resolved), the reported content is automatically hidden from normal users.
 *       When set back to PEND or REV, the content is unhidden.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: Base64url encoded MongoDB report ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PEND, REV, RES]
 *                 description: "PEND = Pending, REV = Reviewing, RES = Resolved"
 *                 example: REV
 *     responses:
 *       200:
 *         description: Report status updated successfully.
 *       400:
 *         description: Invalid status update.
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       403:
 *         description: Forbidden (Admin access required).
 *       404:
 *         description: Report not found.
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/status/:reportId').patch(verifyJWT, verifyAdmin, updateReportStatus);

/**
 * @openapi
 * /report/all:
 *   get:
 *     tags:
 *       - Report
 *     summary: Get all reports (Admin only).
 *     description: >
 *       Returns a paginated list of all reports.
 *       It can be filtered by status and target model (Video/Post/Comment).
 *       Each report includes reporter details and the reported content.
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PEND, REV, RES]
 *         description: Filter by report status
 *       - in: query
 *         name: targetModel
 *         schema:
 *           type: string
 *           enum: [Video, Post, Comment]
 *         description: Filter by content type
 *     responses:
 *       200:
 *         description: All reports are fetched successfully (empty if none).
 *       401:
 *         description: Unauthorized (missing or invalid token).
 *       403:
 *         description: Forbidden (Admin access required).
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/all').get(verifyJWT, verifyAdmin, getAllReports);



export default router;