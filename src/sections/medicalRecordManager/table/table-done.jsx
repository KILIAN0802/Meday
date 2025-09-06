'use client';

import React, { useState, useEffect } from 'react';

// --- Import các API cần thiết ---
import { getAppointment } from 'src/api/appointments-staff';
import { getMedicalRecordTemplateById } from 'src/api/medical-record-templates-staff';
import { getVitalGroupById } from 'src/api/vitals';
import { getVitalValuesMedicalRecord } from 'src/api/medical-record-staff';
import { ReusableTablePagination } from 'src/components/pagination';

// --- Material-UI Imports ---
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
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
} from '@mui/material';

// ----------------------------------------------------------------------
// ### COMPONENT PHỤ 1: HIỂN THỊ CHI TIẾT NGƯỜI DÙNG ###
// ----------------------------------------------------------------------
function PersonDetailsModal({ person, open, onClose }) {
  if (!person) return null;
  const KEY_LABELS = { id: 'Mã số', fullname: 'Họ và tên', phone: 'Số điện thoại', email: 'Email', role: 'Vai trò' };
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

// ----------------------------------------------------------------------
// ### COMPONENT PHỤ 2: HIỂN THỊ CHIP TRẠNG THÁI ###
// ----------------------------------------------------------------------
function StatusChip({ status }) {
  const statusMap = {
    PENDING: { color: 'warning', text: 'CHỜ XỬ LÝ' },
    CONFIRMED: { color: 'primary', text: 'ĐANG XỬ LÝ' },
    COMPLETED: { color: 'success', text: 'HOÀN THÀNH' },
  };
  const { color, text } = statusMap[status] || { color: 'default', text: 'KHÔNG RÕ' };
  return <Chip label={text} color={color} size="small" sx={{ fontWeight: 'bold' }} />;
}

// ----------------------------------------------------------------------
// ### COMPONENT PHỤ 3: RENDER CÁC TRƯỜNG TRONG FORM ###
// ----------------------------------------------------------------------
function QuestionRenderer({ indicator, value, isReadOnly }) {
  switch (indicator.valueType) {
    case 'selection': {
      const options = (indicator.valueOptions || [])
        .filter(Boolean)
        .map(optStr => {
          let optValue = optStr, optLabel = optStr;
          if (optStr.includes('.')) {
            const parts = optStr.split('.');
            optValue = parts[0];
            optLabel = parts.slice(1).join('.');
          }
          return { value: optValue, label: optLabel };
        });

      return (
        <FormControl component="fieldset" margin="normal" fullWidth disabled={isReadOnly}>
          <FormLabel component="legend">{indicator.name}</FormLabel>
          <RadioGroup row name={indicator.code || `indicator-${indicator.id}`} value={value}>
            {options.map(optionObj => (
              <FormControlLabel key={optionObj.value} value={optionObj.value} control={<Radio />} label={optionObj.label} />
            ))}
          </RadioGroup>
        </FormControl>
      );
    }
    default:
      return (
        <TextField
          key={indicator.id}
          fullWidth
          margin="normal"
          type={indicator.valueType === 'number' ? 'number' : indicator.valueType === 'full_date' ? 'date' : 'text'}
          label={indicator.name || `Chỉ số ${indicator.id}`}
          variant="outlined"
          helperText={indicator.unit || ''}
          value={value}
          InputProps={{ readOnly: isReadOnly }}
          InputLabelProps={indicator.valueType === 'full_date' ? { shrink: true } : {}}
        />
      );
  }
}

// ----------------------------------------------------------------------
// ### COMPONENT PHỤ 4: MODAL HIỂN THỊ FORM CHỈ SỐ SINH TỒN ###
// ----------------------------------------------------------------------
function VitalsFormModal({ open, onClose, questions, loading, isReadOnly }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Xem lại Form Bệnh án</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>
        ) : questions.length > 0 ? (
          <Box component="form" noValidate autoComplete="off" sx={{ mt: 1 }}>
            {questions.map((indicator) => (
              <QuestionRenderer 
                key={indicator.id} 
                indicator={indicator} 
                value={indicator.savedValue || ''}
                isReadOnly={isReadOnly}
              />
            ))}
          </Box>
        ) : (
          <Typography sx={{ my: 5, textAlign: 'center' }}>Không tìm thấy chỉ số sinh tồn nào cho mẫu bệnh án này.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
}

// ----------------------------------------------------------------------
// ### COMPONENT CHÍNH: BẢNG BỆNH ÁN ĐÃ HOÀN THÀNH ###
// ----------------------------------------------------------------------
export function CompletedMedicalRecords() {
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  // State cho Vitals Form Modal
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [isLoadingVitals, setIsLoadingVitals] = useState(false);
  const [vitalQuestions, setVitalQuestions] = useState([]);

  const templateMap = {
    16: 'Bệnh án cấp tính',
    17: 'Bệnh án mãn tính lần 1',
    18: 'Bệnh án mãn tính tái khám',
  };
  
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewVitalsForm = async (templateId, medicalRecordId) => {
    if (!templateId) {
      setNotification({ open: true, message: 'Mẫu bệnh án không có ID hợp lệ.', severity: 'error' });
      return;
    }
    setIsVitalsModalOpen(true);
    setIsLoadingVitals(true);
    setVitalQuestions([]);
    try {
      const [templateResponse, savedValuesResponse] = await Promise.all([
        getMedicalRecordTemplateById(templateId),
        getVitalValuesMedicalRecord(medicalRecordId)
      ]);
      const savedValues = savedValuesResponse?.data || [];
      const valuesMap = new Map();
      savedValues.forEach(val => {
        let actualValue = val.value;
        if (typeof actualValue === 'object' && actualValue !== null && 'value' in actualValue) {
          actualValue = actualValue.value;
        }
        valuesMap.set(val.vitalIndicatorId, actualValue);
      });
      const vitalGroupIds = templateResponse?.data?.vitalGroupIds || [];
      if (vitalGroupIds.length === 0) {
        setIsLoadingVitals(false);
        return;
      }
      const vitalGroupPromises = vitalGroupIds.map((id) => getVitalGroupById(id));
      const vitalGroupResponses = await Promise.all(vitalGroupPromises);
      const allIndicators = vitalGroupResponses.flatMap((response) => response?.data?.indicators || []);
      const questionsWithValues = allIndicators.map(indicator => ({
        ...indicator,
        savedValue: valuesMap.get(indicator.id) ?? ''
      }));
      setVitalQuestions(questionsWithValues);
    } catch (err) {
      console.error('Lỗi khi lấy dữ liệu form:', err);
      setNotification({ open: true, message: 'Không thể tải dữ liệu form.', severity: 'error' });
    } finally {
      setIsLoadingVitals(false);
    }
  };

  useEffect(() => {
    const fetchCompletedData = async () => {
      setLoading(true);
      setError(null);
      try {
        // THAY ĐỔI: Lấy các bệnh án có trạng thái 'COMPLETED'
        const params = { status: 'COMPLETED', page: page + 1, limit: rowsPerPage };
        const response = await getAppointment(params);
        
        const recordsWithAppointmentInfo = (response?.data || [])
          .flatMap(app => {
            if (app && Array.isArray(app.medicalRecords)) {
              return app.medicalRecords.map(record => ({
                ...record,
                appointment: { id: app.id, status: app.status, reason: app.reason }
              }));
            }
            return [];
          })
          .filter(Boolean);

        setMedicalRecords(recordsWithAppointmentInfo);
        setTotalRecords(response?.total || 0);

      } catch (err) {
        setError('Không thể tải danh sách bệnh án. Vui lòng thử lại.');
        console.error('Lỗi khi fetch bệnh án đã hoàn thành:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedData();
  }, [page, rowsPerPage]);

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 5 }}>Danh sách Bệnh án Đã hoàn thành</Typography>
      <Card>
        {error && <Typography color="error" sx={{ p: 2 }}>Lỗi: {error}</Typography>}
        
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
                <TableRow><TableCell colSpan={6} align="center"><CircularProgress sx={{ my: 4 }}/></TableCell></TableRow>
              ) : (Array.isArray(medicalRecords) && medicalRecords.length > 0) ? (
                medicalRecords.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>
                      <Typography onClick={() => setSelectedPerson(row.patient)} variant="body2" sx={{ color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                        {row.patient?.fullname || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell 
                      onClick={() => handleViewVitalsForm(row.templateId, row.id)}
                      sx={{ cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                    >
                      {templateMap[row.templateId] || `Mẫu ${row.templateId}`}
                    </TableCell>
                    <TableCell>{row.appointment?.reason || 'N/A'}</TableCell>
                    <TableCell align="center"><StatusChip status={row.appointment?.status || 'UNKNOWN'} /></TableCell>
                    <TableCell align="right">
                      {/* Bỏ trống cột chức năng vì bệnh án đã hoàn thành, không có hành động */}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body1" sx={{ my: 4, color: 'text.secondary' }}>Không tìm thấy bệnh án nào đã hoàn thành.</Typography>
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
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>

      <PersonDetailsModal
        person={selectedPerson}
        open={Boolean(selectedPerson)}
        onClose={() => setSelectedPerson(null)}
      />

      <VitalsFormModal
        open={isVitalsModalOpen}
        onClose={() => setIsVitalsModalOpen(false)}
        loading={isLoadingVitals}
        questions={vitalQuestions}
        isReadOnly={true} // <-- Đặt form ở chế độ chỉ đọc
        // onSave không cần thiết ở đây
      />
      
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}