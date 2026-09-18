import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { contributionRateLimiter } from '../middleware/rateLimiter';
import { depositController } from '../controllers/deposit.controller';
const router = Router(); router.use(authenticateToken); router.post('/', contributionRateLimiter, depositController.collect.bind(depositController)); router.get('/:groupId', depositController.status.bind(depositController)); export default router;
