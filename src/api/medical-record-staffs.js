import axiosInstance, { endpoints } from 'src/lib/axios';

export async function createMedicalRecord(data) {
  try {
    const response = await axiosInstance.post('/api/staff/medical-records', data);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi tạo hồ sơ bệnh án:', error);
    throw error;
  }
}