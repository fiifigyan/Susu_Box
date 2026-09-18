import { useCallback, useEffect, useState } from 'react';
import { defaultService, DefaultStats, Defaulter } from '../services/defaultService';
import { depositService, DepositStatus } from '../services/depositService';
export function useDefaultPrevention(groupId?: string) {
  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
  const [depositStatus, setDepositStatus] = useState<DepositStatus | null>(null);
  const [defaultStats, setDefaultStats] = useState<DefaultStats | null>(null);
  const [loading, setLoading] = useState(false);
  const refresh = useCallback(async () => { setLoading(true); try { const [stats, deposits, groupDefaulters] = await Promise.all([defaultService.stats(), groupId ? depositService.status(groupId) : Promise.resolve(null), groupId ? defaultService.list(groupId) : Promise.resolve([])]); setDefaultStats(stats); setDepositStatus(deposits); setDefaulters(groupDefaulters); } finally { setLoading(false); } }, [groupId]);
  useEffect(() => { void refresh(); }, [refresh]);
  return { defaulters, depositStatus, defaultStats, loading, refresh };
}
