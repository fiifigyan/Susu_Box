import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export class NotificationController { 
  async list(req: Request, res: Response, next: NextFunction): Promise<void> { 
    try { const userId = (req as { userId?: string }).userId; 
      if (!userId) throw Object.assign(new Error('User identity is required'), { statusCode: 401 }); 
      const notifications = await prisma.notification.findMany({ 
        where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 }); 
        res.json({ success: true, data: { notifications } 
      });
    } catch (error) { next(error); }
  } 
        
  async markRead(req: Request, res: Response, next: NextFunction): Promise<void> { 
    try { const userId = (req as { userId?: string }).userId; 
      if (!userId) throw Object.assign(new Error('User identity is required'), { statusCode: 401 }); 
      const notification = await prisma.notification.findFirst({ where: { id: req.params.notificationId, userId } 
      }); 
      if (!notification) throw Object.assign(new Error('Notification not found'), { statusCode: 404 }); await prisma.notification.update({ where: { id: notification.id }, data: { isRead: true } }); 
      res.json({ success: true }); 
    } catch (error) { next(error); } 
  } 
}
export const notificationController = new NotificationController();
