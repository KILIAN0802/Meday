'use client';

import { useState, useEffect, useCallback } from 'react';
import { createMedicalRecord, updateVitalMedicalRecordeById } from 'src/api/medical-record-staff';
import { getStaffProfile } from 'src/api/auth/owner';
import { getMedicalRecordTemplateById } from 'src/api/medical-record-templates-staff';
import { getVitalGroupById } from 'src/api/vitals';

const findFieldsArray = (valueOptions) => {
  if (!valueOptions) return [];
  if (Array.isArray(valueOptions.fields)) return valueOptions.fields;
  if (Array.isArray(valueOptions.field)) return valueOptions.field;
  const { group } = valueOptions;
  if (!group) return [];
  if (Array.isArray(group)) {
    return group.flatMap(g => g.field || g.fields || []);
  }
  if (typeof group === 'object') {
    return group.field || group.fields || [];
  }
  return [];
};

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
    // --- BƯỚC 1: TẠO BỆNH ÁN RỖNG ĐỂ LẤY ID (GIỮ NGUYÊN) ---
    const createPayload = {
      patientId: Number(initialInfo.patientId),
      doctorId: doctorProfile?.id,
      diagnosis: initialInfo.diagnosis,
      symptoms: initialInfo.symptoms,
      notes: initialInfo.notes,
      templateId: Number(templateID),
      vitalValues: [], // Gửi mảng rỗng đúng như luồng API của bạn yêu cầu
    };
    if (initialInfo.appointmentId) {
      createPayload.appointmentId = Number(initialInfo.appointmentId);
    }

    const createResponse = await createMedicalRecord(createPayload);
    const newRecordId = createResponse.data?.id;

    if (!newRecordId) {
      throw new Error("Không nhận được ID của bệnh án mới tạo.");
    }

    // --- BƯỚC 2: TÁI CẤU TRÚC DỮ LIỆU VÀ GỌI API UPDATE (ĐÃ SỬA LỖI) ---
    const updatePayload = [];
    
    // Sử dụng logic đệ quy để xây dựng payload chính xác
    const processIndicator = (indicator) => {
      // Xử lý câu hỏi lồng nhau (CUSTOM)
      if (indicator.valueType === 'custom') {
        const subFields = findFieldsArray(indicator.valueOptions);
        const customValueObject = {};
        
        subFields.forEach((field, fieldIndex) => {
          const subIndicatorId = field.id || `${indicator.id}-${fieldIndex}-${field.label}`;
          if (indicatorValues.hasOwnProperty(subIndicatorId)) {
            customValueObject[field.label] = indicatorValues[subIndicatorId];
          }
        });

        if (Object.keys(customValueObject).length > 0) {
          updatePayload.push({
            vitalIndicatorId: indicator.id,
            value: customValueObject,
            note: "",
          });
        }
      } 
      // Xử lý câu hỏi đơn giản
      else if (indicatorValues.hasOwnProperty(indicator.id)) {
        const value = indicatorValues[indicator.id];
        const hasValue = Array.isArray(value) ? value.length > 0 : value !== '' && value != null;

        if (hasValue) {
            updatePayload.push({
                vitalIndicatorId: indicator.id,
                value: (indicator.valueType === 'multi_selection' && Array.isArray(value)) 
                    ? value 
                    : { value },
                note: "",
            });
        }
      }
    };

    // Dùng `vitalGroups` từ state của hook làm "bản đồ" cấu trúc
    vitalGroups.forEach(group => {
      group.indicators.forEach(indicator => {
        processIndicator(indicator);
      });
    });
    
    console.log("DỮ LIỆU THÔ TỪ FORM:", indicatorValues);
    console.log("PAYLOAD SẼ GỬI ĐẾN API UPDATE:", JSON.stringify(updatePayload, null, 2));
    
    if (updatePayload.length > 0) {
      await updateVitalMedicalRecordeById(newRecordId, {
        vitalValues: updatePayload,
      });
    }
  }, [doctorProfile, templateID, vitalGroups]); // Thêm vitalGroups vào dependencies

  return {
    loading,
    error,
    vitalGroups,
    doctorProfile,
    templateName,
    saveMedicalRecord,
  };
}