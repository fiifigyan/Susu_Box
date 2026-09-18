import { Router } from 'express';
import { InviteController } from '../controllers/invite.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const inviteController = new InviteController();

// All invite routes require authentication
router.use(authenticateToken);

// Group-specific invite routes
router.post('/groups/:groupId/invites', inviteController.inviteByPhone.bind(inviteController));
router.get('/groups/:groupId/invites', inviteController.getPendingInvites.bind(inviteController));
router.get('/groups/:groupId/invites/share-link', inviteController.generateShareLink.bind(inviteController));

// General invite routes
router.post('/join', inviteController.joinByCode.bind(inviteController));
router.get('/my-invites', inviteController.getMyInvites.bind(inviteController));
router.delete('/:inviteId', inviteController.cancelInvite.bind(inviteController));

export default router;