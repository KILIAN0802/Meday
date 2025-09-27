'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getMedicalRecord } from 'src/api/medical-record-staff';

export function useMedicalRecords(status, initialPage = 0, initialRowsPerPage = 10) {
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(initialPage);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    const fetchAllRecords = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getMedicalRecord({ limit: 10000 });
        setAllRecords(response.data || []);
      } catch (err) {
        setError('Không thể tải dữ liệu bệnh án.');
        console.error(`Lỗi khi fetch toàn bộ bệnh án:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllRecords();
  }, [refetchTrigger]);

  const { filteredAndPaginatedRecords, totalFilteredRecords } = useMemo(() => {
    const filtered = status === 'ALL'
      ? allRecords
      : allRecords.filter(record => record.appointment?.status === status);

    const paginated = filtered.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );

    return {
      filteredAndPaginatedRecords: paginated,
      totalFilteredRecords: filtered.length,
    };
  }, [allRecords, status, page, rowsPerPage]);

  const refetch = () => setRefetchTrigger(prev => prev + 1);

  return {
    medicalRecords: filteredAndPaginatedRecords,
    totalRecords: totalFilteredRecords,
    loading,
    error,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    refetch,
  };
}