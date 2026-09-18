import { api } from './api';
import { API_ENDPOINTS } from '../config/api';

interface ApiResponse<T> { 
  success: boolean; 
  data: T; 
}

export interface InviteResponse { 
	status: 'ADDED' | 'INVITED'; 
	inviteCode?: string; 
	userId?: string; 
}

export interface PendingInvite { 
	id: string; 
	phone: string; 
	name?: string; 
	position: number; 
	inviteCode: string; 
	expiresAt: string; 
	accepted: boolean; 
	createdAt: string; 
	group?: { 
		id: string; 
		name: string 
	}; 	
	creator?: { 
		firstName: string; 
		lastName: string 
	}; 
}

export const inviteService = { 
	async inviteByPhone(groupId: string, phone: string, position: number, name?: string): Promise<InviteResponse> { 
		const response = await api.post<ApiResponse<InviteResponse>>(
			API_ENDPOINTS.groups.invites(groupId), 
			{ phone, name, position }
		); 
		return response.data; 
	}, 
	
	async generateShareLink(groupId: string): Promise<string> { 
		const response = await api.get<ApiResponse<{ shareUrl: string }>>(
			API_ENDPOINTS.groups.shareLink(groupId)
		); 
		return response.data.shareUrl; 
	}, 
	
	async joinByCode(inviteCode: string): Promise<{ group: { name: string }; position: number }> { 
		const response = await api.post<ApiResponse<{ group: { name: string }; position: number }>>(
			API_ENDPOINTS.invites.join, 
			{ inviteCode }
		); 
		return response.data; 
	}, 
	
	async getPendingInvites(groupId: string): Promise<PendingInvite[]> { 
		const response = await api.get<ApiResponse<{ invites: PendingInvite[] }>>(
			API_ENDPOINTS.groups.invites(groupId)
		); 
		return response.data.invites; 
	}, 
	
	async cancelInvite(id: string): Promise<void> { 
		await api.delete(API_ENDPOINTS.invites.byId(id)); 
	}, 
	
	async getMyInvites(): Promise<PendingInvite[]> { 
		const response = await api.get<ApiResponse<{ invites: PendingInvite[] }>>(
			API_ENDPOINTS.invites.myInvites
		); 
		return response.data.invites; 
	} 
};
