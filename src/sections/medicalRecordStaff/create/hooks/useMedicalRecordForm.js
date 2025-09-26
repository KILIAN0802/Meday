import { useState, useEffect, useCallback } from 'react';
import { createMedicalRecord, updateVitalMedicalRecordeById } from 'src/api/medical-record-staff';
import { getStaffProfile } from 'src/api/auth/owner';
import { getMedicalRecordTemplateById } from 'src/api/medical-record-templates-staff';
import { getVitalGroupById } from 'src/api/vitals';

const mapFormDataToVitalValues = (formData) => {
  return Object.keys(formData).map(indicatorId => {
    const answer = formData[indicatorId];
    return {
      vitalIndicatorId: Number(indicatorId),
      value: {
        value: answer,
      },
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

  const fetchData = useCallback(async () => {
    if (!templateId) return;
    setLoading(true);
    setError(null);
    setVitalGroups([]); 
    setFormData({}); 
    setInitialFormData({ patientId: '', appointmentId: '', diagnosis: '', symptoms: '', notes: '' });
    setActiveStep(0); 
    setNewRecordId(null);

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

  const handleNext = async () => {
        if (activeStep === 0) {
        setIsCreating(true);
        setError(null);
        try {
            const payload = {
                patientId: Number(initialFormData.patientId),
                doctorId: doctorProfile?.id,
                diagnosis: initialFormData.diagnosis,
                symptoms: initialFormData.symptoms,
                notes: initialFormData.notes,
                templateId: templateId,
                vitalValues: [null]
            };
            if (initialFormData.appointmentId) {
                payload.appointmentId = Number(initialFormData.appointmentId);
            }

            const response = await createMedicalRecord(payload);
        const createdRecordId = response.data.id;
        
        if (!createdRecordId) throw new Error("API không trả về ID bệnh án");

        setNewRecordId(createdRecordId);
        setActiveStep(prev => prev + 1);
      } catch (err) {
        console.error("Lỗi khi tạo bệnh án:", err);
        const apiErrorMessage = err.response?.data?.message;
        setError(apiErrorMessage || err.message || "Tạo bệnh án thất bại. Vui lòng kiểm tra lại thông tin.");
      } finally {
        setIsCreating(false);
      }
    } else {
      setActiveStep(prev => prev + 1);
    }
  };
  
  const handleBack = () => setActiveStep(prev => prev - 1);
  const handleSubmit = async (onCloseCallback) => {
    if (!newRecordId) {
      setError("Không có ID bệnh án để cập nhật.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const vitalValuesPayload = mapFormDataToVitalValues(formData);
      await updateVitalMedicalRecordeById(newRecordId, {
        vitalValues: vitalValuesPayload,
      });

      alert('Tạo và cập nhật bệnh án thành công!');
      onCloseCallback();
    } catch (err) {
      console.error("Lỗi khi cập nhật bệnh án:", err);
      setError(err.message || "Cập nhật chi tiết bệnh án thất bại.");
    } finally {
      setLoading(false);
    }
  };
  return {
    loading,
    isCreating,
    error,
    vitalGroups,
    initialFormData,
    formData,
    newRecordId,
    activeStep,
    doctorProfile,
    handleInitialFormChange,
    handleInputChange,
    handleNext,
    handleBack,
    handleSubmit,
  };
}