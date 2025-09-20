'use client';

import { useState, useEffect } from 'react';
import { getAppointment } from 'src/api/appointments-staff';
import { getMedicalRecord } from 'src/api/medical-record-staff';

export function useMedicalRecords(status, initialPage = 0, initialRowsPerPage = 10) {
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(initialPage);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      setError(null);
      try {
        let response;
        const params = {
          page: page + 1,
          limit: rowsPerPage,
        };
        if (status === 'ALL') {
          response = await getMedicalRecord(params);
          setMedicalRecords(response.data || []);
          setTotalRecords(response.total || 0);
        } else {
          params.status = status;
          response = await getAppointment(params);
          
          const rawAppointments = response?.data || [];
          const total = response.total || 0;
          
          const newRecords = rawAppointments.flatMap(app => {
              if (app && Array.isArray(app.medicalRecords)) {
                return app.medicalRecords.map(record => ({
                  ...record,
                  appointment: { id: app.id, status: app.status, reason: app.reason }
                }));
              }
              return [];
          });

          setMedicalRecords(newRecords);
          setTotalRecords(total);
        }

      } catch (err) {
        setError('Không thể tải dữ liệu bệnh án.');
        console.error(`Lỗi khi fetch bệnh án với status ${status}:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [page, rowsPerPage, status, refetchTrigger]);

  const refetch = () => setRefetchTrigger(prev => prev + 1);

  return {
    medicalRecords,
    totalRecords,
    loading,
    error,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
    refetch,
  };
}

