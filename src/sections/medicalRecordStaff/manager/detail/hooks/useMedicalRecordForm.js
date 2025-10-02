'use client';

import { useState, useEffect, useCallback } from 'react';
import { createMedicalRecord, updateVitalMedicalRecordeById } from 'src/api/medical-record-staff';
import { getStaffProfile } from 'src/api/auth/owner';
import { getMedicalRecordTemplateById } from 'src/api/medical-record-templates-staff';
import { getVitalGroupById } from 'src/api/vitals';

const mapIndicatorsToVitalValues = (indicatorValues) => {
  return Object.keys(indicatorValues).map(indicatorId => ({
    vitalIndicatorId: Number(indicatorId),
    value: { value: indicatorValues[indicatorId] },
  }));
};

export function useMedicalRecordForm(templateID) { 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [vitalGroups, setVitalGroups] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [vitalGroupIds, setVitalGroupIds] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!templateID) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      
      try {
        const [templateRes, doctorRes] = await Promise.all([
          getMedicalRecordTemplateById(templateID),
          getStaffProfile(),
        ]);
        
        setDoctorProfile(doctorRes.data);
        const templateData = templateRes.data;
        setTemplateName(templateData.name || '');

        if (templateData?.vitalGroupIds?.length > 0) {
          const groupPromises = templateData.vitalGroupIds.map(id => getVitalGroupById(id));
          const results = await Promise.allSettled(groupPromises);
          const successfulGroups = results
            .filter(r => r.status === 'fulfilled' && r.value.data)
            .map(r => r.value.data);
          
          if (successfulGroups.length === 0) {
            setError("Không thể tải các nhóm chỉ số chi tiết.");
          }
          setVitalGroups(successfulGroups);
        } else {
          setError("Mẫu bệnh án này không có nhóm chỉ số nào.");
          setVitalGroups([]);
        }
      } catch (err) {
        setError("Lỗi khi tải dữ liệu biểu mẫu.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [templateID]);

  const saveMedicalRecord = useCallback(async (initialInfo, indicatorValues) => {
    const createPayload = {
      patientId: Number(initialInfo.patientId),
      doctorId: doctorProfile?.id,
      diagnosis: initialInfo.diagnosis,
      symptoms: initialInfo.symptoms,
      notes: initialInfo.notes,
      templateId: Number(templateID),
      vitalValues: [null]
    };
    if (initialInfo.appointmentId) {
      createPayload.appointmentId = Number(initialInfo.appointmentId);
    }
    ư
    const createResponse = await createMedicalRecord(createPayload);
    const newRecordId = createResponse.data?.id;

    if (!newRecordId) {
      throw new Error("Không nhận được ID của bệnh án mới tạo.");
    }
    
    const vitalValuesPayload = mapIndicatorsToVitalValues(indicatorValues);
    
    if (vitalValuesPayload.length > 0) {
      await updateVitalMedicalRecordeById(newRecordId, {
        vitalValues: vitalValuesPayload,
      });
    }
  }, [doctorProfile, templateID]);

  return {
    loading,
    error,
    vitalGroups,
    doctorProfile,
    templateName,
    saveMedicalRecord,
  };
}