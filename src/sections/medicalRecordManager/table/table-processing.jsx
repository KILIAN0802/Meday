'use client';

import React, { useState, useEffect } from 'react';

import { getAppointment, updateAppointmentStatusID } from 'src/api/appointments-staff';
import { getMedicalRecordTemplateById } from 'src/api/medical-record-templates-staff';
import { getVitalGroupById } from 'src/api/vitals';
import { getVitalValuesMedicalRecord, updateVitalMedicalRecordeById } from 'src/api/medical-record-staff';
import { ReusableTablePagination } from 'src/components/pagination';

import {
  Snackbar, Alert, Box, Card, Table, Container, TableBody, TableCell, TableHead, TableRow, Typography,
  TableContainer, CircularProgress, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel,
  Checkbox, FormGroup 
} from '@mui/material';


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

function StatusChip({ status }) {
    const statusMap = {
        PENDING: { color: 'warning', text: 'CHỜ TIẾP NHẬN' },
        CONFIRMED: { color: 'primary', text: 'ĐÃ TIẾP NHẬN' },
        COMPLETED: { color: 'success', text: 'HOÀN THÀNH' },
    };
    const { color, text } = statusMap[status] || { color: 'default', text: 'KHÔNG RÕ' };
    return <Chip label={text} color={color} size="small" sx={{ fontWeight: 'bold' }} />;
}

function QuestionRenderer({ indicator, value, onChange }) {
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

function VitalsFormModal({ open, onClose, questionGroups, loading, onSave, medicalRecordId }) {
    const [formValues, setFormValues] = useState({});

    useEffect(() => {
      if (questionGroups) {
        const initialValues = {};
        questionGroups.forEach(group => {
          group.indicators.forEach(q => {
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
                    if (Array.isArray(value)) return value.length > 0;
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
    const fetchAndAggregateData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let aggregatedRecords = [];
        let currentApiPage = 1; 
        let lastKnownTotal = 0;
        let continueFetching = true;
        const recordsNeeded = (page + 1) * rowsPerPage;
        while (aggregatedRecords.length < recordsNeeded && continueFetching) {
          // Giữ nguyên status: 'CONFIRMED'
          const params = { status: 'CONFIRMED', page: currentApiPage, limit: rowsPerPage };
          const response = await getAppointment(params);

          const rawAppointments = response?.data || [];
          if (response?.total) {
            lastKnownTotal = response.total;
          }
          if (rawAppointments.length === 0) {
            continueFetching = false;
            break;
          }
          
          const newRecords = rawAppointments.flatMap((app) =>
            app && Array.isArray(app.medicalRecords)
              ? app.medicalRecords.map((r) => ({
                  ...r,
                  appointment: { id: app.id, status: app.status, reason: app.reason },
                }))
              : []
          );
            
          aggregatedRecords.push(...newRecords);
          currentApiPage++;
        }
        const startIndex = page * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const finalRecordsForPage = aggregatedRecords.slice(startIndex, endIndex);

        setMedicalRecords(finalRecordsForPage);
        setTotalRecords(lastKnownTotal);

      } catch (err) {
        setError('Không thể tải dữ liệu bệnh án.');
        console.error('Lỗi khi fetch và gom dữ liệu bệnh án:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndAggregateData();
  }, [page, rowsPerPage, refetchTrigger]);

    return (
        <Container maxWidth="xl">
            <Typography variant="h4" sx={{ mb: 5 }}>Danh sách bệnh án đang xử lý</Typography>
            <Card>
                <TableContainer>
                  <Table>
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
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
                            <Typography variant="body1" sx={{ my: 4, color: 'text.secondary' }}>Chưa tiếp nhận bệnh án nào.</Typography>
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