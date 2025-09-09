'use client';

import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import {
  Box,
  Stack,
  Typography,
  Card,
  CardContent,
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
  IconButton,
  OutlinedInput,
  Chip,
  Snackbar,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axiosInstance from 'src/lib/axios';

// --- Custom hooks/components cho RecordCreate ---
import { updateVitalMedicalRecordeById } from 'src/api/medical-record-staff';
import { useRecordCreateQuestion } from '../../medicalRecordStaff/create/Record-create-question';
import {MedicalRecordFormLoader} from './hooks/UpdateMedicalRecord.jsx';
import {deleteAppointmentIDs } from 'src/api/appointments-staff.js';
// --- Component gộp ---
export function StaffAppointment({ vitalGroups = [], vitalIndicators = [] }) {
  // --- Appointments state ---
  const [appointments, setAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showMyAppointments, setShowMyAppointments] = useState(false);


  // --- Create appointment dialog ---
  const [openCreateForm, setOpenCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    reason: '',
    appointmentDate: '',
    status: 'PENDING',
    notes: '',
    fullName: '',
    phone: '',
    emergencyContact: '',
    insurance: '',
    preMedicalResponses: [{ questionId: 0, answerValue: '' }],
    medicalRecordType: "",
  });

  // --- Snackbar ---
  const [snackbar, setSnackbar] = useState({ open: false, severity: 'success', message: '' });

  // --- Staff hiện tại ---
  const [currentStaff, setCurrentStaff] = useState(null);


  // --- RecordCreate state ---
  const [selectedRecordAppt, setSelectedRecordAppt] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [selectedVitalGroupId, setSelectedVitalGroupId] = useState(null);

  


const { questions = [], formState = {}, isLoading: isRecordLoading = false, handleInputChange = () => {}, vitalGroupIds = [] } =
  useRecordCreateQuestion(selectedTemplateId);

const [modalOpen, setModalOpen] = useState(false);
const [selectedMedicalRecordId, setSelectedMedicalRecordId] = useState(null);
const [filters, setFilters] = useState({
  page: 1,
  limit: 10,
  reason: '',
  status: '',
  appointmentDateFrom: '',
  appointmentDateTo: '',
  orderBy: 'appointmentDate',
  orderDirection: 'ASC',
});

  
useEffect(() => {
  if (vitalGroupIds.length && !vitalGroupIds.includes(selectedVitalGroupId)) {
    setSelectedVitalGroupId(vitalGroupIds[0]); // tự chọn nhóm hợp lệ đầu tiên
  }
}, [vitalGroupIds, selectedVitalGroupId]);



  // --- Fetch appointments ---
const fetchAppointments = useCallback(async () => {
  setIsLoading(true);
  try {
    const endpoint = showMyAppointments
      ? '/api/v1/staff/appointments/my-appointments'
      : '/api/v1/staff/appointments';

   const params = {
        page: filters.page || 1,
        limit: filters.limit || 10,
        reason: filters.reason || undefined,
        status: filters.status || undefined,
        appointmentDateFrom: filters.appointmentDateFrom
          ? new Date(filters.appointmentDateFrom + "T00:00:00Z").toISOString()
          : undefined,
        appointmentDateTo: filters.appointmentDateTo
          ? new Date(filters.appointmentDateTo + "T23:59:59Z").toISOString()
          : undefined,
        orderBy: filters.orderBy || "appointmentDate",
        orderDirection: filters.orderDirection || "ASC",
      };

      // bỏ param trống
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== "")
      );

    console.log("➡️ Gửi query params:", cleanParams);

    const response = await axiosInstance.get(endpoint, { params: cleanParams });
    const data = response.data?.data || [];
    setAppointments(data);
    setAllAppointments(data);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách lịch hẹn:', error);
    setSnackbar({ open: true, severity: 'error', message: 'Lấy lịch hẹn thất bại' });
  } finally {
    setIsLoading(false);
  }
}, [showMyAppointments, filters]);


 

const handleSubmitAppointment = async () => {
  if (!currentStaff) return;

  // 1️⃣ Kiểm tra availability
  const isAvailable = await checkDoctorAvailability(
    currentStaff.id,
    new Date(formData.appointmentDate).toISOString()
  );
  console.log('Doctor availability:', isAvailable);
  if (!isAvailable) {
    setSnackbar({
      open: true,
      severity: 'warning',
      message: 'Bác sĩ không rảnh vào thời gian này, vui lòng chọn thời gian khác',
    });
    return;
  }

  // 2️⃣ Tạo appointment
  const appointmentPayload = {
    patientId: Number(formData.patientId),
    doctorId: currentStaff.id,
    reason: formData.reason,
    appointmentDate: new Date(formData.appointmentDate).toISOString(),
    status: "CONFIRMED",
    notes: formData.notes,
    fullName: formData.fullName,
    phone: formData.phone,
    customInfo: {
      emergencyContact: formData.emergencyContact,
      insurance: formData.insurance,
    },
    preMedicalResponses: formData.preMedicalResponses?.length ? formData.preMedicalResponses : [],
  };

  try {
    const res = await axiosInstance.post("/api/v1/staff/appointments", appointmentPayload);
    console.log("Tạo lịch hẹn response:", res.data);

    const appointmentId = res.data?.data?.id; // Lấy ID của lịch vừa tạo
    if (appointmentId) {
      // 3️⃣ Tạo medical record mới với appointmentId
     let templateId;

        switch (formData.medicalRecordType) {
          case "cap_tinh":
            templateId = 16;
            break;
          case "man_tinh_lan_1":
            templateId = 17;
            break;
          case "man_tinh_tai_kham":
            templateId = 18;
            break;
          default:
            templateId = null; // hoặc giá trị mặc định nếu cần
        }

        const medicalRecordPayload = {
          patientId: Number(formData.patientId),
          doctorId: currentStaff.id,
          diagnosis: formData.diagnosis || "Chưa có chẩn đoán",
          symptoms: formData.symptoms || "Chưa có triệu chứng",
          notes: formData.notes || "Chưa có ghi chú",
          appointmentId: appointmentId,
          vitalValues: [null],
          templateId: templateId,
        };

      const medicalRes = await axiosInstance.post(
        "https://hospital.huyit.lat/api/staff/medical-records",
        medicalRecordPayload
      );
      console.log("Tạo bệnh án mới response:", medicalRes.data);
    }

    // 4️⃣ Đóng form & reset
    setOpenCreateForm(false);
    setSnackbar({
      open: true,
      severity: "success",
      message: "Tạo lịch hẹn và bệnh án thành công",
    });
    fetchAppointments();
    setFormData({
      patientId: "",
      doctorId: "",
      reason: "",
      appointmentDate: "",
      notes: "",
      fullName: "",
      phone: "",
      emergencyContact: "",
      insurance: "",
      preMedicalResponses: [],
      diagnosis: "",
      symptoms: "",
       medicalRecordType: "", // 👈 thêm lại
    });
  } catch (error) {
    console.error("Lỗi khi tạo lịch hẹn hoặc bệnh án:", error.response?.data || error.message);
    setSnackbar({
      open: true,
      severity: "error",
      message: "Tạo lịch hẹn hoặc bệnh án thất bại",
    });
  }
};



const checkDoctorAvailability = async (doctorId, appointmentDate) => {
  try {
    const res = await axiosInstance.get('/api/v1/staff/appointments/check-availability', {
      params: { doctorId, appointmentDate },
    });
    return res.data?.available ?? false;
  } catch (err) {
    console.error('Lỗi khi kiểm tra availability:', err);
    return false;
  }
};


useEffect(() => {
  const fetchStaff = async () => {
    try {
      const res = await axiosInstance.get("/api/v1/staffs/owner/me");
      setCurrentStaff(res.data?.data);
      console.log("Current staff:", res.data?.data);
    } catch (err) {
      console.error("Không load được staff hiện tại:", err);
    }
  };
  fetchStaff();
}, []);
useEffect(() => {
  fetchAppointments();
}, [fetchAppointments]);

  // --- Init vitalValues khi chọn group ---
  useEffect(() => {
    if (selectedVitalGroupId && selectedRecordAppt?.vitalIndicators?.length > 0) {
      const initial = selectedRecordAppt.vitalIndicators.map(ind => ({ vitalIndicatorId: ind.id, value: { value: 0 }, note: '' }));
      setVitalValuesState(initial);
    }
  }, [selectedVitalGroupId, selectedRecordAppt]);
//========================================================================================
// Dialog & form state
const [appointmentForm, setAppointmentForm] = useState(null);
const [isEditingAppointment, setIsEditingAppointment] = useState(false);
const [isSubmittingAppointment, setIsSubmittingAppointment] = useState(false);

// Dữ liệu appointment đang edit
const [editingAppointment, setEditingAppointment] = useState(null);


const fetchAppointment = async (appointmentId) => {
  try {
    const res = await axiosInstance.get(`/api/v1/staff/appointments/${appointmentId}`);
    const data = res.data.data; // chú ý: data nằm trong res.data.data

    // set state cho form
    setAppointmentForm({
      reason: data.reason || '',
      appointmentDate: data.appointmentDate || '',
      status: data.status || 'PENDING',
      notes: data.notes || '',
      fullName: data.fullName || data.patient?.fullname || '',
      phone: data.phone || data.patient?.phone || '',
      customInfo: data.customInfo || {},
      medicalRecords: data.medicalRecords || [],
    });

    setEditingAppointment(data);
    setIsEditingAppointment(true); // mở dialog sau khi set xong dữ liệu
  } catch (err) {
    console.error('Error fetching appointment:', err);
    setSnackbar({ open: true, severity: 'error', message: 'Không tải được dữ liệu lịch hẹn.' });
  }
};

const handleUpdateAppointment = async () => {
  if (!appointmentForm || !editingAppointment) return;
  setIsSubmittingAppointment(true);

  const payload = {
    reason: appointmentForm.reason || '',
    appointmentDate: appointmentForm.appointmentDate
      ? new Date(appointmentForm.appointmentDate).toISOString()
      : null,
    status: appointmentForm.status || 'PENDING',
    notes: appointmentForm.notes || '',
    fullName: appointmentForm.fullName || '',
    phone: appointmentForm.phone || '',
    customInfo: appointmentForm.customInfo || {},
  };

  try {
    const res = await axiosInstance.patch(`/api/v1/staff/appointments/${editingAppointment.id}`, payload);
    console.log('Update response:', res.data);

    setSnackbar({ open: true, severity: 'success', message: 'Cập nhật lịch hẹn thành công!' });
    setIsEditingAppointment(false);
    fetchAppointments(); // refresh danh sách
  } catch (err) {
    console.error('Error updating appointment:', err.response?.data || err.message, 'Payload:', payload);
    setSnackbar({ open: true, severity: 'error', message: 'Cập nhật lịch hẹn thất bại!' });
  } finally {
    setIsSubmittingAppointment(false);
  }
};
//========================================================================================


// --- State ---
const [searchAppointmentId, setSearchAppointmentId] = useState('');
const [foundAppointment, setFoundAppointment] = useState(null);
const [isSearchingAppointment, setIsSearchingAppointment] = useState(false);

// --- Function tìm appointment ---
const fetchAppointmentById = async (id) => {
  if (!id) {
    setFoundAppointment(null);
    return;
  }
  setIsSearchingAppointment(true);
  try {
    const res = await axiosInstance.get(`/api/v1/staff/appointments/${id}`);
    const appt = res.data?.data;
    if (!appt) {
      setSnackbar({ open: true, severity: 'warning', message: 'Không tìm thấy lịch hẹn' });
      setFoundAppointment(null);
    } else {
      setFoundAppointment(appt);
      setSnackbar({ open: true, severity: 'success', message: 'Đã tìm thấy lịch hẹn' });
    }
    console.log('Appointment tìm thấy:', appt);
  } catch (err) {
    console.error('Lỗi khi tìm appointment:', err.response?.data || err.message);
    setSnackbar({ open: true, severity: 'error', message: 'Tìm thất bại' });
    setFoundAppointment(null);
  } finally {
    setIsSearchingAppointment(false);
  }
};

const statusMap = {
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy"
};

//========================================================================================
const displayedAppointments = searchAppointmentId
  ? foundAppointment ? [foundAppointment] : []
  : appointments;

  return (
    <Box sx={{ p: 4 }}>
<Typography variant="h4" gutterBottom>Danh sách lịch hẹn</Typography>

{/* Bộ lọc */}
<Box display="flex" gap={2} mb={2} flexWrap="wrap">
  <TextField
    label="Lý do"
    size="small"
    value={filters.reason}
    onChange={(e) => setFilters({ ...filters, reason: e.target.value })}
  />

  <FormControl size="small">
    <Select
      value={filters.status}
      displayEmpty
      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
    >
      <MenuItem value="">Tất cả</MenuItem>
      <MenuItem value="PENDING">Chờ xử lý</MenuItem>
      <MenuItem value="CONFIRMED">Đã xác nhận</MenuItem>
      <MenuItem value="CANCELLED">Đã hủy bỏ</MenuItem>
      <MenuItem value="COMPLETED">Đã hoàn thành</MenuItem>
    </Select>
  </FormControl>

  <TextField
    type="date"
    label="Từ ngày"
    size="small"
    InputLabelProps={{ shrink: true }}
    value={filters.appointmentDateFrom}
    onChange={(e) => setFilters({ ...filters, appointmentDateFrom: e.target.value })}
  />

  <TextField
    type="date"
    label="Đến ngày"
    size="small"
    InputLabelProps={{ shrink: true }}
    value={filters.appointmentDateTo}
    onChange={(e) => setFilters({ ...filters, appointmentDateTo: e.target.value })}
  />

  <FormControl size="small">
    <Select
      value={filters.orderDirection}
      onChange={(e) => setFilters({ ...filters, orderDirection: e.target.value })}
    >
      <MenuItem value="ASC">Thứ tự tăng</MenuItem>
      <MenuItem value="DESC">Thứ tự giảm</MenuItem>
    </Select>
  </FormControl>

  <Button variant="contained" onClick={fetchAppointments}>
    Tìm kiếm
  </Button>
</Box>

{/* Toolbar */}
<Stack spacing={2} direction="row" sx={{ mb: 2 }}>
  <Button variant="contained" onClick={() => { setShowMyAppointments(false); fetchAppointments(); }}>
    Xem tất cả
  </Button>
  <Button variant="outlined" onClick={() => { setShowMyAppointments(true); fetchAppointments(); }}>
    Xem của tôi
  </Button>

  <TextField
    label="Tìm theo ID"
    size="small"
    value={searchAppointmentId}
    onChange={(e) => {
      const val = e.target.value;
      setSearchAppointmentId(val);
      fetchAppointmentById(val); // gọi API tìm theo ID
    }}
  />

  <Button variant="contained" color="info" onClick={() => setOpenCreateForm(true)}>
    Tạo lịch hẹn
  </Button>
</Stack>


{isLoading || isSearchingAppointment ? (
  <CircularProgress />
) : displayedAppointments.length === 0 ? (
  <Typography>
    {searchAppointmentId ? 'Không tìm thấy lịch hẹn' : 'Không có lịch hẹn nào.'}
  </Typography>
) : (
  <Stack spacing={2}>
    {displayedAppointments.map((appt) => (
      <Card key={appt.id}>
        <CardContent>
          <Stack spacing={1}>
            <Typography>Lý do: {appt.reason}</Typography>
            <Typography>
              Thời gian: {appt.appointmentDate ? new Date(appt.appointmentDate).toLocaleString('vi-VN') : 'Chưa có'}
            </Typography>
            <Typography>Bệnh nhân: {appt.fullName || appt.patient?.fullname}</Typography>
            <Typography>SĐT: {appt.phone || appt.patient?.phone}</Typography>
            <Typography>  Trạng thái: {statusMap[appt.status] || appt.status}</Typography>
            {appt.notes && <Typography>Ghi chú: {appt.notes}</Typography>}
            {appt.customInfo?.emergencyContact && (
              <Typography>Liên hệ khẩn cấp: {appt.customInfo.emergencyContact}</Typography>
            )}
          </Stack>

          <Button
          variant="outlined"
          color="primary"
          onClick={() => {
            const record = appt.medicalRecords?.[0];

            if (!record) {
              console.warn('Appointment này chưa có medical record!'); 
              return; // không mở modal nếu không có medicalRecord
            }

            setSelectedMedicalRecordId(record.id); // luôn tồn tại
            setSelectedTemplateId(appt.templateId ?? 16); // template mặc định nếu null
            setSelectedRecordAppt(appt); // lưu appointment
            setModalOpen(true);
          }}
        >
          Cập nhật bệnh án
          </Button>
          <Button
        variant="outlined"
        color="default"
          style={{ marginLeft: '8px' }}
        onClick={() => fetchAppointment(appt.id)}
        sx={{ mt: 1 }}
      >
        Xem chi tiết
          </Button>

            <Button
          variant="outlined"
          color="error"
          style={{ marginLeft: '8px' }}
          onClick={async () => {
            if (window.confirm("Bạn có chắc muốn xóa lịch hẹn này không?")) {
              try {
                await deleteAppointmentIDs(appt.id);
                setSnackbar({ open: true, severity: "success", message: "Xóa thành công!" });

                // ✅ Load lại danh sách
                fetchAppointments();
              } catch (err) {
                console.error("Lỗi xóa:", err);
                setSnackbar({ open: true, severity: "error", message: "Xóa thất bại!" });
              }
            }
          }}
          sx={{ mt: 1 }}
        >
          Xóa lịch hẹn
            </Button>
</CardContent>
      </Card>
    ))}
  </Stack>
)}

      {/* Dialog tạo lịch hẹn */}
<Dialog
  open={openCreateForm}
  onClose={() => setOpenCreateForm(false)}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle>Tạo lịch hẹn mới</DialogTitle>
  <DialogContent>
    <Stack spacing={2}>
      {/* Chọn mẫu bệnh án */}
      <FormControl fullWidth>
        <InputLabel id="medical-record-label">Chọn mẫu bệnh án</InputLabel>
       <Select
        labelId="medical-record-label"
        value={formData.medicalRecordType}
        label="Chọn mẫu bệnh án"
        onChange={(e) =>
          setFormData({ ...formData, medicalRecordType: e.target.value })
        }
      >
        <MenuItem value="cap_tinh">Bệnh án cấp tính</MenuItem>
        <MenuItem value="man_tinh_lan_1">Bệnh án mạn tính lần 1</MenuItem>
        <MenuItem value="man_tinh_tai_kham">Bệnh án mạn tính tái khám</MenuItem>
      </Select>

      </FormControl>

      {/* chọn bệnh nhân */}
      <TextField
        label="Patient ID"
        fullWidth
        type="number"
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
        label="SĐT"
        fullWidth
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
      />
      <TextField
        label="Lý do"
        fullWidth
        value={formData.reason}
        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
      />
      <TextField
        label="Ngày hẹn"
        type="datetime-local"
        fullWidth
        value={formData.appointmentDate}
        onChange={(e) =>
          setFormData({ ...formData, appointmentDate: e.target.value })
        }
        InputLabelProps={{ shrink: true }}
      />
    </Stack>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenCreateForm(false)}>Hủy</Button>
    <Button variant="contained" onClick={handleSubmitAppointment}>
      Tạo
    </Button>
  </DialogActions>
</Dialog>


      {/* Dialog cập nhật bệnh án */}

<MedicalRecordFormLoader
   templateId={selectedTemplateId}
   medicalRecordId={selectedMedicalRecordId}
   appointment={selectedRecordAppt} // <- dùng state đã lưu khi click
   setSnackbar={setSnackbar}
   open={modalOpen}
   onClose={() => setModalOpen(false)}
    currentStaff={currentStaff}
/>

<Dialog
  open={isEditingAppointment}
  onClose={() => setIsEditingAppointment(false)}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle>Chi tiết</DialogTitle>
  <DialogContent>
    {appointmentForm && (
      <Stack spacing={2} sx={{ mt: 1 }}>
        <TextField
          label="Họ tên"
          fullWidth
          value={appointmentForm.fullName}
          onChange={(e) =>
            setAppointmentForm({ ...appointmentForm, fullName: e.target.value })
          }
        />
        <TextField
          label="SĐT"
          fullWidth
          value={appointmentForm.phone}
          onChange={(e) =>
            setAppointmentForm({ ...appointmentForm, phone: e.target.value })
          }
        />
        <TextField
          label="Lý do"
          fullWidth
          value={appointmentForm.reason}
          onChange={(e) =>
            setAppointmentForm({ ...appointmentForm, reason: e.target.value })
          }
        />
        <TextField
          label="Ngày hẹn"
          type="datetime-local"
          fullWidth
          value={appointmentForm.appointmentDate}
          onChange={(e) =>
            setAppointmentForm({ ...appointmentForm, appointmentDate: e.target.value })
          }
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Ghi chú"
          fullWidth
          value={appointmentForm.notes}
          onChange={(e) =>
            setAppointmentForm({ ...appointmentForm, notes: e.target.value })
          }
        />
      </Stack>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setIsEditingAppointment(false)}>Hủy</Button>
    <Button
      variant="contained"
      onClick={handleUpdateAppointment}
      disabled={isSubmittingAppointment}
    >
      {isSubmittingAppointment ? 'Đang cập nhật...' : 'Cập nhật'}
    </Button>
  </DialogActions>
</Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}