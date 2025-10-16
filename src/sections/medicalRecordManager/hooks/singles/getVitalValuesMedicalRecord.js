'use client';
import { useState, useCallback } from 'react';
import { getVitalValuesMedicalRecord } from 'src/api/medical-record-staff';

export function useGetVitalValuesMedicalRecord() {
  const [vitalValues, setVitalValues] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchVitalValues = useCallback(async (recordId) => {
    if (!recordId) return;
    try {
      setLoading(true);
      const res = await getVitalValuesMedicalRecord(recordId);
      setVitalValues(res?.data || []);
      return res.data;
    } catch (err) {
      console.error('useGetVitalValuesMedicalRecord error:', err);
      setVitalValues([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { vitalValues, loading, fetchVitalValues };
}
