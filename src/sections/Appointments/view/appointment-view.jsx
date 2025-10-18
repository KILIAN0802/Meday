'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Stack,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  IconButton,
  InputAdornment,
  Tooltip,
  Divider,
  Menu,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Add, Edit, Delete, Visibility, Search } from '@mui/icons-material';
import axiosInstance from 'src/lib/axios';
import { deleteAppointmentWithRecords } from 'src/api/appointments-staff.js';
import { MedicalRecordFormLoader } from './hooks/UpdateMedicalRecord.jsx';
import { useRecordCreateQuestion } from '../../medicalRecordStaff/create/Record-create-question';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker, DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { vi } from 'date-fns/locale';

// =============================================================
// COMPONENT CHÍNH
// =============================================================
export function StaffAppointment({ vitalGroups = [], vitalIndicators = [] }) {
  // -------------------------------
  // STATE QUẢN LÝ DỮ LIỆU
  // -------------------------------
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [filters, setFilters] = useState({
    reason: '',
    status: '',
    appointmentDateFrom: '',
    appointmentDateTo: '',
    orderDirection: 'ASC',
    search: '', // tìm kiếm theo tên/SĐT
    page: 0,
    limit: 10,
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: 'success',
    message: '',
  });

  const [openCreateForm, setOpenCreateForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [currentStaff, setCurrentStaff] = useState(null);

  const [formData, setFormData] = useState({
    patientId: '',
    fullName: '',
    phone: '',
    reason: '',
    appointmentDate: '',
    medicalRecordType: '',
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMedicalRecordId, setSelectedMedicalRecordId] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [selectedRecordAppt, setSelectedRecordAppt] = useState(null);

  const [totalAppointments, setTotalAppointments] = useState(0);

  const { vitalGroupIds = [] } = useRecordCreateQuestion(selectedTemplateId);

  // -------------------------------
  // FETCH STAFF HIỆN TẠI
  // -------------------------------
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await axiosInstance.get('/api/v1/staffs/owner/me');
        setCurrentStaff(res.data?.data);
      } catch (err) {
        console.error('Không load được staff hiện tại:', err);
      }
    };
    fetchStaff();
  }, []);

  // -------------------------------
  // FETCH DANH SÁCH LỊCH HẸN (VỚI PHÂN TRANG + TÌM KIẾM)
  // -------------------------------
  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        reason: filters.reason || undefined,
        status: filters.status || undefined,
        appointmentDateFrom: filters.appointmentDateFrom || undefined,
        appointmentDateTo: filters.appointmentDateTo || undefined,
        orderDirection: filters.orderDirection || 'ASC',
        page: filters.page + 1, // backend thường bắt đầu từ 1
        limit: filters.limit,
        search: filters.search || undefined,
      };

      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v)
      );

      const response = await axiosInstance.get('/api/v1/staff/appointments', {
        params: cleanParams,
      });

      setAppointments(response.data?.data || []);
      setTotalAppointments(response.data?.total || 0);
    } catch (err) {
      console.error('Lỗi khi tải lịch hẹn:', err);
      setSnackbar({
        open: true,
        severity: 'error',
        message: 'Không tải được danh sách lịch hẹn',
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // -------------------------------
  // MAPPING TRẠNG THÁI
  // -------------------------------
  const statusMap = {
    PENDING: 'Chờ xử lý',
    CONFIRMED: 'Đã xác nhận',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
  };

  // -------------------------------
  // MỞ FORM CHỈNH SỬA
  // -------------------------------
  const handleOpenEdit = (appt) => {
    setEditingAppointment(appt);
    setFormData({
      patientId: appt.patient?.id || '',
      fullName: appt.patient?.fullname || appt.fullName || '',
      phone: appt.phone || appt.patient?.phone || '',
      reason: appt.reason || '',
      appointmentDate: appt.appointmentDate
        ? appt.appointmentDate.slice(0, 16)
        : '',
      medicalRecordType: appt.medicalRecordType || '',
    });
    setIsEditing(true);
  };

  // -------------------------------
  // XÓA LỊCH HẸN
  // -------------------------------
  const handleDelete = async (appt) => {
    if (!window.confirm('Bạn có chắc muốn xóa lịch hẹn này?')) return;
    try {
      await deleteAppointmentWithRecords(appt);
      setSnackbar({
        open: true,
        severity: 'success',
        message: 'Đã xóa lịch hẹn thành công!',
      });
      fetchAppointments();
    } catch (err) {
      console.error('Lỗi khi xóa lịch hẹn:', err);
      setSnackbar({
        open: true,
        severity: 'error',
        message: 'Xóa thất bại!',
      });
    }
  };

  // -------------------------------
  // TẠO MỚI HOẶC CẬP NHẬT
  // -------------------------------
  const handleSubmitAppointment = async () => {
    if (!currentStaff) return;

    try {
      const payload = {
        patientId: Number(formData.patientId),
        doctorId: currentStaff.id,
        reason: formData.reason,
        appointmentDate: new Date(formData.appointmentDate).toISOString(),
        status: 'CONFIRMED',
        notes: '',
        fullName: formData.fullName,
        phone: formData.phone,
      };

      if (isEditing && editingAppointment) {
        await axiosInstance.patch(
          `/api/v1/staff/appointments/${editingAppointment.id}`,
          payload
        );
        setSnackbar({
          open: true,
          severity: 'success',
          message: 'Cập nhật lịch hẹn thành công!',
        });
      } else {
        await axiosInstance.post('/api/v1/staff/appointments', payload);
        setSnackbar({
          open: true,
          severity: 'success',
          message: 'Tạo lịch hẹn thành công!',
        });
      }

      setOpenCreateForm(false);
      setIsEditing(false);
      fetchAppointments();
    } catch (err) {
      console.error('Lỗi khi tạo/cập nhật lịch hẹn:', err);
      setSnackbar({
        open: true,
        severity: 'error',
        message: 'Không thể lưu lịch hẹn!',
      });
    }
  };

  // -------------------------------
  // JSX TRẢ VỀ
  // -------------------------------
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        📅 Quản lý lịch hẹn
      </Typography>

      {/* =========================
          BỘ LỌC + TÌM KIẾM
      ========================== */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <TextField
            label="Tìm theo tên / SĐT"
            size="small"
            value={filters.search}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value, page: 0 })
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Search color="action" />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size="small">
            <Select
              value={filters.status}
              displayEmpty
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <MenuItem value="">Tất cả trạng thái</MenuItem>
              <MenuItem value="PENDING">Chờ xử lý</MenuItem>
              <MenuItem value="CONFIRMED">Đã xác nhận</MenuItem>
              <MenuItem value="COMPLETED">Hoàn thành</MenuItem>
              <MenuItem value="CANCELLED">Đã hủy</MenuItem>
            </Select>
          </FormControl>

         <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
          <DatePicker
            label="Từ ngày"
            inputFormat="DD/MM/YYYY"
            value={filters.appointmentDateFrom ? new Date(filters.appointmentDateFrom) : null}
            onChange={(newValue) => {
              setFilters({
                ...filters,
                appointmentDateFrom: newValue ? newValue.toISOString().split('T')[0] : '',
              });
            }}
            renderInput={(params) => <TextField {...params} size="small" />}
          />

          <DatePicker
            label="Đến ngày"
            inputFormat="DD/MM/YYYY"
            value={filters.appointmentDateTo ? new Date(filters.appointmentDateTo) : null}
            onChange={(newValue) => {
              setFilters({
                ...filters,
                appointmentDateTo: newValue ? newValue.toISOString().split('T')[0] : '',
              });
            }}
            renderInput={(params) => <TextField {...params} size="small" />}
          />
        </LocalizationProvider>

          <Button variant="contained" onClick={fetchAppointments}>
            Lọc
          </Button>

          <Button
            variant="contained"
            color="success"
            startIcon={<Add />}
            onClick={() => setOpenCreateForm(true)}
          >
            Tạo lịch hẹn
          </Button>
        </Stack>
      </Paper>

      {/* =========================
          BẢNG DANH SÁCH LỊCH HẸN
      ========================== */}
      <TableContainer component={Paper}>
        {isLoading ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : appointments.length === 0 ? (
          <Typography sx={{ textAlign: 'center', p: 4 }}>
            Không có lịch hẹn nào.
          </Typography>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Bệnh nhân</TableCell>
                  <TableCell>SĐT</TableCell>
                  <TableCell>Lý do</TableCell>
                  <TableCell>Ngày hẹn</TableCell>
                  <TableCell>Trạng thái</TableCell>
                  <TableCell>Bác sĩ</TableCell>
                  <TableCell align="center">Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appointments.map((appt) => (
                  <TableRow key={appt.id}>
                    <TableCell>{appt.id}</TableCell>
                    <TableCell>
                      {appt.patient?.fullname || appt.fullName || '—'}
                    </TableCell>
                    <TableCell>
                      {appt.phone || appt.patient?.phone || '—'}
                    </TableCell>
                    <TableCell>{appt.reason || '—'}</TableCell>
                    <TableCell>
                      {appt.appointmentDate
                        ? new Date(appt.appointmentDate).toLocaleString(
                            'vi-VN'
                          )
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {statusMap[appt.status] || appt.status || '—'}
                    </TableCell>
                    <TableCell>
                      {appt.doctor?.fullname || currentStaff?.fullname || '—'}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        aria-controls={`menu-${appt.id}`}
                        aria-haspopup="true"
                        onClick={(e) => setAnchorEl({ id: appt.id, anchor: e.currentTarget })}
                      >
                        <MoreVertIcon />
                      </IconButton>

                      <Menu
                        id={`menu-${appt.id}`}
                        anchorEl={anchorEl?.anchor}
                        open={anchorEl?.id === appt.id}
                        onClose={() => setAnchorEl(null)}
                        PaperProps={{
                          elevation: 3,
                          sx: { minWidth: 160 },
                        }}
                      >
                        <MenuItem
                          onClick={() => {
                            handleOpenEdit(appt);
                            setAnchorEl(null);
                          }}
                        >
                          ✏️ &nbsp; Chỉnh sửa
                        </MenuItem>

                        <MenuItem
                          onClick={() => {
                            const record = appt.medicalRecords?.[0];
                            if (!record) {
                              alert('Lịch hẹn này chưa có bệnh án!');
                              return;
                            }
                            setSelectedMedicalRecordId(record.id);
                            setSelectedTemplateId(appt.templateId ?? 16);
                            setSelectedRecordAppt(appt);
                            setModalOpen(true);
                            setAnchorEl(null);
                          }}
                        >
                          👁️ &nbsp; Xem bệnh án
                        </MenuItem>

                        <Divider />

                        <MenuItem
                          onClick={() => {
                            handleDelete(appt);
                            setAnchorEl(null);
                          }}
                          sx={{ color: 'error.main' }}
                        >
                          🗑️ &nbsp; Xóa lịch hẹn
                        </MenuItem>
                      </Menu>
                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <TablePagination
              component="div"
              count={totalAppointments}
              page={filters.page}
              onPageChange={(e, newPage) =>
                setFilters({ ...filters, page: newPage })
              }
              rowsPerPage={filters.limit}
              rowsPerPageOptions={[5, 10, 25, 50]}
              onRowsPerPageChange={(e) =>
                setFilters({
                  ...filters,
                  limit: parseInt(e.target.value, 10),
                  page: 0,
                })
              }
              labelRowsPerPage="Hiển thị mỗi trang:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}-${to} trong ${count}`
              }
            />
          </>
        )}
      </TableContainer>

      {/* =========================
          DIALOG TẠO / SỬA
      ========================== */}
      <Dialog
        open={openCreateForm || isEditing}
        onClose={() => {
          setOpenCreateForm(false);
          setIsEditing(false);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {isEditing ? 'Cập nhật lịch hẹn' : 'Tạo lịch hẹn mới'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Mã bệnh nhân"
              fullWidth
              value={formData.patientId}
              onChange={(e) =>
                setFormData({ ...formData, patientId: e.target.value })
              }
            />
            <TextField
              label="Họ tên"
              fullWidth
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
            />
            <TextField
              label="Số điện thoại"
              fullWidth
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
            <TextField
              label="Lý do"
              fullWidth
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
            />
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={vi}>
              <DateTimePicker
                label="Ngày hẹn"
                value={formData.appointmentDate ? new Date(formData.appointmentDate) : null}
                onChange={(newValue) => {
                  setFormData({
                    ...formData,
                    appointmentDate: newValue ? newValue.toISOString() : '',
                  });
                }}
                inputFormat="dd/MM/yyyy HH:mm"
                ampm={false}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    size="small"
                  />
                )}
              />
            </LocalizationProvider>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenCreateForm(false);
              setIsEditing(false);
            }}
          >
            Hủy
          </Button>
          <Button variant="contained" onClick={handleSubmitAppointment}>
            {isEditing ? 'Lưu thay đổi' : 'Tạo'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* =========================
          FORM BỆNH ÁN
      ========================== */}
      <MedicalRecordFormLoader
        templateId={selectedTemplateId}
        medicalRecordId={selectedMedicalRecordId}
        appointment={selectedRecordAppt}
        setSnackbar={setSnackbar}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        currentStaff={currentStaff}
      />

      {/* =========================
          SNACKBAR THÔNG BÁO
      ========================== */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() =>
          setSnackbar({ ...snackbar, open: false })
        }
      >
        <Alert
          severity={snackbar.severity}
          onClose={() =>
            setSnackbar({ ...snackbar, open: false })
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
