'use client';
import { useState, useCallback } from 'react';
import { updateMedicalRecordById } from 'src/api/medical-record-staff';

export function useUpdateMedicalRecordById() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const update = useCallback(async (recordId, payload) => {
    if (!recordId) return;
    try {
      setLoading(true);
      setError(null);
      await updateMedicalRecordById(recordId, payload);
      setSuccess(true);
      return true;
    } catch (err) {
      console.error('useUpdateMedicalRecordById error:', err);
      setError(err);
      setSuccess(false);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { update, loading, success, error };
}
