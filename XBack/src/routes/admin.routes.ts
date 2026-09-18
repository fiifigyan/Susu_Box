import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();
const adminController = new AdminController();

router.use(authenticateToken, requireRole('APP_ADMIN'));

router.get('/dashboard', adminController.getDashboardStats.bind(adminController));
router.get('/security-logs', adminController.getSecurityLogs.bind(adminController));
router.get('/revenue', adminController.getRevenueReport.bind(adminController));
router.get('/defaulters', adminController.getDefaulters.bind(adminController));
router.get('/defaults/stats', adminController.getDefaultStats.bind(adminController));

export default router;