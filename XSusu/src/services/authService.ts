import * as SecureStore from 'expo-secure-store';
import { api } from './api';
import { API_ENDPOINTS } from '../config/api';
export interface AuthUser { id: string; email: string; phone: string; firstName: string; lastName: string; isVerified: boolean; role: string; }
export interface RegisterRequest { email: string; phone: string; password: string; firstName: string; lastName: string; }
interface ApiResponse<T> { success: boolean; data: T; }
interface AuthPayload { accessToken: string; refreshToken: string; user: AuthUser; }
interface AuthTokens { accessToken: string; refreshToken: string; }
const persistSession = async (payload: AuthPayload): Promise<AuthUser> => { await Promise.all([SecureStore.setItemAsync('access_token', payload.accessToken), SecureStore.setItemAsync('refresh_token', payload.refreshToken), SecureStore.setItemAsync('user_data', JSON.stringify(payload.user))]); return payload.user; };
export const authService = {
  async login(email: string, password: string): Promise<AuthUser> { const response = await api.post<ApiResponse<AuthPayload>>(API_ENDPOINTS.auth.login, { email, password }); return persistSession(response.data); },
  async register(data: RegisterRequest): Promise<void> { await api.post<ApiResponse<unknown>>(API_ENDPOINTS.auth.register, data); },
  async resendOtp(email: string): Promise<void> { await api.post<ApiResponse<unknown>>(API_ENDPOINTS.auth.resendOtp, { email }); },
  async requestPasswordReset(email: string): Promise<void> { await api.post<ApiResponse<unknown>>(API_ENDPOINTS.auth.forgotPassword, { email }); },
  async resetPassword(email: string, otp: string, password: string): Promise<void> { await api.post<ApiResponse<unknown>>(API_ENDPOINTS.auth.resetPassword, { email, otp, password }); },
  async verifyOtp(email: string, otp: string): Promise<AuthUser> { const response = await api.post<ApiResponse<AuthTokens>>(API_ENDPOINTS.auth.verifyOtp, { email, otp }); await SecureStore.setItemAsync('access_token', response.data.accessToken); await SecureStore.setItemAsync('refresh_token', response.data.refreshToken); const profile = await api.get<ApiResponse<{ user: AuthUser }>>(API_ENDPOINTS.auth.profile); return persistSession({ ...response.data, user: profile.data.user }); },
  async logout(): Promise<void> { try { await api.post<ApiResponse<unknown>>(API_ENDPOINTS.auth.logout); } finally { await Promise.all(['access_token', 'refresh_token', 'user_data'].map(key => SecureStore.deleteItemAsync(key))); } },
  async getStoredUser(): Promise<AuthUser | null> { const [token, userData] = await Promise.all([SecureStore.getItemAsync('access_token'), SecureStore.getItemAsync('user_data')]); if (!token || !userData) return null; return JSON.parse(userData) as AuthUser; },
};
