'use client';
import { useState, useCallback } from 'react';
import { getMedicalRecord } from 'src/api/medical-record-staff';

export function useGetMedicalRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecords = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const res = await getMedicalRecord(params);
      setRecords(res?.data || []);
      setError(null);
    } catch (err) {
      console.error('useGetMedicalRecords error:', err);
      setError(err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { records, loading, error, fetchRecords };
}
