'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

import axiosInstance from 'src/lib/axios';

export function MedicalRecords() {
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
        params: { page: 1, limit: 50 },
      });
      const data = response.data?.data || [];
      const filtered = data.filter((item) => item.status !== 'CANCELLED');
      setAppointments(filtered);

      const counts = {
        PENDING: filtered.filter((r) => r.status === 'PENDING').length,
        CONFIRMED: filtered.filter((r) => r.status === 'CONFIRMED').length,
        COMPLETED: filtered.filter((r) => r.status === 'COMPLETED').length,
        ALL: filtered.length,
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
        return 'Chờ xử lý';
      case 'CONFIRMED':
        return 'Đang xử lý';
      case 'COMPLETED':
        return 'Đã hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return 'Không rõ';
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axiosInstance.patch(`/api/v1/staff/appointments/${id}/status`, {
        status: newStatus,
      });

      // Cập nhật trạng thái ngay lập tức trong UI
      setAppointments((prev) =>
        prev.map((appt) => (appt.id === id ? { ...appt, status: newStatus } : appt))
      );

      // Cập nhật số lượng thống kê
      fetchAppointments();
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Danh sách bệnh án
      </Typography>

      {/* Thống kê trạng thái */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { label: 'Chờ xử lý', count: statusCounts.PENDING },
          { label: 'Đang xử lý', count: statusCounts.CONFIRMED },
          { label: 'Đã hoàn thành', count: statusCounts.COMPLETED },
          { label: 'Tất cả lịch hẹn', count: statusCounts.ALL },
        ].map((item, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1">{item.label}</Typography>
                <Typography variant="h6">{item.count} trường hợp</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Bảng danh sách lịch hẹn */}
      <Typography variant="h5" gutterBottom>
        Danh sách lịch hẹn
      </Typography>

      {isLoading ? (
        <CircularProgress />
      ) : appointments.length === 0 ? (
        <Typography color="text.secondary">Không có lịch hẹn nào để hiển thị.</Typography>
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
                <TableCell>Cập nhật trạng thái</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.map((appt) => (
                <TableRow key={appt.id}>
                  <TableCell>{appt.id}</TableCell>
                  <TableCell>{appt.patient?.fullname || appt.fullName || 'Không rõ'}</TableCell>
                  <TableCell>{new Date(appt.appointmentDate).toLocaleString()}</TableCell>
                  <TableCell>{translateStatus(appt.status)}</TableCell>
                  <TableCell>{new Date(appt.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Select
                      value={appt.status}
                      onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                      size="small"
                    >
                      <MenuItem value="PENDING">Chờ xử lý</MenuItem>
                      <MenuItem value="CONFIRMED">Đang xử lý</MenuItem>
                      <MenuItem value="COMPLETED">Đã hoàn thành</MenuItem>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
