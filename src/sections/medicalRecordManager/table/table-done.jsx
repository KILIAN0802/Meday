"use client";

import React, { useState, useEffect } from 'react';

// --- Sử dụng import thật từ dự án của bạn ---
import { getMedicalRecordeById } from 'src/api/medical-record-staff';
import { getAppointment } from 'src/api/appointments-staff';
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

// --- Các component phụ trợ ---

function PersonDetailsModal({ person, open, onClose }) {
  if (!person) return null;
  const KEY_LABELS = {
    id: 'Mã số',
    fullname: 'Họ và tên',
    phone: 'Số điện thoại',
    email: 'Email',
    role: 'Vai trò'
  };
  const roleMap = { 1: 'Bác sĩ', 2: 'Y tá' };
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Thông tin chi tiết</DialogTitle>
      <DialogContent dividers>
        {Object.keys(KEY_LABELS).map((key) => {
          if (person[key]) {
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
};

function StatusChip({ status }) {
  const statusMap = {
    PENDING: { color: 'warning', text: 'CHỜ XỬ LÝ' },
    CONFIRMED: { color: 'primary', text: 'ĐÃ XÁC NHẬN' },
    COMPLETED: { color: 'success', text: 'HOÀN THÀNH' },
  };
  const { color, text } = statusMap[status] || { color: 'default', text: 'KHÔNG RÕ' };
  return <Chip label={text} color={color} size="small" sx={{ fontWeight: 'bold' }} />;
};

// --- Component chính ---
export function CompletedMedicalRecords() {
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [allRecordIds, setAllRecordIds] = useState([]);

  // Ánh xạ ID của mẫu bệnh án sang tên tương ứng
  const templateMap = {
    16: 'Bệnh án cấp tính',
    17: 'Bệnh án mãn tính lần 1',
    18: 'Bệnh án mãn tính tái khám',
  };

  const handleViewDetails = (person) => { setSelectedPerson(person); };
  const handleCloseModal = () => { setSelectedPerson(null); };
  const handleReview = (recordId) => { console.log(`Xem lại bệnh án có ID: ${recordId}`); };
  const handleChangePage = (event, newPage) => { setPage(newPage); };
  
  useEffect(() => {
    const fetchAllAppointmentData = async () => {
      setLoading(true);
      setError(null);
      try {
        const appointmentParams = { status: 'COMPLETED' };
        const appointmentResponse = await getAppointment(appointmentParams);
        const appointments = appointmentResponse.data || [];
        const allIds = appointments.flatMap(
          (app) => app.medicalRecords?.map((record) => record.id) || []
        );
        setAllRecordIds(allIds);
        setTotalRecords(allIds.length);
      } catch (err) {
        setError('Không thể tải dữ liệu tổng.');
        console.error('Lỗi khi fetch toàn bộ lịch hẹn:', err);
      }
    };
    
    fetchAllAppointmentData();
  }, []);

  useEffect(() => {
    if (allRecordIds.length === 0 && totalRecords === 0) {
        if(!loading) setLoading(true);
        const timer = setTimeout(() => setLoading(false), 1000); // Giữ loading một chút rồi tắt
        return () => clearTimeout(timer);
    };

    const fetchDetailsForCurrentPage = async () => {
      setLoading(true);
      try {
        const startIndex = page * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const idsForCurrentPage = allRecordIds.slice(startIndex, endIndex);

        if (idsForCurrentPage.length > 0) {
            const detailPromises = idsForCurrentPage.map(id => getMedicalRecordeById(id));
            const detailResponses = await Promise.all(detailPromises);
            const detailedMedicalRecords = detailResponses.map(res => res.data);
            setMedicalRecords(detailedMedicalRecords);
        } else {
            setMedicalRecords([]);
        }
      } catch (err) {
        setError('Không thể tải chi tiết bệnh án.');
        console.error('Lỗi khi fetch chi tiết bệnh án:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDetailsForCurrentPage();
  }, [allRecordIds, page, rowsPerPage]);

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 5 }}>Danh sách Bệnh án Đã hoàn thành</Typography>
      <Card>
        {error && <Typography color="error" sx={{ px: 3 }}>Lỗi: {error}</Typography>}
        
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Mã HS</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Bệnh nhân</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Mẫu bệnh án</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Lý do khám</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center"><CircularProgress sx={{ my: 4 }}/></TableCell></TableRow>
              ) : medicalRecords.length > 0 ? (
                medicalRecords.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>
                      <Typography onClick={() => handleViewDetails(row.patient)} variant="body2" sx={{ color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                        {row.patient?.fullname || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>{templateMap[row.templateId] || 'N/A'}</TableCell>
                    <TableCell>{row.appointment?.reason || 'N/A'}</TableCell>
                    <TableCell align="center"><StatusChip status={row.appointment?.status || 'UNKNOWN'} /></TableCell>
                    <TableCell align="right">
                      <Button variant="contained" color="info" size="small" onClick={() => handleReview(row.id)}>Xem lại</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={6} align="center">
                        <Typography variant="body1" sx={{ my: 4, color: 'text.secondary' }}>
                            Không tìm thấy bệnh án nào đã hoàn thành.
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
};