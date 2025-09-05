'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Stack,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Button,
  MenuItem,
  Select,
} from '@mui/material';
import axiosInstance from 'src/lib/axios';

export function StaffAppointment() {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [showMyAppointments, setShowMyAppointments] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const endpoint = showMyAppointments
        ? '/api/v1/staff/appointments/my-appointments'
        : '/api/v1/staff/appointments';

      const response = await axiosInstance.get(endpoint);
      setAppointments(response.data?.data || []);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách lịch hẹn:', error);
    } finally {
      setIsLoading(false);
    }
  }, [showMyAppointments]);

  const fetchAppointmentById = async () => {
    if (!searchId.trim()) return;
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/api/v1/staff/appointments/${searchId}`);
      const appointment = response.data?.data;
      setAppointments(appointment ? [appointment] : []);
    } catch (error) {
      console.error('Không tìm thấy lịch hẹn với ID:', searchId);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axiosInstance.patch(`/api/v1/staff/appointments/${id}/status`, {
        status: newStatus,
      });
      fetchAppointments(); // Cập nhật lại danh sách sau khi đổi trạng thái
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Danh sách lịch hẹn
      </Typography>

      <Stack spacing={2} direction="row" sx={{ mb: 2 }}>
        <Button variant="contained" onClick={() => { setShowMyAppointments(false); fetchAppointments(); }}>
          Xem tất cả lịch hẹn
        </Button>
        <Button variant="outlined" onClick={() => { setShowMyAppointments(true); fetchAppointments(); }}>
          Xem lịch hẹn của tôi
        </Button>
        <TextField
        label="Tìm theo ID"
        value={searchId}
        onChange={(e) => {
            const value = e.target.value;
            setSearchId(value);

            if (value === "") {
            // Nếu xóa hết thì trả lại toàn bộ danh sách
            fetchAppointments();
            } else {
            // Gọi API tìm theo ID hoặc lọc trực tiếp trong mảng có sẵn
            axiosInstance
                .get(`/api/v1/staff/appointments/${value}`)
                .then((res) => {
                const appointment = res.data?.data;
                setAppointments(appointment ? [appointment] : []);
                })
                .catch(() => setAppointments([]));
            }
        }}
        size="small"
        />

      </Stack>

      {isLoading ? (
    <CircularProgress />
    ) : appointments.length === 0 ? (
    <Typography variant="body1" color="text.secondary">
        Không có lịch hẹn nào để hiển thị.
    </Typography>
    ) : (
        <Stack spacing={2}>
          {appointments.map((appt) => (
            <Card key={appt.id}>
              <CardContent>
                <Typography variant="h6">Lý do khám: {appt.reason}</Typography>
                <Typography>Thời gian hẹn: {new Date(appt.appointmentDate).toLocaleString()}</Typography>
                {/* <Typography>Trạng thái hiện tại: {appt.status}</Typography> */}
                <Typography>Họ tên bệnh nhân: {appt.fullName}</Typography>
                <Typography>Số điện thoại: {appt.phone}</Typography>
                {appt.notes && <Typography>Ghi chú: {appt.notes}</Typography>}

                <Box sx={{ mt: 2 }}>
                  <Select
                    value={appt.status}
                    onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                    size="small"
                  >
                    <MenuItem value="PENDING">Chờ xác nhận</MenuItem>
                    <MenuItem value="CONFIRMED">Đã xác nhận</MenuItem>
                    <MenuItem value="CANCELLED">Đã hủy</MenuItem>
                    <MenuItem value="COMPLETED">Đã hoàn thành</MenuItem>
                  </Select>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}