import { Router } from 'express';
import { healthcheck } from '../controllers/healthcheck.controller.js';

const router = Router();

/**
 * @openapi
 * /healthcheck:
 *   get:
 *     tags:
 *       - Healthcheck
 *     summary: Get standard 200 response for healthcheck.
 *     responses:
 *       200:
 *         description: STATUS: ALL OK
 *       429:
 *         description: Rate limit exceeded.
 */
router.route('/').get(healthcheck);

export default router;