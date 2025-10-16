'use client';
import { useState, useCallback } from 'react';
import { getMedicalRecordTemplateById } from 'src/api/medical-record-templates-staff';

export function useGetMedicalRecordTemplate() {
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTemplate = useCallback(async (templateId) => {
    if (!templateId) return;
    try {
      setLoading(true);
      const res = await getMedicalRecordTemplateById(templateId);
      setTemplate(res?.data || null);
      return res?.data || null;
    } catch (err) {
      console.error('useGetMedicalRecordTemplate error:', err);
      setTemplate(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { template, loading, fetchTemplate };
}
