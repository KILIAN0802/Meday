import axiosInstance, { endpoints } from 'src/lib/axios';

export async function loginAdmin(params) {
  try {
    const response = await axiosInstance.post(endpoints.auth0.admin, params);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bệnh án:', error);
    throw error;
  }
}

export async function loginStaff(params) {
  try {
    const response = await axiosInstance.post(endpoints.auth0.staff, params);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bệnh án:', error);
    throw error;
  }
}
