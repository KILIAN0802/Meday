// hooks/useVitalsTemplate.js
import { getMedicalRecordTemplateById } from 'src/api/medical-record-templates-staff.js';
import { getVitalValuesMedicalRecord } from 'src/api/medical-record-staff.js';
import { getVitalGroupById } from 'src/api/vitals.js';

export function useVitalsTemplate() {
  const fetchVitalsForm = async (templateId, medicalRecordId) => {
    if (!templateId || !medicalRecordId) return [];

    // 1️⃣ Load template + danh sách groupId
    const templateRes = await getMedicalRecordTemplateById(templateId);
    const vitalGroupIds = templateRes?.data?.vitalGroupIds || [];

    // 2️⃣ Load giá trị đã lưu
    const savedRes = await getVitalValuesMedicalRecord(medicalRecordId);
    const savedValuesMap = new Map();
    (savedRes?.data || []).forEach(val => {
      let actual = val.value;
      if (actual && typeof actual === 'object' && 'value' in actual) {
        actual = actual.value;
      }
      savedValuesMap.set(val.vitalIndicatorId, actual);
    });

    // 3️⃣ Load indicators theo từng groupId và chuẩn hóa giá trị
    const groups = await Promise.all(
      vitalGroupIds.map(async id => {
        const res = await getVitalGroupById(id);
        const indicators = res?.data?.indicators || [];
        const groupName = res?.data?.name || 'Không rõ nhóm';

        const processedIndicators = indicators.map(ind => {
          let val = savedValuesMap.get(ind.id) ?? '';

          // Chuẩn hóa giá trị theo type
          switch (ind.valueType) {
            case 'multi_selection':
              if (!Array.isArray(val)) val = val ? [val] : [];
              break;
            case 'number':
              val = val !== '' ? Number(val) : '';
              break;
            case 'selection':
            case 'dropdown':
            case 'bool':
              val = val ?? '';
              break;
            default:
              val = val ?? '';
          }

          return {
            ...ind,
            savedValue: val
          };
        });

        return {
          id,
          name: groupName,
          indicators: processedIndicators
        };
      })
    );

    // 4️⃣ Return mảng nhóm có indicators
    return groups;
  };

  return { fetchVitalsForm };
}
