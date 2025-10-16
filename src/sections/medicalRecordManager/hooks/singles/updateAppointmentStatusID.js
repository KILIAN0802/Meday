'use client';
import { useState, useCallback } from 'react';
import { updateAppointmentStatusID } from 'src/api/appointments-staff';

export function useUpdateAppointmentStatus() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const updateStatus = useCallback(async (appointmentId, status) => {
    if (!appointmentId || !status) return;
    try {
      setLoading(true);
      setError(null);
      await updateAppointmentStatusID(appointmentId, { status });
      setSuccess(true);
      return true;
    } catch (err) {
      console.error('useUpdateAppointmentStatus error:', err);
      setError(err);
      setSuccess(false);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateStatus, loading, success, error };
}
