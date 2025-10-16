'use client';
import { useState, useCallback } from 'react';
import { updateVitalMedicalRecordeById } from 'src/api/medical-record-staff';

export function useUpdateVitalMedicalRecord() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const updateVital = useCallback(async (recordId, indicatorId, newValue) => {
    if (!recordId || !indicatorId) return;
    try {
      setLoading(true);
      await updateVitalMedicalRecordeById(recordId, {
        vitalValues: [
          {
            vitalIndicatorId: indicatorId,
            value: { value: newValue },
          },
        ],
      });
      setSuccess(true);
    } catch (err) {
      console.error('useUpdateVitalMedicalRecord error:', err);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateVital, loading, success };
}
