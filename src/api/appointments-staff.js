import axiosInstance, { endpoints } from 'src/lib/axios';

export async function createAppointment(params) {
  try {
    const response = await axiosInstance.post(endpoints.appointments_staff.create, { params });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bệnh án:', error);
    throw error;
  }
}

export async function getAppointment(params) {
  try {
    const response = await axiosInstance.get(endpoints.appointments_staff.getAll, { params });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bệnh án:', error);
    throw error;
  }
}

export async function getMyAppointment(params) {
  try {
    const response = await axiosInstance.get(endpoints.appointments_staff.getCurrent, { params });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bệnh án:', error);
    throw error;
  }
}

export async function check_Availability(params) {
  try {
    const response = await axiosInstance.get(endpoints.appointments_staff.checkAvailability, { params });
    return response.data;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bệnh án:', error);
    throw error;
  }
}

export async function getAppointmentID(id) {
  try {
    const response = await axiosInstance.get(endpoints.appointments_staff.getID(id));
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy mẫu hồ sơ bệnh án với ID ${id}:`, error);
    throw error;
  }
}

export async function updateAppointmentID(id) {
  try {
    const response = await axiosInstance.patch(endpoints.appointments_staff.UpdateID(id));
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy mẫu hồ sơ bệnh án với ID ${id}:`, error);
    throw error;
  }
}

export async function deleteAppointmentID(id) {
  try {
    const response = await axiosInstance.delete(endpoints.appointments_staff.DeleteID(id));
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy mẫu hồ sơ bệnh án với ID ${id}:`, error);
    throw error;
  }
}

export async function updateAppointmentStatusID(id, body) {
  try {
    const response = await axiosInstance.patch(
      endpoints.appointments_staff.updateStatus(id),
      body
    );
    return response.data;
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái lịch hẹn:', error);
    throw error;
  }
}

export async function updateVitalMedicalRecordeById(id) {
  try {
    const response = await axiosInstance.patch(endpoints.appointments_staff.UpdateVitalId(id));
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy mẫu hồ sơ bệnh án với ID ${id}:`, error);
    throw error;
  }
}

export async function updateGroupMedicalRecordeById(id) {
  try {
    const response = await axiosInstance.patch(endpoints.appointments_staff.UpdateGroupID(id));
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy mẫu hồ sơ bệnh án với ID ${id}:`, error);
    throw error;
  }
}