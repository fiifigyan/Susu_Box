const configuredOrigin = process.env.EXPO_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3000';
const normalizedOrigin = configuredOrigin.replace(/\/$/, '').replace(/\/api\/v1$/, '');
export const API_BASE_URL = `${normalizedOrigin}/api/v1`;
const fromEnv = (name: string, fallback: string): string => process.env[name] || fallback;
export const API_ENDPOINTS = {
  auth: { 
    login: fromEnv('EXPO_PUBLIC_ENDPOINT_AUTH_LOGIN', '/auth/login'), 
    register: fromEnv('EXPO_PUBLIC_ENDPOINT_AUTH_REGISTER', '/auth/register'), 
    verifyOtp: fromEnv('EXPO_PUBLIC_ENDPOINT_AUTH_VERIFY_OTP', '/auth/verify-otp'),
    resendOtp: fromEnv('EXPO_PUBLIC_ENDPOINT_AUTH_RESEND_OTP', '/auth/resend-otp'), 
    forgotPassword: fromEnv('EXPO_PUBLIC_ENDPOINT_AUTH_FORGOT_PASSWORD', '/auth/forgot-password'),
    resetPassword: fromEnv('EXPO_PUBLIC_ENDPOINT_AUTH_RESET_PASSWORD', '/auth/reset-password'),
    refresh: fromEnv('EXPO_PUBLIC_ENDPOINT_AUTH_REFRESH', '/auth/refresh-token'), 
    logout: fromEnv('EXPO_PUBLIC_ENDPOINT_AUTH_LOGOUT', '/auth/logout'), 
    profile: fromEnv('EXPO_PUBLIC_ENDPOINT_AUTH_PROFILE', '/auth/profile') 
  },
  groups: { 
    list: fromEnv('EXPO_PUBLIC_ENDPOINT_GROUPS', '/groups'), 
    byId: (id: string) => `${fromEnv('EXPO_PUBLIC_ENDPOINT_GROUPS', '/groups')}/${id}`, 
    create: fromEnv('EXPO_PUBLIC_ENDPOINT_GROUPS', '/groups'), 
    start: (id: string) => `${fromEnv('EXPO_PUBLIC_ENDPOINT_GROUPS', '/groups')}/${id}/start`, 
    members: (id: string) => `${fromEnv('EXPO_PUBLIC_ENDPOINT_GROUPS', '/groups')}/${id}/members`, 
    schedule: (id: string) => `${fromEnv('EXPO_PUBLIC_ENDPOINT_GROUPS', '/groups')}/${id}/schedule`, 
    invites: (id: string) => `${fromEnv('EXPO_PUBLIC_ENDPOINT_INVITE_GROUPS', '/invites/groups')}/${id}/invites`, shareLink: (id: string) => `${fromEnv('EXPO_PUBLIC_ENDPOINT_INVITE_GROUPS', '/invites/groups')}/${id}/invites/share-link` 
  },
  contributions: { 
    record: fromEnv('EXPO_PUBLIC_ENDPOINT_CONTRIBUTIONS_RECORD', '/contributions/record'), 
    verify: fromEnv('EXPO_PUBLIC_ENDPOINT_CONTRIBUTIONS_VERIFY', '/contributions/verify'), 
    today: (id: string) => `${fromEnv('EXPO_PUBLIC_ENDPOINT_CONTRIBUTIONS', '/contributions')}/${id}/today`, completePayout: (id: string) => `${fromEnv('EXPO_PUBLIC_ENDPOINT_CONTRIBUTIONS', '/contributions')}/${id}/complete-payout`, 
    saveAuthorization: fromEnv('EXPO_PUBLIC_ENDPOINT_SAVE_AUTHORIZATION', '/contributions/save-authorization') 
  },
  invites: { 
    join: fromEnv('EXPO_PUBLIC_ENDPOINT_INVITE_JOIN', '/invites/join'), 
    myInvites: fromEnv('EXPO_PUBLIC_ENDPOINT_MY_INVITES', '/invites/my-invites'), 
    byId: (id: string) => `${fromEnv('EXPO_PUBLIC_ENDPOINT_INVITES', '/invites')}/${id}` 
  },
  payments: { 
    initialize: fromEnv('EXPO_PUBLIC_ENDPOINT_PAYMENT_INITIALIZE', '/payments/initialize'), 
    verify: (reference: string) => `${fromEnv('EXPO_PUBLIC_ENDPOINT_PAYMENTS', '/payments/verify')}/${reference}` 
  },
  notifications: { 
    list: fromEnv('EXPO_PUBLIC_ENDPOINT_NOTIFICATIONS', '/notifications'), 
    markRead: (id: string) => `${fromEnv('EXPO_PUBLIC_ENDPOINT_NOTIFICATIONS', '/notifications')}/${id}/read`, deviceToken: fromEnv('EXPO_PUBLIC_ENDPOINT_NOTIFICATION_DEVICE_TOKEN', '/notifications/device-token') 
  },
  deposits: { 
    collect: fromEnv('EXPO_PUBLIC_ENDPOINT_DEPOSITS', '/deposits'), 
    status: (id: string) => `${fromEnv('EXPO_PUBLIC_ENDPOINT_DEPOSITS', '/deposits')}/${id}` 
  },
  defaults: { 
    group: (id: string) => `${fromEnv('EXPO_PUBLIC_ENDPOINT_DEFAULTS', '/defaults')}/group/${id}`, 
    stats: fromEnv('EXPO_PUBLIC_ENDPOINT_DEFAULT_STATS', '/defaults/stats') 
  },
  dashboard: {
    summary: fromEnv('EXPO_PUBLIC_ENDPOINT_DASHBOARD', '/dashboard'),
  },
} as const;
