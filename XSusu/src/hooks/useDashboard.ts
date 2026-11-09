import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { dashboardService, type DashboardSummary } from '../services/dashboardService';
import { getErrorMessage } from '../utils/errors';

export interface UseDashboardResult {
  summary: DashboardSummary | null;
  /** True only on the first load, so refreshes don't replace the UI with skeletons. */
  loading: boolean;
  /** True while a pull-to-refresh is in flight. */
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Loads the Home and Profile statistics.
 *
 * Refetches on focus, matching `useGroup`, so figures are current when the user
 * navigates back after making a payment.
 */
export function useDashboard(): UseDashboardResult {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    setError(null);

    try {
      setSummary(await dashboardService.summary());
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load your dashboard.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Existing data stays on screen while the refetch runs.
      void load(false);
    }, [load])
  );

  const refresh = useCallback(() => load(true), [load]);

  return { summary, loading, refreshing, error, refresh };
}
