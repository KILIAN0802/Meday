'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';

import axiosInstance from 'src/lib/axios';

// ----------------------------------------------------------------------

export function MedicalRecordsPending() {
const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusCounts, setStatusCounts] = useState({
    PENDING: 0,
    CONFIRMED: 0,
    COMPLETED: 0,
    ALL: 0,
  });

 const fetchAppointments = async () => {
  setIsLoading(true);
  try {
    const response = await axiosInstance.get('/api/v1/staff/appointments', {
      params: { page: 1, limit: 100 },
    });

    const data = response.data?.data || [];

    // Chỉ lấy PENDING
    const pendingAppointments = data.filter((item) => item.status === 'PENDING');
    setAppointments(pendingAppointments);

    // Cập nhật thống kê nếu cần
    const counts = {
      PENDING: pendingAppointments.length,
      CONFIRMED: data.filter((r) => r.status === 'CONFIRMED').length,
      COMPLETED: data.filter((r) => r.status === 'COMPLETED').length,
      ALL: data.length,
    };
    setStatusCounts(counts);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách lịch hẹn:', error);
  } finally {
    setIsLoading(false);
  }
};


  useEffect(() => {
    fetchAppointments();
  }, []);

  const translateStatus = (status) => {
  switch (status) {
    case 'PENDING':
      return 'Chờ xác nhận';
    case 'CONFIRMED':
      return 'Đã xác nhận';
    case 'COMPLETED':
      return 'Đã hoàn thành';
    case 'CANCELLED':
      return 'Đã hủy';
    default:
      return 'Không rõ';
  }
};

  return (
    <Box sx={{ p: 4 }}>
    {/* =============================================================== */}


    {/* =============================================================== */}
      <Typography variant="h4" gutterBottom>
        Danh sách lịch hẹn chờ xử lý
      </Typography>


      {isLoading ? (
        <Box sx={{ mt: 2 }}>
          <CircularProgress />
        </Box>
      ) : appointments.length === 0 ? (
        <Box sx={{ mt: 2 }}>
          <Typography color="text.secondary">Không có lịch hẹn nào để hiển thị.</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mã lịch hẹn</TableCell>
                <TableCell>Họ tên bệnh nhân</TableCell>
                <TableCell>Thời gian hẹn</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Ngày tạo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.map((appt) => (
                <TableRow key={appt.id}>
                  <TableCell>{appt.id}</TableCell>
                  <TableCell>{appt.patient?.fullname || appt.fullName || 'Không rõ'}</TableCell>
                  <TableCell>{new Date(appt.appointmentDate).toLocaleString()}</TableCell>
                  <TableCell>{translateStatus( appt.status)}</TableCell>
                  <TableCell>{new Date(appt.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
