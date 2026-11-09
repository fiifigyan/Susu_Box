import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const dashboardController = new DashboardController();

router.use(authenticateToken);

router.get('/', dashboardController.getSummary.bind(dashboardController));

export default router;
