import { api } from './api';
import { API_ENDPOINTS } from '../config/api';
export interface DepositStatus { required: number; complete: boolean; paidCount: number; totalMembers: number; }
interface ApiResponse<T> { success: boolean; data: T; }
export const depositService = { async collect(groupId: string, amount: number, transactionRef: string): Promise<void> { await api.post<ApiResponse<unknown>>(API_ENDPOINTS.deposits.collect, { groupId, amount, transactionRef }); }, async status(groupId: string): Promise<DepositStatus> { const response = await api.get<ApiResponse<DepositStatus>>(API_ENDPOINTS.deposits.status(groupId)); return response.data; } };
