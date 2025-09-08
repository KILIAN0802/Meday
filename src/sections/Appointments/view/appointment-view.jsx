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
const [formValues, setFormValues] = useState({});

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



  // const { questions = [], formState = {}, isLoading: isRecordLoading = false, handleInputChange = () => {}, vitalGroupIds = [] } =
  // useRecordCreateQuestion(selectedTemplateId);
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
      const medicalRecordPayload = {
        patientId: Number(formData.patientId),
        doctorId: currentStaff.id,
        diagnosis: formData.diagnosis || "Chưa có chẩn đoán",
        symptoms: formData.symptoms || "Chưa có triệu chứng",
        notes: formData.notes || "Chưa có ghi chú",
        appointmentId: appointmentId,
        vitalValues: [null],
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


  // --- Open RecordCreateView ---
const openRecordDialog = async (appt) => {
  if (!appt || !currentStaff) return;

  try {
    const res = await axiosInstance.get(`/api/v1/staff/appointments/${appt.id}`);
    const freshAppt = res.data?.data;
    setSelectedRecordAppt(freshAppt);

    const defaultTemplateId = freshAppt.medicalRecords?.[0]?.templateId || 16;
    setSelectedTemplateId(defaultTemplateId);

    // Lấy vital values từ API mới
    if (freshAppt.medicalRecords?.[0]?.id) {
      await fetchVitalValues(freshAppt.medicalRecords[0].id);
    }

    // Populate formState
    loadRecordToForm(freshAppt);

  } catch (err) {
    console.error('Lỗi khi mở dialog hồ sơ:', err);
    setSnackbar({ open: true, severity: 'error', message: 'Không mở được hồ sơ, thử lại' });
  }
};


  // --- Handle vitalValues ---
  const handleVitalValueChange = (vitalId, newValue, note) => {
  setVitalValuesState(prev =>
    prev.map(v =>
      v.vitalIndicatorId === vitalId
        ? { ...v, value: { value: newValue }, note: note ?? v.note }
        : v
    )
  );
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
        value: { value: v.value }, // ép thành object
      note: v.note || ''
    })) || []);
  } else {
    setVitalValuesState([]);
  }
};


// --- Submit / Update record ---
// --- Submit / Update record ---
const handleSubmitRecord = async () => {
  if (!selectedRecordAppt || !currentStaff) return;

  setIsSubmittingRecord(true);
  setRecordError(null);

  try {
    // 1️⃣ Lấy record hiện có (ưu tiên templateId đã chọn nếu có)
    const record =
      selectedRecordAppt.medicalRecords?.find(r => r.templateId === selectedTemplateId) ||
      selectedRecordAppt.medicalRecords?.[0];

    if (!record) {
      setRecordError("Không tìm thấy medical record cho lịch hẹn này");
      setIsSubmittingRecord(false);
      return;
    }

    const recordId = record.id;

    // 2️⃣ Chuẩn bị answers từ formState
    const answers = Object.entries(formState).map(([questionId, answerValue]) => ({
      questionId: Number(questionId),
      answerValue
    }));

    console.log('Answers chuẩn bị gửi:', answers);

    // 3️⃣ Chuẩn bị vitalValues từ vitalValuesState
    const vitalPayload = vitalValuesState.map(v => ({
      vitalIndicatorId: Number(v.vitalIndicatorId),
      value: { value: v.value.value }, // giữ nguyên, backend có thể parse number
      note: v.note || ''
    }));

    console.log('VitalValues chuẩn bị gửi:', vitalPayload);

    // 4️⃣ Payload PATCH
    const updatePayload = {
      diagnosis: formState.DIAGNOSIS || record.diagnosis,
      symptoms: formState.SYMPTOMS || record.symptoms,
      notes: formState.NOTES || record.notes,

      vitalValues: vitalPayload
    };

    console.log('Payload PATCH đang gửi đi:', updatePayload);

    // 5️⃣ Gọi API PATCH
    const res = await axiosInstance.patch(`/api/staff/medical-records/${recordId}`, updatePayload);
    console.log('Response PATCH:', res.data);

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




//========================================================================================

const fetchVitalValues = async (recordId) => {
  try {
    const res = await axiosInstance.get(`/api/staff/medical-records/${recordId}/vital-values`);
    const data = res.data?.data || [];
    console.log('Vital Values raw:', data);

    // Convert về format FE mong muốn
    const formatted = data.map(v => ({
      vitalIndicatorId: v.vitalIndicatorId,
      value: { value: v.value }, // FE cần object { value: … }
      note: v.note || ''
    }));

    setVitalValuesState(formatted);
  } catch (err) {
    console.error('Lỗi khi fetch vital values:', err.response?.data || err.message);
    setSnackbar({ open: true, severity: 'error', message: 'Không tải được dữ liệu vital values' });
  }
};


//========================================================================================
const displayedAppointments = searchAppointmentId
  ? foundAppointment ? [foundAppointment] : []
  : appointments;

  return (
    <Box sx={{ p: 4 }}>


      <Typography variant="h4" gutterBottom>Danh sách lịch hẹn</Typography>
      <Stack spacing={2} direction="row" sx={{ mb: 2 }}>
        <Button variant="contained" onClick={() => { setShowMyAppointments(false); fetchAppointments(); }}>Xem tất cả</Button>
        <Button variant="outlined" onClick={() => { setShowMyAppointments(true); fetchAppointments(); }}>Xem của tôi</Button>
<TextField
  label="Tìm theo ID"
  value={searchAppointmentId}
  size="small"
  onChange={(e) => {
    const val = e.target.value;
    setSearchAppointmentId(val);
    fetchAppointmentById(val); // tự gọi khi gõ
  }}
/>


        <Button variant="contained" color="info" onClick={() => setOpenCreateForm(true)}>Tạo lịch hẹn</Button>
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
            <Typography>Trạng thái: {appt.status}</Typography>
            {appt.notes && <Typography>Ghi chú: {appt.notes}</Typography>}
            {appt.customInfo?.emergencyContact && (
              <Typography>Liên hệ khẩn cấp: {appt.customInfo.emergencyContact}</Typography>
            )}
          </Stack>

          <Button
            variant="outlined"
            color="primary"
            onClick={() => openRecordDialog(appt)}
            sx={{ mt: 1 }}
          >
            {appt.medicalRecords?.[0] ? 'Cập nhật hồ sơ' : 'Tạo bệnh án'}
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
{/* Dialog cập nhật bệnh án */}
<Dialog
  fullWidth
  maxWidth="md"
  open={!!selectedRecordAppt}
  onClose={() => setSelectedRecordAppt(null)}
>
  <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    {`Hồ sơ của: ${selectedRecordAppt?.fullName || selectedRecordAppt?.patient?.fullname || ''}`}
    <IconButton onClick={() => setSelectedRecordAppt(null)}><CloseIcon /></IconButton>
  </DialogTitle>

  <DialogContent dividers>
    <RecordCreateButtons
      onTemplateSelect={(id) => {
        setSelectedTemplateId(id);
        console.log('Người dùng chọn template:', id);
      }}
    />
    {isRecordLoading && <CircularProgress />}
    {recordError && <Alert severity="error">{recordError}</Alert>}

    {!isRecordLoading && questions.length > 0 && (
      <Stack spacing={3} sx={{ mt: 2 }}>
        {questions.map(q => renderQuestion(q, formState, handleInputChange))}

        {selectedVitalGroupId && vitalValuesState.length > 0 && (
          <Box>
            <Typography variant="subtitle1" sx={{ mt: 2 }}>Giá trị sinh tồn</Typography>
           {vitalValuesState.map((v) => {
  const indicator = vitalIndicators.find(ind => ind.id === v.vitalIndicatorId);
  return (
    <Stack key={v.vitalIndicatorId} direction="row" spacing={2} sx={{ mt: 1 }}>
      <TextField
        label={indicator?.name || 'Vital'}
        type="text" // dùng text để không lỗi khi value là string
        value={v.value.value} // giờ đã có .value
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

        {/* Nút tạo/cập nhật hồ sơ */}
        <Button
          variant="contained"
          size="large"
          onClick={handleSubmitRecord}
          disabled={
            isSubmittingRecord ||
            !selectedTemplateId ||
            !selectedVitalGroupId
          }
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