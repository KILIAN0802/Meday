'use client';
import { useState, useEffect } from 'react';
import { getStaffProfile } from 'src/api/auth/owner';

export function useGetStaffProfile() {
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getStaffProfile();
        setStaff(res?.data || null);
      } catch (err) {
        console.error('useGetStaffProfile error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { staff, loading };
}
