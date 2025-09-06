'use client';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

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
  Snackbar,
  Alert,
} from '@mui/material';
import axiosInstance from 'src/lib/axios';

export function StaffAppointment() {
  const [appointments, setAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]); // dữ liệu gốc
  const [isLoading, setIsLoading] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [showMyAppointments, setShowMyAppointments] = useState(false);

  // create appointment dialog (giữ nguyên)
  const [openCreateForm, setOpenCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    reason: '',
    appointmentDate: '',
    status: 'PENDING',
    notes: '',
    fullName: '',
    phone: '',
    emergencyContact: '',
    insurance: '',
    preMedicalResponses: [{ questionId: 0, answerValue: '' }],
  });

  // snackbar
  const [snackbar, setSnackbar] = useState({ open: false, severity: 'success', message: '' });

  // --- NEW: medical record dialog state ---
  const [openMedicalDialog, setOpenMedicalDialog] = useState(false);
  const [medicalForm, setMedicalForm] = useState({
    appointmentId: '',
    patientId: '',
    doctorId: '',
    diagnosis: '',
    symptoms: '',
    notes: '',
    templateId: '',
    vitalValuesCSV: '', // input as comma-separated string, will parse to array
  });

  // fetch appointments
  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    try {
      const endpoint = showMyAppointments
        ? '/api/v1/staff/appointments/my-appointments'
        : '/api/v1/staff/appointments';

      const response = await axiosInstance.get(endpoint);
      const data = response.data?.data || [];
      setAppointments(data);
      setAllAppointments(data); // lưu bản gốc để search cục bộ
    } catch (error) {
      console.error('Lỗi khi lấy danh sách lịch hẹn:', error);
      setSnackbar({ open: true, severity: 'error', message: 'Lấy lịch hẹn thất bại' });
    } finally {
      setIsLoading(false);
    }
  }, [showMyAppointments]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axiosInstance.patch(`/api/v1/staff/appointments/${id}/status`, {
        status: newStatus,
      });
      setSnackbar({ open: true, severity: 'success', message: 'Cập nhật trạng thái thành công' });
      fetchAppointments(); // reload lại sau khi đổi trạng thái
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error);
      setSnackbar({ open: true, severity: 'error', message: 'Cập nhật trạng thái thất bại' });
    }
  };

  // search
  const handleSearch = (value) => {
    setSearchId(value);
    if (value === '') {
      setAppointments(allAppointments);
    } else {
      const filtered = allAppointments.filter((r) =>
        r.id?.toString().includes(value)
      );
      setAppointments(filtered);
    }
  };

  // create appointment (giữ nguyên logic cũ)
  const handleSubmitAppointment = async () => {
    const payload = {
      reason: formData.reason,
      appointmentDate: formData.appointmentDate,
      status: formData.status,
      notes: formData.notes,
      fullName: formData.fullName,
      phone: formData.phone,
      customInfo: {
        emergencyContact: formData.emergencyContact,
        insurance: formData.insurance,
      },
      preMedicalResponses: formData.preMedicalResponses,
    };

    try {
      await axiosInstance.post('/api/v1/staff/appointments', payload);
      setOpenCreateForm(false);
      setSnackbar({ open: true, severity: 'success', message: 'Tạo lịch hẹn thành công' });
      fetchAppointments();
      setFormData({
        reason: '',
        appointmentDate: '',
        status: 'PENDING',
        notes: '',
        fullName: '',
        phone: '',
        emergencyContact: '',
        insurance: '',
        preMedicalResponses: [{ questionId: 0, answerValue: '' }],
      });
    } catch (error) {
      console.error('Lỗi khi tạo lịch hẹn:', error.response?.data || error.message);
      setSnackbar({ open: true, severity: 'error', message: 'Tạo lịch hẹn thất bại' });
    }
  };

  // --- NEW: Open medical dialog prefilled from appointment ---
  const openCreateMedicalFor = (appt) => {
    setMedicalForm({
      appointmentId: appt?.id || '',
      patientId: appt?.patient?.id || '',
      doctorId: appt?.doctor?.id || '',
      diagnosis: '',
      symptoms: '',
      notes: '',
      templateId: '',
      // vitalValuesCSV: '', // user can type "120,80,36.6" or leave empty
    });
    setOpenMedicalDialog(true);
  };

  // parse CSV vital values into array (numbers or null)
  // const parseVitalCSV = (csv) => {
  //   if (!csv || csv.trim() === '') return []; // API sample allows [null], but we send empty array if none
  //   return csv.split(',').map((s) => {
  //     const t = s.trim();
  //     if (t === '' || t.toLowerCase() === 'null') return null;
  //     const n = Number(t);
  //     return Number.isNaN(n) ? t : n;
  //   });
  // };

  // validation for medical record
  const validateMedicalForm = () => {
    if (!medicalForm.appointmentId) {
      setSnackbar({ open: true, severity: 'warning', message: 'Thiếu appointmentId' });
      return false;
    }
    if (!medicalForm.patientId) {
      setSnackbar({ open: true, severity: 'warning', message: 'Thiếu patientId' });
      return false;
    }
    if (!medicalForm.doctorId) {
      setSnackbar({ open: true, severity: 'warning', message: 'Thiếu doctorId' });
      return false;
    }
    if (!medicalForm.diagnosis) {
      setSnackbar({ open: true, severity: 'warning', message: 'Vui lòng nhập chẩn đoán' });
      return false;
    }
    return true;
  };

  // --- NEW: submit medical record ---
  // const handleSubmitMedicalRecord = async () => {
  //   if (!validateMedicalForm()) return;

  //   const payload = {
  //     patientId: Number(medicalForm.patientId),
  //     doctorId: Number(medicalForm.doctorId),
  //     diagnosis: medicalForm.diagnosis,
  //     symptoms: medicalForm.symptoms,
  //     notes: medicalForm.notes,
  //     templateId: medicalForm.templateId ? Number(medicalForm.templateId) : undefined,
  //     appointmentId: Number(medicalForm.appointmentId),
  //     vitalValues: parseVitalCSV(medicalForm.vitalValuesCSV),
  //   };

  //   try {
  //     // Use the endpoint from your screenshot
  //     await axiosInstance.post('/api/staff/medical-records', payload);
  //     setOpenMedicalDialog(false);
  //     setSnackbar({ open: true, severity: 'success', message: 'Tạo bệnh án thành công' });
  //     fetchAppointments(); // reload appointments so new medicalRecords appear
  //   } catch (error) {
  //     console.error('Lỗi khi tạo medicalRecord:', error.response?.data || error.message);
  //     setSnackbar({ open: true, severity: 'error', message: 'Tạo bệnh án thất bại' });
  //   }
  // };
  const handleSubmitMedicalRecord = async () => {
  if (!validateMedicalForm()) return;

  // Chuẩn hóa payload
  const payload = {
    patientId: Number(medicalForm.patientId),
    doctorId: Number(medicalForm.doctorId),
    diagnosis: medicalForm.diagnosis,
    symptoms: medicalForm.symptoms,
    notes: medicalForm.notes,
    appointmentId: Number(medicalForm.appointmentId),
    // vitalValues: parseVitalCSV(medicalForm.vitalValuesCSV) || [],
  };

  // Chỉ gửi templateId nếu có
  if (medicalForm.templateId) {
    payload.templateId = Number(medicalForm.templateId);
  }

  console.log("Payload trước khi gửi:", payload);

  try {
    const response = await axiosInstance.post('/api/staff/medical-records', payload);
    console.log("Medical record tạo thành công:", response.data);

    setOpenMedicalDialog(false);
    setSnackbar({ open: true, severity: 'success', message: 'Tạo bệnh án thành công' });

    fetchAppointments(); // reload appointments để cập nhật medicalRecords
  } catch (error) {
    // Log lỗi chi tiết
    if (error.response) {
      // Server trả lỗi
      console.error('API lỗi:', error.response.status, error.response.data);
      setSnackbar({
        open: true,
        severity: 'error',
        message: `Tạo bệnh án thất bại: ${JSON.stringify(error.response.data)}`,
      });
    } else if (error.request) {
      // Request đã gửi nhưng không nhận được phản hồi
      console.error('Không nhận được phản hồi từ server:', error.request);
      setSnackbar({
        open: true,
        severity: 'error',
        message: 'Không nhận được phản hồi từ server',
      });
    } else {
      // Lỗi khác
      console.error('Lỗi khi tạo medicalRecord:', error.message);
      setSnackbar({
        open: true,
        severity: 'error',
        message: `Tạo bệnh án thất bại: ${error.message}`,
      });
    }
  }
};


  return (
    
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Danh sách lịch hẹn
      </Typography>

      <Stack spacing={2} direction="row" sx={{ mb: 2 }}>
        <Button
          variant="contained"
          onClick={() => {
            setShowMyAppointments(false);
            fetchAppointments();
          }}
        >
          Xem tất cả lịch hẹn
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            setShowMyAppointments(true);
            fetchAppointments();
          }}
        >
          Xem lịch hẹn của tôi
        </Button>

        <TextField
          label="Tìm theo ID"
          value={searchId}
          onChange={(e) => handleSearch(e.target.value)}
          size="small"
        />

        <Button variant="contained" color="info" onClick={() => setOpenCreateForm(true)}>
          Tạo lịch hẹn
        </Button>
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
                <Typography>
                  Thời gian hẹn: {appt.appointmentDate ? new Date(appt.appointmentDate).toLocaleString() : '-'}
                </Typography>
                <Typography>Họ tên bệnh nhân: {appt.fullName || appt.patient?.fullname}</Typography>
                <Typography>Số điện thoại: {appt.phone || appt.patient?.phone}</Typography>
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

                  {/* Button tạo medical record (mới) */}
                  <Button
                    variant="outlined"
                    sx={{ ml: 2 }}
                    onClick={() => openCreateMedicalFor(appt)}
                  >
                    Tạo bệnh án
                  </Button>
                </Box>

                {/* MedicalRecords Accordion */}
                {appt.medicalRecords?.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1">Bệnh án:</Typography>
                    {appt.medicalRecords.map((mr) => (
                      <Accordion key={mr.id} sx={{ mt: 1 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography>
                            {mr.diagnosis} - {new Date(mr.appointment?.appointmentDate).toLocaleDateString() || '-'}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography>Triệu chứng: {mr.symptoms}</Typography>
                          {mr.notes && <Typography>Ghi chú: {mr.notes}</Typography>}
                          {mr.template && <Typography>Template: {mr.template.name}</Typography>}
                          {mr.appointment && (
                            <Typography>
                              Ngày khám: {new Date(mr.appointment.appointmentDate).toLocaleString()} - Status: {mr.appointment.status}
                            </Typography>
                          )}
                          {mr.doctor && (
                            <Typography>Bác sĩ: {mr.doctor.fullname} ({mr.doctor.email})</Typography>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Dialog tạo lịch hẹn - giữ nguyên */}
      <Dialog open={openCreateForm} onClose={() => setOpenCreateForm(false)} fullWidth maxWidth="sm">
        <DialogTitle>Tạo lịch hẹn mới</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* ... các field formData như trước ... */}
          <TextField label="Lý do khám" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} />
          <TextField label="Thời gian hẹn" type="datetime-local" value={formData.appointmentDate} onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })} InputLabelProps={{ shrink: true }} />
          <TextField label="Ghi chú" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          <TextField label="Họ tên bệnh nhân" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
          <TextField label="Số điện thoại" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          <TextField label="Người liên hệ khẩn cấp" value={formData.emergencyContact} onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })} />
          <TextField label="Bảo hiểm" value={formData.insurance} onChange={(e) => setFormData({ ...formData, insurance: e.target.value })} />
          <Typography variant="subtitle1">Câu trả lời tiền khám</Typography>
          {formData.preMedicalResponses.map((item, index) => (
            <Stack key={index} direction="row" spacing={2}>
              <TextField label="ID câu hỏi" type="number" value={item.questionId} onChange={(e) => {
                const updated = [...formData.preMedicalResponses];
                updated[index].questionId = Number(e.target.value);
                setFormData({ ...formData, preMedicalResponses: updated });
              }} />
              <TextField label="Câu trả lời" value={item.answerValue} onChange={(e) => {
                const updated = [...formData.preMedicalResponses];
                updated[index].answerValue = e.target.value;
                setFormData({ ...formData, preMedicalResponses: updated });
              }} />
              <Button color="error" onClick={() => {
                const updated = formData.preMedicalResponses.filter((_, i) => i !== index);
                setFormData({ ...formData, preMedicalResponses: updated });
              }}>Xóa</Button>
            </Stack>
          ))}
          <Button variant="outlined" onClick={() => setFormData({ ...formData, preMedicalResponses: [...formData.preMedicalResponses, { questionId: 0, answerValue: '' }] })}>Thêm câu hỏi</Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateForm(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSubmitAppointment}>Tạo</Button>
        </DialogActions>
      </Dialog>

      {/* NEW: Dialog tạo MedicalRecord */}
      <Dialog open={openMedicalDialog} onClose={() => setOpenMedicalDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Tạo bệnh án mới</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Appointment ID" value={medicalForm.appointmentId} onChange={(e) => setMedicalForm({ ...medicalForm, appointmentId: e.target.value })} disabled />
          <TextField label="Patient ID" value={medicalForm.patientId} onChange={(e) => setMedicalForm({ ...medicalForm, patientId: e.target.value })} />
          <TextField label="Doctor ID" value={medicalForm.doctorId} onChange={(e) => setMedicalForm({ ...medicalForm, doctorId: e.target.value })} />
          <TextField label="Chẩn đoán" value={medicalForm.diagnosis} onChange={(e) => setMedicalForm({ ...medicalForm, diagnosis: e.target.value })} />
          <TextField label="Triệu chứng" value={medicalForm.symptoms} onChange={(e) => setMedicalForm({ ...medicalForm, symptoms: e.target.value })} />
          <TextField label="Ghi chú" value={medicalForm.notes} onChange={(e) => setMedicalForm({ ...medicalForm, notes: e.target.value })} multiline rows={3} />
          <TextField label="Template ID" value={medicalForm.templateId} onChange={(e) => setMedicalForm({ ...medicalForm, templateId: e.target.value })} />
          {/* <TextField label="Vital values (comma-separated)" helperText='VD: "120,80,36.6" hoặc "null"' value={medicalForm.vitalValuesCSV} onChange={(e) => setMedicalForm({ ...medicalForm, vitalValuesCSV: e.target.value })} /> */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMedicalDialog(false)}>Hủy</Button>
          <Button variant="contained" onClick={handleSubmitMedicalRecord}>Tạo bệnh án</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

