import axiosInstance, { endpoints } from 'src/lib/axios';

export async function getPatient(params) {
  try {
    const response = await axiosInstance.get(endpoints.staff_patientManagerment.getPatient, { params });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bệnh nhân:', error);
    throw error;
  }
}