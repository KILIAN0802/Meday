'use client';

import React, { useState, useEffect } from 'react';

// --- Import các API cần thiết ---
import { getAppointment, updateAppointmentStatusID } from 'src/api/appointments-staff';
import { getMedicalRecordTemplateById } from 'src/api/medical-record-templates-staff';
import { getVitalGroupById } from 'src/api/vitals';
import { getVitalValuesMedicalRecord, updateVitalMedicalRecordeById } from 'src/api/medical-record-staff';
import { ReusableTablePagination } from 'src/components/pagination';

// --- Material-UI Imports ---
import {
  Snackbar, Alert, Box, Card, Table, Container, TableBody, TableCell, TableHead, TableRow, Typography,
  TableContainer, CircularProgress, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel,
  Checkbox, FormGroup // THAY ĐỔI: Thêm Checkbox và FormGroup cho multiple choice
} from '@mui/material';

// ----------------------------------------------------------------------
// ### COMPONENT PHỤ 1: HIỂN THỊ CHI TIẾT NGƯỜI DÙNG ###
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
// (Không thay đổi)
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
// ### THAY ĐỔI: COMPONENT PHỤ 3: NÂNG CẤP ĐỂ HỖ TRỢ MULTIPLE CHOICE ###
// ----------------------------------------------------------------------
function QuestionRenderer({ indicator, value, onChange }) {
  // --- Parser chung cho các tùy chọn ---
  const parseOptions = (optionsArray) => (optionsArray || [])
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

  switch (indicator.valueType) {
    // --- Case mới cho Multiple Choice (Checkbox) ---
    case 'multi_selection': {
      const options = parseOptions(indicator.valueOptions);
      const selectedValues = Array.isArray(value) ? value : [];

      const handleCheckboxChange = (event) => {
        const { value: checkboxValue, checked } = event.target;
        const newSelectedValues = checked
          ? [...selectedValues, checkboxValue]
          : selectedValues.filter(v => v !== checkboxValue);
        onChange(indicator.id, newSelectedValues);
      };

      return (
        <FormControl component="fieldset" margin="normal" fullWidth>
          <FormLabel component="legend">{indicator.name}</FormLabel>
          <FormGroup row>
            {options.map(optionObj => (
              <FormControlLabel
                key={`${optionObj.value}-${optionObj.label}`} 
                control={
                  <Checkbox
                    checked={selectedValues.includes(optionObj.value)}
                    onChange={handleCheckboxChange}
                    value={optionObj.value}
                  />
                }
                label={optionObj.label}
              />
            ))}
          </FormGroup>
        </FormControl>
      );
    }
    // --- Case cho Single Choice (Radio) ---
    case 'selection': {
      const options = parseOptions(indicator.valueOptions);
      const handleChange = (event) => onChange(indicator.id, event.target.value);
      return (
        <FormControl component="fieldset" margin="normal" fullWidth>
          <FormLabel component="legend">{indicator.name}</FormLabel>
          <RadioGroup row name={indicator.code || `indicator-${indicator.id}`} value={value || ''} onChange={handleChange}>
            {options.map(optionObj => (
              <FormControlLabel key={`${optionObj.value}-${optionObj.label}`} value={optionObj.value} control={<Radio />} label={optionObj.label} />
            ))}
          </RadioGroup>
        </FormControl>
      );
    }
    // --- Case mặc định cho các loại input khác ---
    default: {
      const handleChange = (event) => onChange(indicator.id, event.target.value);
      return (
        <TextField
          key={indicator.id} fullWidth margin="normal"
          type={indicator.valueType === 'number' ? 'number' : indicator.valueType === 'full_date' ? 'date' : 'text'}
          label={indicator.name || `Chỉ số ${indicator.id}`}
          variant="outlined" helperText={indicator.unit || ''} value={value || ''} onChange={handleChange}
          InputLabelProps={indicator.valueType === 'full_date' ? { shrink: true } : {}}
        />
      );
    }
  }
}


// ----------------------------------------------------------------------
// ### THAY ĐỔI: COMPONENT PHỤ 4: MODAL HIỂN THỊ FORM THEO NHÓM ###
// ----------------------------------------------------------------------
function VitalsFormModal({ open, onClose, questionGroups, loading, onSave, medicalRecordId }) {
    const [formValues, setFormValues] = useState({});

    useEffect(() => {
      if (questionGroups) {
        const initialValues = {};
        // Duyệt qua cấu trúc nhóm để khởi tạo giá trị
        questionGroups.forEach(group => {
          group.indicators.forEach(q => {
            // Đối với multiple choice, đảm bảo giá trị khởi tạo là một mảng
            if (q.valueType === 'multiple_selection') {
                initialValues[q.id] = Array.isArray(q.savedValue) ? q.savedValue : [];
            } else {
                initialValues[q.id] = q.savedValue ?? '';
            }
          });
        });
        setFormValues(initialValues);
      }
    }, [questionGroups]);
  
    const handleValueChange = (indicatorId, newValue) => {
      setFormValues(prev => ({ ...prev, [indicatorId]: newValue }));
    };
  
    const handleSave = () => {
      onSave(medicalRecordId, formValues);
      onClose();
    };
  
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Form Bệnh án</DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>
          ) : questionGroups.length > 0 ? (
            <Box component="form" noValidate autoComplete="off" sx={{ mt: 1 }}>
              {/* Vòng lặp ngoài cho nhóm */}
              {questionGroups.map((group) => (
                <Box key={group.id} sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>{group.name}</Typography>
                    {/* Vòng lặp trong cho câu hỏi */}
                    {group.indicators.map((indicator) => (
                        <QuestionRenderer 
                            key={indicator.id} 
                            indicator={indicator} 
                            value={formValues[indicator.id]}
                            onChange={handleValueChange}
                        />
                    ))}
                </Box>
              ))}
            </Box>
          ) : (
            <Typography sx={{ my: 5, textAlign: 'center' }}>Không tìm thấy chỉ số sinh tồn nào.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Hủy</Button>
          <Button variant="contained" onClick={handleSave} disabled={loading}>Lưu</Button>
        </DialogActions>
      </Dialog>
    );
}

// ----------------------------------------------------------------------
// ### COMPONENT CHÍNH: BẢNG BỆNH ÁN ĐANG XỬ LÝ ###
// ----------------------------------------------------------------------
export function ConfirmedMedicalRecords() {
    const [medicalRecords, setMedicalRecords] = useState([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [isCompletingId, setIsCompletingId] = useState(null);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
    const [refetchTrigger, setRefetchTrigger] = useState(0);

    // THAY ĐỔI: State cho form theo nhóm
    const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
    const [isLoadingVitals, setIsLoadingVitals] = useState(false);
    const [vitalQuestionGroups, setVitalQuestionGroups] = useState([]);
    const [activeMedicalRecordId, setActiveMedicalRecordId] = useState(null);

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

    // THAY ĐỔI: Hàm fetch dữ liệu form theo nhóm
    const handleViewVitalsForm = async (templateId, medicalRecordId) => {
        setActiveMedicalRecordId(medicalRecordId);
        if (!templateId) {
            setNotification({ open: true, message: 'Mẫu bệnh án không có ID hợp lệ.', severity: 'error' });
            return;
        }
        setIsVitalsModalOpen(true);
        setIsLoadingVitals(true);
        setVitalQuestionGroups([]);
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
            
            // Giữ nguyên cấu trúc nhóm
            const groupsWithValues = vitalGroupResponses.map(response => {
                if (!response?.data?.indicators) return null;
                return {
                    id: response.data.id,
                    name: response.data.name,
                    indicators: response.data.indicators.map(indicator => ({
                        ...indicator,
                        savedValue: valuesMap.get(indicator.id)
                    }))
                };
            }).filter(Boolean);

            setVitalQuestionGroups(groupsWithValues);
        } catch (err) {
            console.error('Lỗi khi lấy dữ liệu form:', err);
            setNotification({ open: true, message: 'Không thể tải dữ liệu form.', severity: 'error' });
        } finally {
            setIsLoadingVitals(false);
        }
    };
  
    const handleSaveChanges = async (medicalRecordId, updatedValues) => {
        try {
            const formattedValues = Object.entries(updatedValues)
                .filter(([, value]) => {
                    if (Array.isArray(value)) return value.length > 0; // Giữ lại mảng không rỗng
                    return value !== '' && value !== null && value !== undefined;
                })
                .map(([indicatorId, value]) => {
                    const idAsNumber = parseInt(indicatorId, 10);
                    let finalValue = value;
                    if (typeof value === 'string' && !isNaN(value) && value.trim() !== '') {
                        const originalIndicator = vitalQuestionGroups.flatMap(g => g.indicators).find(q => q.id === idAsNumber);
                        if (originalIndicator?.valueType === 'number') {
                            finalValue = parseFloat(value);
                        }
                    }
                    return { vitalIndicatorId: idAsNumber, value: { value: finalValue }, note: "" };
                });
      
            if (formattedValues.length === 0) {
                setNotification({ open: true, message: 'Không có thay đổi nào để lưu.', severity: 'info' });
                return; 
            }

            await updateVitalMedicalRecordeById(medicalRecordId, { vitalValues: formattedValues });
            setNotification({ open: true, message: 'Cập nhật chỉ số thành công!', severity: 'success' });
        } catch (err) {
            console.error('Lỗi khi cập nhật chỉ số:', err);
            const backendMessage = err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
            setNotification({ open: true, message: backendMessage, severity: 'error' });
        }
    };

    const handleCompleteRecord = async (appointmentId) => {
        setIsCompletingId(appointmentId);
        try {
            await updateAppointmentStatusID(appointmentId, { status: 'COMPLETED' });
            setNotification({ open: true, message: 'Hoàn thành bệnh án thành công!', severity: 'success' });
            setRefetchTrigger(prev => prev + 1);
        } catch (err) {
            console.error('Lỗi khi hoàn thành bệnh án:', err);
            setNotification({ open: true, message: err.message || 'Có lỗi xảy ra.', severity: 'error' });
        } finally {
            setIsCompletingId(null);
        }
    };

    useEffect(() => {
        const fetchConfirmedData = async () => {
            setLoading(true);
            setError(null);
            try {
                const params = { status: 'CONFIRMED', page: page + 1, limit: rowsPerPage };
                const response = await getAppointment(params);
                const records = (response?.data || [])
                    .flatMap(app => app && Array.isArray(app.medicalRecords) ? app.medicalRecords.map(r => ({ ...r, appointment: { id: app.id, status: app.status, reason: app.reason } })) : [])
                    .filter(Boolean);
                setMedicalRecords(records);
                setTotalRecords(response?.total || 0);
            } catch (err) {
                setError('Không thể tải danh sách bệnh án.');
                console.error('Lỗi khi fetch bệnh án đang xử lý:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchConfirmedData();
    }, [page, rowsPerPage, refetchTrigger]);

    return (
        <Container maxWidth="xl">
            <Typography variant="h4" sx={{ mb: 5 }}>Danh sách Bệnh án Đang xử lý</Typography>
            <Card>
                {/* ...Phần render bảng không thay đổi... */}
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
                      ) : (Array.isArray(medicalRecords) && medicalRecords.length > 0) ? (
                        medicalRecords.map((row) => (
                          <TableRow key={row.id} hover>
                            <TableCell>{row.id}</TableCell>
                            <TableCell>
                              <Typography
                                onClick={() => setSelectedPerson(row.patient)}
                                variant="body2"
                                sx={{ color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                              >
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
                              <Button
                                variant="contained" color="success" size="small"
                                onClick={() => handleCompleteRecord(row.appointment.id)}
                                disabled={isCompletingId === row.appointment.id}
                              >
                                {isCompletingId === row.appointment.id ? <CircularProgress size={20} color="inherit" /> : 'Hoàn thành'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography variant="body1" sx={{ my: 4, color: 'text.secondary' }}>Không tìm thấy bệnh án nào đang xử lý.</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                <ReusableTablePagination
                    count={totalRecords} rowsPerPage={rowsPerPage} page={page}
                    onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage}
                />
            </Card>
            <PersonDetailsModal
                person={selectedPerson} open={Boolean(selectedPerson)}
                onClose={() => setSelectedPerson(null)}
            />
            {/* Truyền prop mới vào Modal */}
            <VitalsFormModal
                open={isVitalsModalOpen} onClose={() => setIsVitalsModalOpen(false)}
                loading={isLoadingVitals} questionGroups={vitalQuestionGroups}
                onSave={handleSaveChanges} medicalRecordId={activeMedicalRecordId}
            />
            <Snackbar
                open={notification.open} autoHideDuration={6000}
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