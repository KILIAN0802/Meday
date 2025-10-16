'use client';
import { useState, useCallback } from 'react';
import { getVitalGroupById } from 'src/api/vitals';

export function useGetVitalGroup() {
  const [vitalGroup, setVitalGroup] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchVitalGroup = useCallback(async (groupId) => {
    if (!groupId) return null;
    try {
      setLoading(true);
      const res = await getVitalGroupById(groupId);
      setVitalGroup(res?.data || null);
      return res;
    } catch (err) {
      console.error('useGetVitalGroup error:', err);
      setVitalGroup(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { vitalGroup, loading, fetchVitalGroup };
}
