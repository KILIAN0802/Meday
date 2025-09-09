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

    // 3️⃣ Load indicators theo từng groupId
    const groups = await Promise.all(
      vitalGroupIds.map(async id => {
        const res = await getVitalGroupById(id);
        return res?.data?.indicators || [];
      })
    );
    const vitalIndicators = groups.flat();

    // 4️⃣ Gán giá trị đã lưu vào indicators
    return vitalIndicators.map(ind => ({
      ...ind,
      savedValue: savedValuesMap.get(ind.id) ?? ''
    }));
  };

  return { fetchVitalsForm };
}
