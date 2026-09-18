import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { notificationController } from '../controllers/notification.controller';
import { deviceTokenController } from '../controllers/deviceToken.controller';
const router = Router(); router.use(authenticateToken); router.post('/device-token', deviceTokenController.register.bind(deviceTokenController)); router.delete('/device-token', deviceTokenController.unregister.bind(deviceTokenController)); router.get('/', notificationController.list.bind(notificationController)); router.post('/:notificationId/read', notificationController.markRead.bind(notificationController)); export default router;
