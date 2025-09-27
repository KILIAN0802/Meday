'use client';

import { useState, useEffect, useCallback } from 'react';
import { createMedicalRecord, updateVitalMedicalRecordeById } from 'src/api/medical-record-staff';
import { getStaffProfile } from 'src/api/auth/owner';
import { getMedicalRecordTemplateById } from 'src/api/medical-record-templates-staff';
import { getVitalGroupById } from 'src/api/vitals';

const mapFormDataToVitalValues = (formData) => {
  const validKeys = Object.keys(formData).filter(key => !isNaN(parseInt(key, 10)));

  return validKeys.map(indicatorId => {
    const answer = formData[indicatorId];
    return {
      vitalIndicatorId: Number(indicatorId),
      value: { value: answer },
    };
  });
};

export function useMedicalRecordForm(templateId, open) {
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  
  const [vitalGroups, setVitalGroups] = useState([]);
  const [initialFormData, setInitialFormData] = useState({ patientId: '', appointmentId: '', diagnosis: '', symptoms: '', notes: '' });
  const [formData, setFormData] = useState({});
  const [newRecordId, setNewRecordId] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [highestStep, setHighestStep] = useState(0);

  const fetchData = useCallback(async () => {
    if (!templateId) return;
    setLoading(true);
    setError(null);
    setVitalGroups([]); 
    setFormData({}); 
    setInitialFormData({ patientId: '', appointmentId: '', diagnosis: '', symptoms: '', notes: '' });
    setActiveStep(0); 
    setNewRecordId(null);
    setHighestStep(0);

    try {
      const [templateRes, doctorRes] = await Promise.all([
        getMedicalRecordTemplateById(templateId),
        getStaffProfile(),
      ]);
      setDoctorProfile(doctorRes.data);

      const templateData = templateRes.data;
      if (templateData && templateData.vitalGroupIds && templateData.vitalGroupIds.length > 0) {
        const detailedGroups = await Promise.all(templateData.vitalGroupIds.map(id => getVitalGroupById(id)));
        setVitalGroups(detailedGroups.map(res => res.data));
      } else {
        setError("Mẫu bệnh án này không có các bước chi tiết hoặc dữ liệu không hợp lệ.");
        setVitalGroups([]);
      }
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu cho modal:", err);
      setError("Không thể tải được dữ liệu cho bệnh án. Vui lòng thử lại.");
      setVitalGroups([]);
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => { 
    if (open) {
      fetchData();
    }
  }, [open, fetchData]);

  const handleInitialFormChange = (field, value) => setInitialFormData(prev => ({ ...prev, [field]: value }));
  const handleInputChange = (indicatorId, value) => setFormData(prev => ({ ...prev, [indicatorId]: value }));

  const handleNext = () => {
    const nextStep = activeStep + 1;
    setActiveStep(nextStep);
    if (nextStep > highestStep) {
      setHighestStep(nextStep);
    }
  };
  
  const handleBack = () => setActiveStep(prev => prev - 1);
  
  const handleStepClick = (stepIndex) => {
    if (stepIndex <= highestStep) {
      setActiveStep(stepIndex);
    }
  };
  
  const handleSubmit = async (onCloseCallback) => {
    setLoading(true);
    setError(null);
    try {
      const createPayload = {
        patientId: Number(initialFormData.patientId),
        doctorId: doctorProfile?.id,
        diagnosis: initialFormData.diagnosis,
        symptoms: initialFormData.symptoms,
        notes: initialFormData.notes,
        templateId: templateId,
        vitalValues: [null]
      };
      if (initialFormData.appointmentId) {
        createPayload.appointmentId = Number(initialFormData.appointmentId);
      }
      const createResponse = await createMedicalRecord(createPayload);
      const createdRecordId = createResponse.data.id;
      
      if (!createdRecordId) throw new Error("API không trả về ID bệnh án sau khi tạo");

      const vitalValuesPayload = mapFormDataToVitalValues(formData);
      
      if (vitalValuesPayload.length > 0) {
        await updateVitalMedicalRecordeById(createdRecordId, {
          vitalValues: vitalValuesPayload,
        });
      }

      alert('Tạo và cập nhật bệnh án thành công!');
      onCloseCallback();

    } catch (err) {
      console.error("Lỗi trong quá trình tạo/cập nhật bệnh án:", err);
      const apiErrorMessage = err.response?.data?.message;
      setError(apiErrorMessage || err.message || "Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return {
    loading, isCreating, error, vitalGroups, initialFormData, formData, newRecordId, activeStep, doctorProfile, highestStep,
    handleInitialFormChange, handleInputChange, handleNext, handleBack, handleSubmit, handleStepClick
  };
}