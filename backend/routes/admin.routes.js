import express from 'express';
import { protect, isAdmin } from '../middleware/auth.middleware.js';
import {
  getPlatformMetrics,
  getAdminUsers,
  updateUserRole,
  getAdminSpots,
  updateSpotStatus,
  getAdminBookings,
} from '../controllers/admin.controller.js';

const router = express.Router();

// Enforce both authentication and administrator role on all admin endpoints
router.use(protect, isAdmin);

/**
 * @openapi
 * /api/admin/metrics:
 *   get:
 *     summary: Retrieve aggregate platform metrics, GMV, and financial ledger
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Platform operational and financial metrics
 *       403:
 *         description: Forbidden - Admin privileges required
 */
router.get('/metrics', getPlatformMetrics);

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     summary: Paginated platform user directory with role filters
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Paginated user list
 */
router.get('/users', getAdminUsers);

/**
 * @openapi
 * /api/admin/users/{id}/role:
 *   put:
 *     summary: Update a user's platform role (RBAC governance)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [driver, host, admin]
 *     responses:
 *       200:
 *         description: Role successfully updated
 */
router.put('/users/:id/role', updateUserRole);

/**
 * @openapi
 * /api/admin/spots:
 *   get:
 *     summary: Global parking spot moderation directory
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of spots across all hosts
 */
router.get('/spots', getAdminSpots);

/**
 * @openapi
 * /api/admin/spots/{id}/status:
 *   put:
 *     summary: Suspend or activate a parking spot listing
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isAvailable]
 *             properties:
 *               isAvailable:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Spot status updated
 */
router.put('/spots/:id/status', updateSpotStatus);

/**
 * @openapi
 * /api/admin/bookings:
 *   get:
 *     summary: Global booking audit trail
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Booking audit records
 */
router.get('/bookings', getAdminBookings);

export default router;
