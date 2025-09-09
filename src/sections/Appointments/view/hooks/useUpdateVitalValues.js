// hooks/useUpdateVitalValues.js
import axiosInstance from 'src/lib/axios.js';

export function useUpdateVitalValues() {
  const updateVitals = async (medicalRecordId, values, questions, doctorId) => {
    if (!medicalRecordId) throw new Error("MedicalRecordId không tồn tại");

    // 1️⃣ Lọc indicator mới (chưa có giá trị cũ)
    const newIndicators = questions.filter(q => values[q.id] && !q.savedValue);

    for (const q of newIndicators) {
      // 2️⃣ Tạo vitalGroup mới cho indicator
      await axiosInstance.patch(
        `/api/staff/medical-records/vital-group/${q.vitalGroupId}`,
        {
          examinationDate: new Date().toISOString(),
          groupId: q.vitalGroupId,
          doctorId: doctorId
        }
      );
    }
// Chuẩn hóa tất cả giá trị
const formatted = Object.entries(values)
  .filter(([, v]) => v !== '' && v !== null)
  .map(([id, v]) => ({
    vitalIndicatorId: parseInt(id),
    value: { value: v },
    note: ''
  }));

if (formatted.length) {
  await axiosInstance.patch(`/api/staff/medical-records/${medicalRecordId}/vital-values`, {
    vitalValues: formatted,
    doctorId // truyền thêm nếu backend cần
  });
}

  };

  return { updateVitals };
}
