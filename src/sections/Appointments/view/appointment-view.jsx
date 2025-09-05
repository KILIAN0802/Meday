'use client';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';


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
} from '@mui/material';
import axiosInstance from 'src/lib/axios';

export function StaffAppointment() {
  const [appointments, setAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]); // dữ liệu gốc
  const [isLoading, setIsLoading] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [showMyAppointments, setShowMyAppointments] = useState(false);
  

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
    } finally {
      setIsLoading(false);
    }
  }, [showMyAppointments]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axiosInstance.patch(`/api/v1/staff/appointments/${id}/status`, {
        status: newStatus,
      });
      fetchAppointments(); // reload lại sau khi đổi trạng thái
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // hàm filter theo id
  const handleSearch = (value) => {
    setSearchId(value);
    if (value === '') {
      setAppointments(allAppointments);
    } else {
      const filtered = allAppointments.filter((r) =>
        r.id.toString().includes(value)
      );
      setAppointments(filtered);
    }
  };

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
    fetchAppointments();
  } catch (error) {
    console.error('Lỗi khi tạo lịch hẹn:', error.response?.data || error.message);
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
                  Thời gian hẹn: {new Date(appt.appointmentDate).toLocaleString()}
                </Typography>
                <Typography>Họ tên bệnh nhân: {appt.fullName}</Typography>
                <Typography>Số điện thoại: {appt.phone}</Typography>
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
                </Box>

                {/* Dialog tạo lịch hẹn */}
                <Dialog open={openCreateForm} onClose={() => setOpenCreateForm(false)} fullWidth maxWidth="sm">
                <DialogTitle>Tạo lịch hẹn mới</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField label="Lý do khám" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} />
                    <TextField label="Thời gian hẹn" type="datetime-local" value={formData.appointmentDate} onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })} />
                    <TextField label="Ghi chú" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                    <TextField label="Họ tên bệnh nhân" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
                    <TextField label="Số điện thoại" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    <TextField label="Người liên hệ khẩn cấp" value={formData.emergencyContact} onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })} />
                    <TextField label="Bảo hiểm" value={formData.insurance} onChange={(e) => setFormData({ ...formData, insurance: e.target.value })} />
                    {/* <TextField label="Câu trả lời tiền khám" value={formData.preMedicalResponses[0].answerValue} onChange={(e) => setFormData({ ...formData, preMedicalResponses: [{ questionId: 0, answerValue: e.target.value }] })} /> */}
                    <Typography variant="subtitle1">Câu trả lời tiền khám</Typography>
                    {formData.preMedicalResponses.map((item, index) => (
                    <Stack key={index} direction="row" spacing={2}>
                        <TextField
                        label="ID câu hỏi"
                        type="number"
                        value={item.questionId}
                        onChange={(e) => {
                            const updated = [...formData.preMedicalResponses];
                            updated[index].questionId = Number(e.target.value);
                            setFormData({ ...formData, preMedicalResponses: updated });
                        }}
                        />
                        <TextField
                        label="Câu trả lời"
                        value={item.answerValue}
                        onChange={(e) => {
                            const updated = [...formData.preMedicalResponses];
                            updated[index].answerValue = e.target.value;
                            setFormData({ ...formData, preMedicalResponses: updated });
                        }}
                        />
                        <Button
                        color="error"
                        onClick={() => {
                            const updated = formData.preMedicalResponses.filter((_, i) => i !== index);
                            setFormData({ ...formData, preMedicalResponses: updated });
                        }}
                        >
                        Xóa
                        </Button>
                    </Stack>
                    ))}

                    <Button
                    variant="outlined"
                    onClick={() =>
                        setFormData({
                        ...formData,
                        preMedicalResponses: [...formData.preMedicalResponses, { questionId: 0, answerValue: '' }],
                        })
                    }
                    >
                    Thêm câu hỏi
                    </Button>

                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCreateForm(false)}>Hủy</Button>
                    <Button variant="contained" onClick={handleSubmitAppointment}>Tạo</Button>
                </DialogActions>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}
