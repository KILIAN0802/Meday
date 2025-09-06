// import axiosInstance, { endpoints } from 'src/lib/axios';

// export async function getMedicalRecordTemplates(params) {
//   try {
//     const response = await axiosInstance.get(endpoints.medical_record_templates_staff.get, { params });
//     return response.data;
//   } catch (error) {
//     console.error('Lỗi khi lấy danh sách mẫu hồ sơ bệnh án:', error);
//     throw error;
//   }
// }

// export async function getMedicalRecordTemplateById(id) {
//   try {
//     const response = await axiosInstance.get(endpoints.medical_record_templates_staff.getID(id));
//     return response.data;
//   } catch (error) {
//     console.error(`Lỗi khi lấy mẫu hồ sơ bệnh án với ID ${id}:`, error);
//     throw error;
//   }
// }