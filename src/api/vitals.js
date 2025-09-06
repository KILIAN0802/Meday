import axiosInstance, { endpoints } from 'src/lib/axios';

export async function getVitalGroups(params) {
  try {
    const response = await axiosInstance.get(endpoints.vitals.getAllGroup, { params });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách nhóm chỉ số sinh tồn:', error);
    throw error;
  }
}
export async function getVitalGroupById(id) {
  try {
    const response = await axiosInstance.get(endpoints.vitals.getIDGroup(id));
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy nhóm chỉ số sinh tồn với ID ${id}:`, error);
    throw error;
  }
}

export async function getVitalIndicators(params) {
  try {
    const response = await axiosInstance.get(endpoints.vitals.getAllIndicator, { params });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách chỉ số sinh tồn:', error);
    throw error;
  }
}

export async function getVitalIndicatorById(id) {
  try {
    const response = await axiosInstance.get(endpoints.vitals.getIDIndicator(id));
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy chỉ số sinh tồn với ID ${id}:`, error);
    throw error;
  }
}