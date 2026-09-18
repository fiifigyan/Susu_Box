import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { defaultController } from '../controllers/default.controller';
const router = Router(); router.use(authenticateToken); router.get('/group/:groupId', defaultController.list.bind(defaultController)); router.get('/stats', defaultController.stats.bind(defaultController)); export default router;
