'use client';
import { useState, useCallback } from 'react';
import { createAppointment } from 'src/api/appointments-staff';

export function useCreateAppointment() {
  const [loading, setLoading] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState(null);
  const [error, setError] = useState(null);

  const create = useCallback(async (payload) => {
    try {
      setLoading(true);
      setError(null);
      const res = await createAppointment(payload);
      setCreatedAppointment(res?.data || res || null);
      return res?.data || res || null;
    } catch (err) {
      console.error('useCreateAppointment error:', err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, createdAppointment, loading, error };
}
