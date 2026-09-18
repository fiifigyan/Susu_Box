import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { groupService, Group } from '../services/groupService';

export function useGroup(groupId?: string) {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroup = useCallback(async () => {
    if (!groupId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      setGroup(await groupService.get(groupId));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch group');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useFocusEffect(
    useCallback(() => {
      fetchGroup();
    }, [fetchGroup])
  );

  const startGroup = async () => {
    if (!groupId) return;
    try {
      await groupService.start(groupId);
      await fetchGroup();
    } catch (err: any) {
      throw err;
    }
  };

  const addMember = async (userId: string, position: number) => {
    if (!groupId) return;
    try {
      await groupService.addMember(groupId, userId, position);
      await fetchGroup();
    } catch (err: any) {
      throw err;
    }
  };

  return { group, loading, error, refresh: fetchGroup, startGroup, addMember };
}