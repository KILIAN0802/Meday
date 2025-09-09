"use client";

import React, { useState, useEffect } from 'react';

// --- Import API của bạn ---
import { getMedicalRecord } from 'src/api/medical-record-staff';
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

// --- COMPONENT PHỤ 1: MODAL THÔNG TIN CHI TIẾT ---
// (Không thay đổi)
function PersonDetailsModal({ person, open, onClose }) {
  if (!person) return null;
  const KEY_LABELS = { id: 'Mã số', fullname: 'Họ và tên', phone: 'Số điện thoại', email: 'Email', role: 'Vai trò' };
  const roleMap = { 1: 'Bác sĩ', 2: 'Y tá' };
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Thông tin chi tiết</DialogTitle>
      <DialogContent dividers>
        {Object.keys(KEY_LABELS).map((key) => {
          if (person && person[key]) {
            const displayValue = key === 'role' ? roleMap[person[key]] || 'Không xác định' : person[key];
            return (
              <Box key={key} sx={{ display: 'flex', mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', minWidth: '120px' }}>{`${KEY_LABELS[key]}:`}</Typography>
                <Typography variant="body2">{displayValue}</Typography>
              </Box>
            );
          }
          return null;
        })}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Đóng</Button></DialogActions>
    </Dialog>
  );
}

// --- COMPONENT PHỤ 2: CHIP HIỂN THỊ TRẠNG THÁI ---
// (Không thay đổi)
function StatusChip({ status }) {
  const statusMap = {
    PENDING: { color: 'warning', text: 'CHỜ XỬ LÝ' },
    CONFIRMED: { color: 'primary', text: 'ĐÃ XÁC NHẬN' },
    CANCELLED: { color: 'error', text: 'ĐÃ HUỶ' },
    COMPLETED: { color: 'success', text: 'HOÀN THÀNH' },
  };
  const { color, text } = statusMap[status] || { color: 'default', text: 'KHÔNG RÕ' };
  return <Chip label={text} color={color} size="small" sx={{ fontWeight: 'bold' }} />;
}

// --- COMPONENT CHÍNH: BẢNG TẤT CẢ BỆNH ÁN ---
// (Phiên bản cuối cùng sử dụng API mới một cách chính xác)
export function AllMedicalRecords() {
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedPerson, setSelectedPerson] = useState(null);

  const templateMap = { 16: 'Bệnh án cấp tính', 17: 'Bệnh án mãn tính lần 1', 18: 'Bệnh án mãn tính tái khám' };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // ### USEEFFECT ĐÃ ĐƯỢC ĐƠN GIẢN HÓA VÀ SỬA LỖI ###
  useEffect(() => {
    const fetchMedicalRecords = async () => {
      setLoading(true);
      setError(null);
      try {
        // Chỉ cần gọi API getMedicalRecord vì nó đã chứa đủ thông tin
        const params = { page: page + 1, limit: rowsPerPage };
        const response = await getMedicalRecord(params);

        // Lấy dữ liệu trực tiếp từ phản hồi của API
        const records = response.data || [];
        const total = response.total || 0;

        setMedicalRecords(records);
        setTotalRecords(total);

      } catch (err) {
        setError('Không thể tải dữ liệu bệnh án.');
        console.error('Lỗi khi fetch dữ liệu bệnh án:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMedicalRecords();
  }, [page, rowsPerPage]); // Chạy lại mỗi khi trang hoặc số dòng thay đổi

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 5 }}>Danh sách Tất cả Bệnh án</Typography>
      <Card>
        {error && (<Typography color="error" sx={{ px: 3, py: 2 }}>Lỗi: {error}</Typography>)}
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Mã HS</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Bệnh nhân</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Mẫu bệnh án</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Lý do khám</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} align="center"><CircularProgress sx={{ my: 4 }} /></TableCell></TableRow>
              ) : medicalRecords.length > 0 ? (
                medicalRecords.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>
                      <Typography onClick={() => setSelectedPerson(row.patient)} variant="body2" sx={{ color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                        {row.patient?.fullname || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>{templateMap[row.templateId] || 'N/A'}</TableCell>
                    <TableCell>{row.appointment?.reason || 'N/A'}</TableCell>
                    <TableCell align="center">
                      {/* Dữ liệu status giờ đây đã chính xác */}
                      <StatusChip status={row.appointment?.status || 'UNKNOWN'} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} align="center"><Typography variant="body1" sx={{ my: 4, color: 'text.secondary' }}>Không tìm thấy bệnh án nào.</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <ReusableTablePagination
          count={totalRecords}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>
      <PersonDetailsModal
        person={selectedPerson}
        open={Boolean(selectedPerson)}
        onClose={() => setSelectedPerson(null)}
      />
    </Container>
  );
}