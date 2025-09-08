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
import { RecordCreateButtons } from '../../medicalRecordStaff/create/Record-create-button';

// --- Render question template ---
const renderQuestion = (question, formState, handleInputChange) => {
  const questionid = question?.id || '';
  const value = formState?.[questionid] ?? '';
  const commonProps = {
    label: question?.name || 'Câu hỏi',
    fullWidth: true,
    variant: 'outlined',
  };

  switch (question?.valueType) {
    case 'number':
      return (
        <TextField
          key={questionid}
          {...commonProps}
          type="number"
          value={value}
          onChange={(e) => handleInputChange(questionid, e.target.value)}
          helperText={question?.description}
        />
      );

    case 'text':
      return (
        <TextField
          key={questionid}
          {...commonProps}
          type="text"
          value={value}
          onChange={(e) => handleInputChange(questionid, e.target.value)}
          helperText={question?.description}
        />
      );

    case 'selection':
      return (
        <FormControl key={questionid} fullWidth>
          <InputLabel id={`${questionid}-label`}>
            {question?.name}
          </InputLabel>
          <Select
            labelId={`${questionid}-label`}
            id={`${questionid}-select`}
            value={value}
            label={question?.name}
            onChange={(e) => handleInputChange(questionid, e.target.value)}
          >
            {(question?.valueOptions || []).map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
          {question?.description && (
            <FormHelperText>{question.description}</FormHelperText>
          )}
        </FormControl>
      );

    case 'multi_selection':
      return (
        <FormControl key={questionid} fullWidth>
          <InputLabel id={`${questionid}-multi-label`}>
            {question?.name}
          </InputLabel>
          <Select
            labelId={`${questionid}-multi-label`}
            id={`${questionid}-multi-select`}
            multiple
            value={Array.isArray(value) ? value : []}
            onChange={(e) => handleInputChange(questionid, e.target.value)}
            input={<OutlinedInput label={question?.name} />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {Array.isArray(selected)
                  ? selected.map((val) => <Chip key={val} label={val} />)
                  : null}
              </Box>
            )}
          >
            {(question?.valueOptions || []).map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
          {question?.description && (
            <FormHelperText>{question.description}</FormHelperText>
          )}
        </FormControl>
      );

    default:
      return (
        <TextField
          key={questionid}
          {...commonProps}
          type="text"
          value={value}
          onChange={(e) => handleInputChange(questionid, e.target.value)}
          // helperText={`Kiểu dữ liệu: ${
          //   question?.valueType || 'text'
          // }. ${question?.description || ''}`}
        />
      );
  }
};

// --- Component gộp ---
export function StaffAppointment({ vitalGroups = [], vitalIndicators = [] }) {
  // --- Appointments state ---
  const [appointments, setAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchId, setSearchId] = useState('');
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
  });

  // --- Snackbar ---
  const [snackbar, setSnackbar] = useState({ open: false, severity: 'success', message: '' });

  // --- Staff hiện tại ---
  const [currentStaff, setCurrentStaff] = useState(null);

  // --- RecordCreate state ---
  const [selectedRecordAppt, setSelectedRecordAppt] = useState(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [selectedVitalGroupId, setSelectedVitalGroupId] = useState(null);
  const [vitalValuesState, setVitalValuesState] = useState([]);
  const [isSubmittingRecord, setIsSubmittingRecord] = useState(false);
  const [recordError, setRecordError] = useState(null);
  const [allVitalGroups, setAllVitalGroups] = useState([]);
  

useEffect(() => {
  const fetchAllVitalGroups = async () => {
    try {
      const res = await axiosInstance.get('/api/v1/vitals/groups');
      setAllVitalGroups(res.data?.data || []);
    } catch (err) {
      console.error('Lỗi khi lấy toàn bộ vital groups:', err);
    }
  };
  fetchAllVitalGroups();
}, []);


  // const { questions = [], formState = {}, isLoading: isRecordLoading = false, handleInputChange = () => {}, templateName = '' } =
  //   useRecordCreateQuestion(selectedTemplateId);

  const { questions = [], formState = {}, isLoading: isRecordLoading = false, handleInputChange = () => {}, vitalGroupIds = [] } =
  useRecordCreateQuestion(selectedTemplateId);

  
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
      const response = await axiosInstance.get(endpoint);
      const data = response.data?.data || [];
      setAppointments(data);
      setAllAppointments(data);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách lịch hẹn:', error);
      setSnackbar({ open: true, severity: 'error', message: 'Lấy lịch hẹn thất bại' });
    } finally {
      setIsLoading(false);
    }
  }, [showMyAppointments]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // --- Fetch staff hiện tại ---
  useEffect(() => {
    const fetchCurrentStaff = async () => {
      try {
        const res = await axiosInstance.get('/api/v1/staffs/owner/me');
        setCurrentStaff(res.data.data);
      } catch (error) {
        console.error('Lỗi khi lấy staff hiện tại:', error);
      }
    };
    fetchCurrentStaff();
  }, []);

  // --- Handle appointment status ---
  const handleStatusChange = async (id, newStatus) => {
    try {
      await axiosInstance.patch(`/api/v1/staff/appointments/${id}/status`, { status: newStatus });
      setSnackbar({ open: true, severity: 'success', message: 'Cập nhật trạng thái thành công' });
      fetchAppointments();
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error);
      setSnackbar({ open: true, severity: 'error', message: 'Cập nhật trạng thái thất bại' });
    }
  };

  const handleSearch = (value) => {
    setSearchId(value);
    if (value === '') setAppointments(allAppointments);
    else setAppointments(allAppointments.filter((r) => r.id?.toString().includes(value)));
  };

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

  // 2️⃣ Nếu rảnh thì tạo appointment như bình thường
  const payload = {
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
    await axiosInstance.post("/api/v1/staff/appointments", payload);
    setOpenCreateForm(false);
    setSnackbar({
      open: true,
      severity: "success",
      message: "Tạo lịch hẹn thành công",
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
    });
  } catch (error) {
    console.error("Lỗi khi tạo lịch hẹn:", error.response?.data || error.message);
    setSnackbar({
      open: true,
      severity: "error",
      message: "Tạo lịch hẹn thất bại",
    });
  }
};


  // --- Open RecordCreateView ---
const openRecordDialog = async (appt) => {
  if (!appt || !currentStaff) return;

  try {
    const res = await axiosInstance.get(`/api/v1/staff/appointments/${appt.id}`);
    const freshAppt = res.data?.data;
    if (!freshAppt) throw new Error("Không lấy được appointment mới");

    setSelectedRecordAppt(freshAppt);

    const defaultTemplateId = freshAppt.medicalRecords?.[0]?.templateId || 16;
    setSelectedTemplateId(defaultTemplateId);

    const defaultVitalGroupId = freshAppt.vitalGroupIds?.[0] || null;
    setSelectedVitalGroupId(defaultVitalGroupId);

    // **Gọi hàm loadRecordToForm tại đây để populate formState và vitalValuesState**
    loadRecordToForm(freshAppt);

  } catch (err) {
    console.error('Lỗi khi mở dialog hồ sơ:', err);
    setSnackbar({ open: true, severity: 'error', message: 'Không mở được hồ sơ, thử lại' });
  }
};


  // --- Handle vitalValues ---
  const handleVitalValueChange = (vitalId, value, note) => {
    const updated = [...vitalValuesState];
    const index = updated.findIndex(v => v.vitalIndicatorId === vitalId);
    if (index >= 0) updated[index] = { vitalIndicatorId: vitalId, value: { value: Number(value) }, note };
    else updated.push({ vitalIndicatorId: vitalId, value: { value: Number(value) }, note });
    setVitalValuesState(updated);
  };

  // --- Submit Record ---
// const handleSubmitRecord = async () => {
//   if (!selectedRecordAppt || !currentStaff) return;
//   if (!selectedTemplateId) {
//     setRecordError('Chưa chọn template hồ sơ.');
//     return;
//   }

//   setIsSubmittingRecord(true);
//   setRecordError(null);

//   try {
//     // 1️⃣ Map formState thành answers
//     const answers = Object.entries(formState).map(([questionId, answerValue]) => ({
//       questionId: Number(questionId),
//       answerValue,
//     }));

//     const appointmentId =
//   selectedRecordAppt?.appointment?.id || // nếu có nested appointment
//   selectedRecordAppt?.id ||              // nếu chính nó là appointment
//   null;


//     // 2️⃣ Payload để tạo record
//     const payload = {
//       patientId: Number(selectedRecordAppt.patient?.id),
//       date: new Date().toISOString().split('T')[0],
//       diagnosis: formState.DIAGNOSIS || 'Chưa có chẩn đoán',
//       symptoms: formState.SYMPTOMS || 'chưa có triệu chứng',
//       notes: formState.NOTES || 'chưa có ghi chú',
//       answers,
//       vitalValues: [null], // backend yêu cầu khi tạo
//        appointmentId,
//     };

//     // 3️⃣ Tạo record
//     const recordRes = await axiosInstance.post('/api/staff/medical-records', payload);
//     const recordId = recordRes.data?.data?.id;
 


//     // 4️⃣ Chuẩn bị vitalValues giống handleSaveChanges
//     const vitalPayload = Object.entries(formState)
//       .filter(([questionId, value]) => value !== '' && value !== null && value !== undefined)
//       .map(([questionId, value]) => {
//         const idAsNumber = Number(questionId);
//         // const originalIndicator = vitalQuestions.find(q => q.id === idAsNumber);
//         let finalValue = value;

//         // if (originalIndicator?.valueType === 'number' && !isNaN(value)) {
//         //   finalValue = parseFloat(value);
//         // }

//         return {
//           vitalIndicatorId: idAsNumber,
//           // value: { value: finalValue },
//            value: { value }, // giữ nguyên, không parse
//           note: ''
//         };
//       });

//     // 5️⃣ Patch vitalValues qua API chung
//     if (vitalPayload.length > 0) {
//       await updateVitalMedicalRecordeById(recordId, { vitalValues: vitalPayload });
//       console.log('Updated vitalValues:', vitalPayload);
//     }

//     setSelectedRecordAppt(null);
//     fetchAppointments();
//     setSnackbar({ open: true, severity: 'success', message: 'Tạo hồ sơ thành công' });

//   } catch (err) {
//     console.error('Submit record error:', err.response?.data || err.message);
//     setRecordError('Tạo hồ sơ thất bại. Kiểm tra console để biết chi tiết.');
//     setSnackbar({ open: true, severity: 'error', message: 'Tạo hồ sơ thất bại' });
//   } finally {
//     setIsSubmittingRecord(false);
//   }
// };


// --- Load form dữ liệu từ medicalRecord ---
const loadRecordToForm = (appointment) => {
  if (!appointment) return;
  const record = appointment.medicalRecords?.[0];

  if (record) {
    // Map các câu hỏi từ record.answers
    record.answers?.forEach(ans => {
      handleInputChange(ans.questionId, ans.answerValue);
    });

    // Map diagnosis, symptoms, notes
    handleInputChange('DIAGNOSIS', record.diagnosis || '');
    handleInputChange('SYMPTOMS', record.symptoms || '');
    handleInputChange('NOTES', record.notes || '');

    // Vital values
    setVitalValuesState(record.vitalValues?.map(v => ({
      vitalIndicatorId: v.vitalIndicatorId,
      value: v.value,
      note: v.note || ''
    })) || []);
  } else {
    setVitalValuesState([]);
  }
};


// --- Submit / Update record ---
const handleSubmitRecord = async () => {
  if (!selectedRecordAppt || !currentStaff) return;

  setIsSubmittingRecord(true);
  setRecordError(null);

  try {
    // 1️⃣ Lấy record hiện có
    const record = selectedRecordAppt.medicalRecords?.[0];
    if (!record) {
      setRecordError("Không tìm thấy medical record cho lịch hẹn này");
      setIsSubmittingRecord(false);
      return;
    }
    const recordId = record.id;

    // 2️⃣ Chuẩn bị answers
    const answers = Object.entries(formState).map(([questionId, answerValue]) => ({
      questionId: Number(questionId),
      answerValue
    }));

    // 3️⃣ Chuẩn bị vitalValues
    const vitalPayload = Object.entries(formState)
      .filter(([questionId, value]) => value !== '' && value !== null && value !== undefined)
      .map(([questionId, value]) => ({
        vitalIndicatorId: Number(questionId),
        value: { value: value }, // parse số nếu backend yêu cầu number
        note: ''
      }));

    // 4️⃣ Payload PATCH
    const updatePayload = {
      diagnosis: formState.DIAGNOSIS || record.diagnosis,
      symptoms: formState.SYMPTOMS || record.symptoms,
      notes: formState.NOTES || record.notes,
      vitalValues: vitalPayload
    };
console.log('Payload PATCH đang gửi đi:', updatePayload); // <-- thêm dòng này
    // 5️⃣ Gọi API PATCH
    await axiosInstance.patch(`/api/staff/medical-records/${recordId}`, updatePayload);

    // 6️⃣ Reset / thông báo
    setSelectedRecordAppt(null);
    fetchAppointments();
    setSnackbar({ open: true, severity: 'success', message: 'Cập nhật hồ sơ thành công' });

  } catch (err) {
    console.error('Update record error:', err.response?.data || err.message);
    setRecordError('Cập nhật hồ sơ thất bại. Kiểm tra console để biết chi tiết.');
    setSnackbar({ open: true, severity: 'error', message: 'Cập nhật hồ sơ thất bại' });
  } finally {
    setIsSubmittingRecord(false);
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

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>Danh sách lịch hẹn</Typography>
      <Stack spacing={2} direction="row" sx={{ mb: 2 }}>
        <Button variant="contained" onClick={() => { setShowMyAppointments(false); fetchAppointments(); }}>Xem tất cả</Button>
        <Button variant="outlined" onClick={() => { setShowMyAppointments(true); fetchAppointments(); }}>Xem của tôi</Button>
        <TextField label="Tìm theo ID" value={searchId} onChange={(e) => handleSearch(e.target.value)} size="small" />
        <Button variant="contained" color="info" onClick={() => setOpenCreateForm(true)}>Tạo lịch hẹn</Button>
      </Stack>

              {isLoading ? <CircularProgress /> :
          appointments.length === 0 ? (
            <Typography>Không có lịch hẹn nào.</Typography>
                    ) : (
                      <Stack spacing={2}>
                        {appointments.map((appt) => (
                          <Card key={appt.id}>
                            <CardContent>
                              <Stack spacing={1}>
                    <Typography>Lý do: {appt.reason}</Typography>

                    <Typography>
                      Thời gian:{' '}
                      {appt.appointmentDate
                        ? new Date(appt.appointmentDate).toLocaleString('vi-VN')
                        : 'Chưa có'}
                    </Typography>

                    <Typography>
                      Bệnh nhân: {appt.fullName || appt.patient?.fullname}
                    </Typography>

                    <Typography>
                      SĐT: {appt.phone || appt.patient?.phone}
                    </Typography>

                    <Typography>Trạng thái: {appt.status}</Typography>

                    {appt.notes && <Typography>Ghi chú: {appt.notes}</Typography>}

                    {appt.customInfo?.emergencyContact && (
                      <Typography>Liên hệ khẩn cấp: {appt.customInfo.emergencyContact}</Typography>
                    )}
                  </Stack>


                      {/* <Select
                        value={appt.status}
                        onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                        size="small"
                      >
                        <MenuItem value="PENDING">Chờ xác nhận</MenuItem>
                        <MenuItem value="CONFIRMED">Đã xác nhận</MenuItem>
                        <MenuItem value="CANCELLED">Đã hủy</MenuItem>
                        <MenuItem value="COMPLETED">Đã hoàn thành</MenuItem>
                      </Select> */}

                  <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => fetchAppointment(appt.id)}
                >
                  Xem chi tiết
                </Button>


                {isEditingAppointment && appointmentForm && (
  <Dialog open={isEditingAppointment} onClose={() => setIsEditingAppointment(false)}>
    <DialogTitle>Sửa lịch hẹn</DialogTitle>
    <DialogContent>
      <TextField
        label="Lý do"
        value={appointmentForm.reason}
        onChange={(e) => setAppointmentForm(prev => ({ ...prev, reason: e.target.value }))}
        fullWidth
        margin="normal"
      />

      <TextField
        label="Ngày giờ"
        type="datetime-local"
        value={appointmentForm.appointmentDate?.slice(0,16) || ''}
        onChange={(e) => setAppointmentForm(prev => ({ ...prev, appointmentDate: e.target.value }))}
        fullWidth
        margin="normal"
      />

      <TextField
        label="Trạng thái"
        value={appointmentForm.status}
        onChange={(e) => setAppointmentForm(prev => ({ ...prev, status: e.target.value }))}
        fullWidth
        margin="normal"
        disabled={true}
      />

      <TextField
        label="Ghi chú"
        value={appointmentForm.notes}
        onChange={(e) => setAppointmentForm(prev => ({ ...prev, notes: e.target.value }))}
        fullWidth
        margin="normal"
      />

      <TextField
        label="Họ tên"
        value={appointmentForm.fullName}
        onChange={(e) => setAppointmentForm(prev => ({ ...prev, fullName: e.target.value }))}
        fullWidth
        margin="normal"
      />

      <TextField
        label="Số điện thoại"
        value={appointmentForm.phone}
        onChange={(e) => setAppointmentForm(prev => ({ ...prev, phone: e.target.value }))}
        fullWidth
        margin="normal"
      />

      <TextField
        label="Liên hệ khẩn cấp"
        value={appointmentForm.customInfo?.emergencyContact || ''}
        onChange={(e) => setAppointmentForm(prev => ({
          ...prev,
          customInfo: { ...prev.customInfo, emergencyContact: e.target.value }
        }))}
        fullWidth
        margin="normal"
      />
    </DialogContent>

    <DialogActions>
      <Button onClick={() => setIsEditingAppointment(false)}>Hủy</Button>
      <Button
        onClick={handleUpdateAppointment}
        disabled={isSubmittingAppointment}
        variant="contained"
        color="primary"
      >
        Lưu
      </Button>
    </DialogActions>
  </Dialog>
)}




                     <Button
                      sx={{ ml: 2 }}
                      variant="outlined"
                      onClick={() => openRecordDialog(appt)}
                    >
                      {appt.medicalRecords?.[0] ? 'Cập nhật hồ sơ' : 'Tạo bệnh án'}
                    </Button>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )
}


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
<Dialog fullWidth maxWidth="md" open={!!selectedRecordAppt} onClose={() => setSelectedRecordAppt(null)}>
  <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    {`Tạo hồ sơ cho: ${selectedRecordAppt?.fullName || selectedRecordAppt?.patient?.fullname || ''}`}
    <IconButton onClick={() => setSelectedRecordAppt(null)}><CloseIcon /></IconButton>
  </DialogTitle>

  <DialogContent dividers>
    <RecordCreateButtons onTemplateSelect={(id) => {
    setSelectedTemplateId(id);
    console.log('Người dùng chọn template:', id);
  }} />
    {isRecordLoading && <CircularProgress />}
    {recordError && <Alert severity="error">{recordError}</Alert>}

    {!isRecordLoading && questions.length > 0 && (
      <Stack spacing={3} sx={{ mt: 2 }}>
        {/* Render câu hỏi */}
    {questions.map(q => renderQuestion(q, formState, handleInputChange))}
        

        {/* Giá trị sinh tồn */}
        {selectedVitalGroupId && vitalValuesState.length > 0 && (
          <Box>
            <Typography variant="subtitle1" sx={{ mt: 2 }}>Giá trị sinh tồn</Typography>
            {vitalValuesState.map((v) => {
              const indicator = vitalIndicators.find(ind => ind.id === v.vitalIndicatorId);
              return (
                <Stack key={v.vitalIndicatorId} direction="row" spacing={2} sx={{ mt: 1 }}>
                  <TextField
                    label={indicator?.name || 'Vital'}
                    type="number"
                    value={v.value.value}
                    onChange={(e) => handleVitalValueChange(v.vitalIndicatorId, e.target.value, v.note)}
                  />
                  <TextField
                    label="Ghi chú"
                    value={v.note}
                    onChange={(e) => handleVitalValueChange(v.vitalIndicatorId, v.value.value, e.target.value)}
                  />
                </Stack>
              );
            })}
          </Box>
        )}

        {/* Nút tạo hồ sơ */}
        {/* <Button
          variant="contained"
          size="large"
          onClick={handleSubmitRecord}
          // disabled={isSubmittingRecord || !selectedTemplateId || !selectedVitalGroupId}
        >
          {isSubmittingRecord ? 'Đang tạo...' : 'Tạo hồ sơ'}
        </Button> */}
        <Button
  variant="contained"
  size="large"
  onClick={handleSubmitRecord}
>
  {isSubmittingRecord
    ? 'Đang tạo...'
    : selectedRecordAppt?.medicalRecords?.[0]
      ? 'Cập nhật hồ sơ'
      : 'Tạo hồ sơ'}
</Button>

      </Stack>
    )}

    {!isRecordLoading && questions.length === 0 && (
      <Typography color="text.secondary" sx={{ py: 5, textAlign: 'center' }}>
        Chưa chọn template hoặc không có câu hỏi nào.
      </Typography>
    )}
  </DialogContent>
</Dialog>


      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}