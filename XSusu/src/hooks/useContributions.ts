import { useState, useCallback } from 'react';
import { contributionService, TodayStatus } from '../services/contributionService';

export function useContributions(groupId?: string) {
  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTodayStatus = useCallback(async () => {
    if (!groupId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      setTodayStatus(await contributionService.today(groupId));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch today status');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const recordPayment = async (day: number, amount: number) => {
    if (!groupId) return;
    try {
      await contributionService.record(groupId, day, amount);
      await fetchTodayStatus();
    } catch (err: any) {
      throw err;
    }
  };

  const verifyPayment = async (day: number, amount: number, transactionRef: string) => {
    if (!groupId) return;
    try {
      await contributionService.verify(groupId, day, amount, transactionRef);
      await fetchTodayStatus();
    } catch (err: any) {
      throw err;
    }
  };

  const completePayout = async (day: number) => {
    if (!groupId) return;
    try {
      await contributionService.completePayout(groupId, day);
      await fetchTodayStatus();
    } catch (err: any) {
      throw err;
    }
  };

  return {
    todayStatus, loading, error,
    fetchTodayStatus, recordPayment, verifyPayment, completePayout,
  };
}