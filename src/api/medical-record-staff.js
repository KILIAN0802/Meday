import axiosInstance, { endpoints } from 'src/lib/axios';

export async function createMedicalRecord(params) {
  try {
    const response = await axiosInstance.post(endpoints.medical_record_staff.create, { params });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bệnh án:', error);
    throw error;
  }
}

export async function getMedicalRecord(params) {
  try {
    const response = await axiosInstance.get(endpoints.medical_record_staff.get, { params });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bệnh án:', error);
    throw error;
  }
}

export async function getMyMedicalRecord(params) {
  try {
    const response = await axiosInstance.get(endpoints.medical_record_staff.getCurrent, { params });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bệnh án:', error);
    throw error;
  }
}

export async function getMedicalRecordeById(id) {
  try {
    const response = await axiosInstance.get(endpoints.medical_record_staff.getID(id));
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy mẫu hồ sơ bệnh án với ID ${id}:`, error);
    throw error;
  }
}

export async function updateMedicalRecordeById(id) {
  try {
    const response = await axiosInstance.patch(endpoints.medical_record_staff.UpdateID(id));
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy mẫu hồ sơ bệnh án với ID ${id}:`, error);
    throw error;
  }
}

export async function deleteMedicalRecordeById(id) {
  try {
    const response = await axiosInstance.delete(endpoints.medical_record_staff.DeleteID(id));
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy mẫu hồ sơ bệnh án với ID ${id}:`, error);
    throw error;
  }
}

export async function getVitalValuesMedicalRecord(id) {
  try {
    const response = await axiosInstance.get(endpoints.medical_record_staff.getVitalId(id));
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bệnh án:', error);
    throw error;
  }
}

// Thêm tham số 'payload' để chứa dữ liệu cần cập nhật
export async function updateVitalMedicalRecordeById(id, payload) {
  try {
    // Truyền 'payload' làm đối số thứ hai cho hàm patch
    const response = await axiosInstance.patch(
      endpoints.medical_record_staff.UpdateVitalId(id),
      payload
    );
    console.log('Cập nhật thành công:', response.data);
    return response.data;
  } catch (error) {
    // Log cả payload để dễ debug hơn
    console.error(`Lỗi khi cập nhật hồ sơ bệnh án với ID ${id} và payload:`, payload, error);
    throw error;
  }
}

export async function updateGroupMedicalRecordeById(id) {
  try {
    const response = await axiosInstance.patch(endpoints.medical_record_staff.UpdateGroupID(id));
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy mẫu hồ sơ bệnh án với ID ${id}:`, error);
    throw error;
  }
}