import { api } from './api';
import { API_ENDPOINTS } from '../config/api';
export interface NotificationItem { id: string; type: string; title: string; message: string; isRead: boolean; groupId?: string | null; createdAt: string; }
interface ApiResponse<T> { success: boolean; data: T; }
export const notificationService = { async list(): Promise<NotificationItem[]> { const response = await api.get<ApiResponse<{ notifications: NotificationItem[] }>>(API_ENDPOINTS.notifications.list); return response.data.notifications; }, async markRead(id: string): Promise<void> { await api.post<ApiResponse<unknown>>(API_ENDPOINTS.notifications.markRead(id)); }, async registerDeviceToken(token: string): Promise<void> { await api.post<ApiResponse<unknown>>(API_ENDPOINTS.notifications.deviceToken, { token }); }, async unregisterDeviceToken(token: string): Promise<void> { await api.delete<ApiResponse<unknown>>(API_ENDPOINTS.notifications.deviceToken, { data: { token } }); } };
