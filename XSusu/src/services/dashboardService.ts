import { api } from './api';
import { API_ENDPOINTS } from '../config/api';

export interface TrendPoint {
  /** ISO date (YYYY-MM-DD) for the bucket. */
  date: string;
  amount: number;
}

export interface NextPayoutSummary {
  groupId: string;
  groupName: string;
  amount: number;
  /** Payout day, which equals the member's position in the rotation. */
  day: number;
  /** Days until the payout. 0 means today. */
  daysAway: number;
}

export interface DashboardSummary {
  totalContributed: number;
  totalReceived: number;
  /** Payout money withheld under the group's hold-back rule. */
  heldBack: number;
  /** Received minus contributed. Negative while still saving towards a payout. */
  netPosition: number;
  groupsJoined: number;
  activeGroups: number;
  contributionsCount: number;
  payoutsReceived: number;
  /** Active groups where today's contribution has not been recorded yet. */
  pendingTodayCount: number;
  nextPayout: NextPayoutSummary | null;
  /** Seven daily contribution totals, oldest first. Drives the sparkline. */
  trend: TrendPoint[];
  /** Change in contributions over the last 7 days vs the 7 before. */
  trendChangePercent: number;
}

interface ApiResponse<T> { success: boolean; data: T; }

export const dashboardService = {
  async summary(): Promise<DashboardSummary> {
    const response = await api.get<ApiResponse<{ summary: DashboardSummary }>>(
      API_ENDPOINTS.dashboard.summary
    );
    return response.data.summary;
  },
};
