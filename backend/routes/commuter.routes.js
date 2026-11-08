import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  createCommuterPass,
  getMyCommuterPasses,
  toggleCommuterPassStatus,
  cancelCommuterPass,
  processCommuterPassCron,
} from '../controllers/commuter.controller.js';

const router = express.Router();

/**
 * @openapi
 * /api/commuter:
 *   post:
 *     summary: Activate a recurring weekday commuter pass subscription
 *     tags: [Commuter]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [spotId]
 *             properties:
 *               spotId:
 *                 type: string
 *               daysOfWeek:
 *                 type: array
 *                 items:
 *                   type: number
 *                 example: [1, 2, 3, 4, 5]
 *               startTime:
 *                 type: string
 *                 example: "09:00"
 *               endTime:
 *                 type: string
 *                 example: "17:00"
 *     responses:
 *       201:
 *         description: Commuter pass activated
 */
router.post('/', protect, createCommuterPass);

/**
 * @openapi
 * /api/commuter/my:
 *   get:
 *     summary: Retrieve driver active and paused commuter passes
 *     tags: [Commuter]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of commuter passes
 */
router.get('/my', protect, getMyCommuterPasses);

/**
 * @openapi
 * /api/commuter/{id}/toggle:
 *   put:
 *     summary: Pause or resume a commuter pass
 *     tags: [Commuter]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/:id/toggle', protect, toggleCommuterPassStatus);

/**
 * @openapi
 * /api/commuter/{id}:
 *   delete:
 *     summary: Cancel a commuter pass subscription
 *     tags: [Commuter]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Commuter pass cancelled
 */
router.delete('/:id', protect, cancelCommuterPass);

/**
 * @openapi
 * /api/commuter/process-cron:
 *   post:
 *     summary: On-demand execution of commuter renewal scheduler
 *     tags: [Commuter]
 *     responses:
 *       200:
 *         description: Cron execution summary
 */
router.post('/process-cron', processCommuterPassCron);

export default router;

