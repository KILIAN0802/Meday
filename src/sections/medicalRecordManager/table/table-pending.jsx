"use client";

import React, { useState, useEffect } from 'react';
import { getMedicalRecordeById } from 'src/api/medical-record-staff';
import { getAppointment, updateAppointmentStatusID, check_Availability, getAppointmentID } from 'src/api/appointments-staff';
import { ReusableTablePagination } from 'src/components/pagination';
// ---------------------------------------------------------
import {
  Snackbar,
  Alert,
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
  };
  const { color, text } = statusMap[status] || { color: 'default', text: 'KHÔNG RÕ' };
  return <Chip label={text} color={color} size="small" sx={{ fontWeight: 'bold' }} />;
};

// --- Component chính ---
export function PendingMedicalRecords() {
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [allRecordIds, setAllRecordIds] = useState([]);
  
  const [isAcceptingId, setIsAcceptingId] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [refetchTrigger, setRefetchTrigger] = useState(0);


  const templateMap = {
    16: 'Bệnh án cấp tính',
    17: 'Bệnh án mãn tính lần 1',
    18: 'Bệnh án mãn tính tái khám',
  };

  const handleViewDetails = (person) => { setSelectedPerson(person); };
  const handleCloseModal = () => { setSelectedPerson(null); };
  const handleChangePage = (event, newPage) => { setPage(newPage); };
  const handleCloseNotification = () => setNotification({ ...notification, open: false });

// --- Thay thế toàn bộ handleAccept bằng đoạn này ---
const handleAccept = async (medicalRecordId) => {
  setIsAcceptingId(medicalRecordId);
  try {
    // Tìm record trong state hiện tại
    const recordToAccept = medicalRecords.find(record => record.id === medicalRecordId);
    if (!recordToAccept) throw new Error('Không tìm thấy bệnh án trong trang hiện tại.');

    // Lấy appointmentId từ record (medicalRecord có trường appointmentId)
    const appointmentId = recordToAccept?.appointmentId || recordToAccept?.appointment?.id;
    if (!appointmentId) throw new Error('Không tìm thấy appointmentId trong bệnh án.');

    // Lấy appointment chi tiết (để có appointmentDate dùng cho check_Availability)
    const appointmentResp = await getAppointmentID(appointmentId);
    // xử lý nhiều dạng response: res.data.data hoặc res.data
    const appointment = appointmentResp?.data?.data || appointmentResp?.data;
    if (!appointment) throw new Error('Không lấy được dữ liệu lịch hẹn từ server.');

    const appointmentDate = appointment?.appointmentDate;
    if (!appointmentDate) throw new Error('Không tìm thấy appointmentDate.');

    // Kiểm tra lịch trùng
    const currentDoctorId = 1; // thay bằng id bác sĩ hiện tại nếu có
    const availabilityResponse = await check_Availability({
      doctorId: currentDoctorId,
      appointmentDate,
    });

    console.log('check_Availability response:', availabilityResponse);

    if (availabilityResponse?.available === true) {
      // Gọi update với body { status: 'CONFIRMED' } (theo Postman của bạn)
      const updateResp = await updateAppointmentStatusID(appointmentId, { status: 'CONFIRMED' });
      console.log('updateAppointmentStatusID response:', updateResp);

      // Verify lại appointment từ server để chắc chắn backend đã đổi trạng thái
      const verifyResp = await getAppointmentID(appointmentId);
      const verifiedAppointment = verifyResp?.data?.data || verifyResp?.data;
      console.log('verify appointment after update:', verifiedAppointment);

      if (verifiedAppointment?.status === 'CONFIRMED') {
        // Cập nhật UI tức thì: loại bỏ medicalRecord khỏi danh sách hiện tại
        setMedicalRecords(prev => prev.filter(r => r.id !== medicalRecordId));
        setAllRecordIds(prev => prev.filter(id => id !== medicalRecordId));
        setTotalRecords(prev => Math.max(0, prev - 1));

        setNotification({ open: true, message: 'Tiếp nhận bệnh án thành công!', severity: 'success' });
      } else {
        // Nếu backend chưa confirm, báo lỗi để điều tra (có thể cache/đồng bộ chậm)
        console.warn('Update returned BUT appointment.status !== CONFIRMED', verifiedAppointment);
        setNotification({ open: true, message: 'Đã gửi yêu cầu tiếp nhận nhưng server chưa cập nhật trạng thái (có thể cache).', severity: 'warning' });
        // vẫn trigger refetch để đảm bảo dữ liệu đồng bộ
        setRefetchTrigger(prev => prev + 1);
      }
    } else {
      setNotification({ open: true, message: 'Lịch của cán bộ nhân viên bị trùng.', severity: 'error' });
    }
  } catch (err) {
    console.error('Lỗi trong quá trình tiếp nhận bệnh án:', err);
    setNotification({ open: true, message: err.message || 'Có lỗi xảy ra, vui lòng thử lại.', severity: 'error' });
  } finally {
    setIsAcceptingId(null);
  }
};

  
useEffect(() => {
  const fetchAllAppointmentData = async () => {
    setLoading(true);
    setError(null);
    try {
      const appointmentParams = { status: 'PENDING', page: 1, limit: 10 };
      console.log('Fetching appointments (PENDING) - trigger:', refetchTrigger);
      const appointmentResponse = await getAppointment(appointmentParams);
      // tùy shape trả về của API: appointmentResponse.data có thể là { data: [...], total } hoặc trực tiếp mảng
      const appointments = appointmentResponse?.data?.data || appointmentResponse?.data || appointmentResponse;
      console.log('appointments raw:', appointmentResponse, 'normalized:', appointments);
      const allIds = (appointments || []).flatMap(
        (app) => app.medicalRecords?.map((record) => record.id) || []
      );
      setAllRecordIds(allIds);
      setTotalRecords(Array.isArray(appointments) ? appointments.length : appointmentResponse?.data?.total || allIds.length);
    } catch (err) {
      setError('Không thể tải dữ liệu tổng.');
      console.error('Lỗi khi fetch toàn bộ lịch hẹn:', err);
    } finally {
      setLoading(false);
    }
  };

  fetchAllAppointmentData();
}, [refetchTrigger]);


  useEffect(() => {
    if (allRecordIds.length === 0 && totalRecords === 0) {
        if(!loading) setLoading(true);
        const timer = setTimeout(() => setLoading(false), 500); 
        return () => clearTimeout(timer);
    };

    if (allRecordIds.length > 0) {
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
    }
  }, [allRecordIds, page, rowsPerPage]);

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 5 }}>Danh sách Bệnh án Chờ xử lý</Typography>
      <Card>
        {error && <Typography color="error" sx={{ px: 3, py: 1 }}>Lỗi: {error}</Typography>}
        
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Mã HS</TableCell>
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
                      <Button 
                        variant="contained" 
                        size="small" 
                        onClick={() => handleAccept(row.id)}
                        disabled={isAcceptingId === row.id}
                      >
                        {isAcceptingId === row.id ? <CircularProgress size={20} color="inherit" /> : 'Tiếp nhận'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={6} align="center">
                        <Typography variant="body1" sx={{ my: 4, color: 'text.secondary' }}>
                            Không tìm thấy bệnh án nào đang chờ xử lý.
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

      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

