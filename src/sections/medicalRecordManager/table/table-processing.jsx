"use client"; // Đánh dấu đây là một Client Component cho Next.js

import React, { useState, useEffect } from 'react';

// --- Sử dụng import thật từ dự án của bạn ---
import { getAppointment, getMyAppointment } from 'src/api/appointments-staff';
import { getMedicalRecordeById } from 'src/api/medical-record-staff';
import { ReusableTablePagination } from 'src/components/pagination';
// ---------------------------------------------------------

import {
  Box,
  Card,
  Table,
  Container,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  TableContainer,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';

// --- Các component phụ trợ (Không thay đổi) ---
function PersonDetailsModal({ person, open, onClose }) {
  if (!person) return null;
  const KEY_LABELS = {
    id: 'Mã số',
    fullname: 'Họ và tên',
    phone: 'Số điện thoại',
    email: 'Email',
    role: 'Vai trò',
  };
  const roleMap = { 1: 'Bác sĩ', 2: 'Y tá' };
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Thông tin chi tiết</DialogTitle>
      <DialogContent dividers>
        {Object.keys(KEY_LABELS).map((key) => {
          if (person?.[key]) {
            const displayValue = key === 'role' ? roleMap[person[key]] || 'Không xác định' : person[key];
            return (
              <Box key={key} sx={{ display: 'flex', mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', minWidth: '120px' }}>
                  {`${KEY_LABELS[key]}:`}
                </Typography>
                <Typography variant="body2">{displayValue}</Typography>
              </Box>
            );
          }
          return null;
        })}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
}

function StatusChip({ status }) {
  const statusMap = {
    PENDING: { color: 'warning', text: 'CHỜ XỬ LÝ' },
    CONFIRMED: { color: 'primary', text: 'ĐÃ XÁC NHẬN' },
    COMPLETED: { color: 'success', text: 'HOÀN THÀNH' },
  };
  const { color, text } = statusMap[status] || { color: 'default', text: 'KHÔNG RÕ' };
  return <Chip label={text} color={color} size="small" sx={{ fontWeight: 'bold' }} />;
}


// --- Component chính ---
export function ConfirmedMedicalRecords() {
  const [appointments, setAppointments] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedPerson, setSelectedPerson] = useState(null);

  const handleViewDetails = (person) => setSelectedPerson(person);
  const handleCloseModal = () => setSelectedPerson(null);
  const handleAccept = (recordId) => console.log(`Tiếp nhận lịch hẹn có ID: ${recordId}`);
  const handleChangePage = (event, newPage) => setPage(newPage);

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiPage = page + 1;
        const appointmentParams = { 
          status: 'CONFIRMED',
          page: apiPage,
          limit: rowsPerPage
        };
        const response = await getAppointment(appointmentParams);
        
        setAppointments(response.data || []);
        setTotalRecords(response.total || 0);

      } catch (err) {
        setError('Không thể tải danh sách lịch hẹn. Vui lòng thử lại.');
        console.error('Lỗi khi fetch lịch hẹn:', err);
        setAppointments([]);
        setTotalRecords(0);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [page, rowsPerPage]);

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 5 }}>Danh sách Bệnh án Đã xác nhận</Typography>
      <Card>
        {error && <Typography color="error" sx={{ p: 2, backgroundColor: 'rgba(255, 0, 0, 0.05)' }}>Lỗi: {error}</Typography>}
        
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Mã Lịch hẹn</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Bệnh nhân</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Mẫu bệnh án</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Lý do khám</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Chức năng</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center"><CircularProgress sx={{ my: 4 }}/></TableCell></TableRow>
              ) : appointments.length > 0 ? (
                appointments.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>
                      <Typography onClick={() => handleViewDetails(row.patient)} variant="body2" sx={{ color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                        {row.patient?.fullname || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>{'N/A'}</TableCell>
                    <TableCell>{row.reason || 'N/A'}</TableCell>
                    <TableCell align="center"><StatusChip status={row.status || 'UNKNOWN'} /></TableCell>
                    <TableCell align="right">
                      <Button variant="contained" color="error" size="small" onClick={() => handleAccept(row.id)}>Đóng bệnh án</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body1" sx={{ my: 4, color: 'text.secondary' }}>
                      Không tìm thấy lịch hẹn nào đã xác nhận.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <ReusableTablePagination
            count={totalRecords}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
        />
      </Card>

      <PersonDetailsModal
        person={selectedPerson}
        open={Boolean(selectedPerson)}
        onClose={handleCloseModal}
      />
    </Container>
  );
}

