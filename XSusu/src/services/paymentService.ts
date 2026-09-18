import { api } from './api';
import { API_ENDPOINTS } from '../config/api';
interface ApiResponse<T> { success: boolean; data: T; }
export interface PaymentInitialization { success: boolean; reference: string; paymentUrl?: string; ussdCode?: string; accessCode?: string; }
export interface PaymentVerification { verified: boolean; transactionId?: string; amount?: number; channel?: string; authorizationCode?: string; }
export const paymentService = { async initialize(groupId: string, amount: number, channel: 'mtn_mobile_money' | 'vodafone_cash' | 'airteltigo_money', reference: string): Promise<PaymentInitialization> { const response = await api.post<ApiResponse<PaymentInitialization>>(API_ENDPOINTS.payments.initialize, { groupId, amount, channel, reference }); return response.data; }, async verify(reference: string): Promise<PaymentVerification> { const response = await api.get<ApiResponse<PaymentVerification>>(API_ENDPOINTS.payments.verify(reference)); return response.data; } };
