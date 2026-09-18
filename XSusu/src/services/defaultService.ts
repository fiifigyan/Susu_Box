import { api } from './api';
import { API_ENDPOINTS } from '../config/api';
export interface Defaulter { id: string; totalMissed: number; defaultReason?: string | null; user: { id: string; firstName: string; lastName: string; phone: string }; }
export interface DefaultStats { defaultCount: number; creditReported: boolean; groupsDefaulted: number; totalMissed: number; depositsForfeited: number; }
interface ApiResponse<T> { success: boolean; data: T; }
export const defaultService = { async list(groupId: string): Promise<Defaulter[]> { const response = await api.get<ApiResponse<Defaulter[]>>(API_ENDPOINTS.defaults.group(groupId)); return response.data; }, async stats(): Promise<DefaultStats> { const response = await api.get<ApiResponse<DefaultStats>>(API_ENDPOINTS.defaults.stats); return response.data; } };
