'use client';
import { useState, useCallback } from 'react';
import { check_Availability } from 'src/api/appointments-staff';

export function useCheckAvailability() {
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState(null);

  const check = useCallback(async ({ doctorId, appointmentDate }) => {
    if (!doctorId || !appointmentDate) return false;
    try {
      setLoading(true);
      setError(null);
      const res = await check_Availability({ doctorId, appointmentDate });
      const ok = res?.available ?? res?.data ?? false;
      setAvailable(ok);
      return ok;
    } catch (err) {
      console.error('useCheckAvailability error:', err);
      setError(err);
      setAvailable(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { check, available, loading, error };
}
