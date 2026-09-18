import { Request, Response, NextFunction } from 'express';
import { defaultService } from '../services/default.service';
export class DefaultController { async list(req: Request, res: Response, next: NextFunction): Promise<void> { try { res.json({ success: true, data: await defaultService.getDefaulters(req.params.groupId) }); } catch (error) { next(error); } } async stats(req: Request, res: Response, next: NextFunction): Promise<void> { try { res.json({ success: true, data: await defaultService.getDefaultStats((req as { userId?: string }).userId || '') }); } catch (error) { next(error); } } }
export const defaultController = new DefaultController();
