import axiosInstance, { endpoints } from '../../lib/axios';

export async function getAdminProfile() {
  try {
    const response = await axiosInstance.get(endpoints.owner.admin);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi gọi API lấy thông tin Admin:', error);
    throw error;
  }
}

export async function getStaffProfile() {
  try {
    const response = await axiosInstance.get(endpoints.owner.staff);
    return response.data;
  } catch (error) {
    console.error('Lỗi khi gọi API lấy thông tin nhân viên:', error);
    throw error;
  }
}