import axiosInstance, { endpoints } from 'src/lib/axios';

export async function createAppointment(params) {
  try {
    const response = await axiosInstance.post(endpoints.appointments_staff.create,  params );
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

export async function updateVitalMedicalRecordById(id) {
  try {
    const response = await axiosInstance.patch(endpoints.appointments_staff.UpdateVitalId(id));
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy mẫu hồ sơ bệnh án với ID ${id}:`, error);
    throw error;
  }
}

export async function updateGroupMedicalRecordById(id) {
  try {
    const response = await axiosInstance.patch(endpoints.appointments_staff.UpdateGroupID(id));
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy mẫu hồ sơ bệnh án với ID ${id}:`, error);
    throw error;
  }
}



export const deleteAppointmentIDs = async (id) => {
  try {
    const res = await axiosInstance.delete(`/api/v1/staff/appointments/${id}`);
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi xoá appointment:", error);
    throw error;
  }
};


export const deleteAppointmentWithRecords = async (appointment) => {
  try {
    // 1. Xóa medical records trước
    if (appointment.medicalRecords?.length > 0) {
      for (const record of appointment.medicalRecords) {
        await axiosInstance.delete(
          `https://hospital.huyit.lat/api/staff/medical-records/${record.id}`
        );
        console.log("Đã xóa bệnh án:", record.id);
      }
    }

    // 2. Xóa appointment
    await axiosInstance.delete(
      `https://hospital.huyit.lat/api/v1/staff/appointments/${appointment.id}`
    );
    console.log("Đã xóa lịch hẹn:", appointment.id);
  } catch (error) {
    console.error("Lỗi khi xóa:", error);
    throw error;
  }
};
