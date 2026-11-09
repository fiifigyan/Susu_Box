import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { groupService, type Group } from '../services/groupService';
import { getErrorMessage } from '../utils/errors';

/** A group as returned by `GET /groups`, which adds the caller's position. */
export interface GroupListItem extends Group {
  myPosition?: number;
}

export interface UseGroupsResult {
  groups: GroupListItem[];
  /** True only on the first load, so refreshes keep the list on screen. */
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * The signed-in user's groups.
 *
 * Complements `useGroup(groupId)`, which loads a single group. Refetches on
 * focus so the list reflects joins and payouts made elsewhere in the app.
 */
export function useGroups(): UseGroupsResult {
  const [groups, setGroups] = useState<GroupListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    setError(null);

    try {
      setGroups(await groupService.list());
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load your groups.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(false);
    }, [load])
  );

  const refresh = useCallback(() => load(true), [load]);

  return { groups, loading, refreshing, error, refresh };
}
