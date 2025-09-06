'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import {
  Box,
  Stack,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  OutlinedInput,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from 'src/lib/axios';

import { useRecordCreateQuestion } from '../Record-create-question';
import { RecordCreateButtons } from '../Record-create-button';

// Render câu hỏi template
const renderQuestion = (question, formState, handleInputChange) => {
  const questionCode = question?.code || '';
  const value = formState?.[questionCode] ?? '';
  const commonProps = { label: question?.name || 'Câu hỏi', fullWidth: true, variant: 'outlined' };

  switch (question?.valueType) {
    case 'number':
      return (
        <TextField
          key={questionCode}
          {...commonProps}
          type="number"
          value={value}
          onChange={(e) => handleInputChange(questionCode, e.target.value)}
          helperText={question?.description}
        />
      );
    case 'text':
      return (
        <TextField
          key={questionCode}
          {...commonProps}
          type="text"
          value={value}
          onChange={(e) => handleInputChange(questionCode, e.target.value)}
          helperText={question?.description}
        />
      );
    case 'selection':
      return (
        <FormControl key={questionCode} fullWidth>
          <InputLabel>{question?.name}</InputLabel>
          <Select
            {...commonProps}
            value={value}
            onChange={(e) => handleInputChange(questionCode, e.target.value)}
          >
            {(question?.valueOptions || []).map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
          {question?.description && <Typography variant="caption">{question.description}</Typography>}
        </FormControl>
      );
    case 'multi_selection':
      return (
        <FormControl key={questionCode} fullWidth>
          <InputLabel>{question?.name}</InputLabel>
          <Select
            {...commonProps}
            multiple
            value={Array.isArray(value) ? value : []}
            onChange={(e) => handleInputChange(questionCode, e.target.value)}
            input={<OutlinedInput label={question?.name} />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {Array.isArray(selected) ? selected.map((val) => <Chip key={val} label={val} />) : null}
              </Box>
            )}
          >
            {(question?.valueOptions || []).map((option) => (
              <MenuItem key={option} value={option}>{option}</MenuItem>
            ))}
          </Select>
          {question?.description && <Typography variant="caption">{question.description}</Typography>}
        </FormControl>
      );
    default:
      return (
        <TextField
          key={questionCode}
          {...commonProps}
          type="text"
          value={value}
          onChange={(e) => handleInputChange(questionCode, e.target.value)}
          helperText={`Kiểu dữ liệu: ${question?.valueType || 'text'}. ${question?.description || ''}`}
        />
      );
  }
};

export function RecordCreateView({ appointmentId, patientId, doctorId, onClose, vitalGroups = [], vitalIndicators = [] }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [selectedVitalGroupId, setSelectedVitalGroupId] = useState(null);
  const [vitalValuesState, setVitalValuesState] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { questions = [], formState = {}, isLoading = false, handleInputChange = () => {}, templateName = '' } =
    useRecordCreateQuestion(selectedTemplateId);

  const handleTemplateSelect = (id) => setSelectedTemplateId(id);

  // Update giá trị vitalValues khi user nhập
  const handleVitalValueChange = (vitalId, value, note) => {
    const updated = [...vitalValuesState];
    const index = updated.findIndex(v => v.vitalIndicatorId === vitalId);
    if (index >= 0) {
      updated[index] = { vitalIndicatorId: vitalId, value: { value: Number(value) }, note };
    } else {
      updated.push({ vitalIndicatorId: vitalId, value: { value: Number(value) }, note });
    }
    setVitalValuesState(updated);
  };

  const handleSubmit = async () => {
    if (!appointmentId || !patientId || !doctorId) {
      setError('Thiếu thông tin appointment hoặc patient/doctor');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 1️⃣ Tạo MedicalRecord
      const recordPayload = {
        appointmentId: Number(appointmentId),
        patientId: Number(patientId),
        doctorId: Number(doctorId),
        templateId: selectedTemplateId ? Number(selectedTemplateId) : undefined,
        answers: formState,
      };

      const recordResponse = await axiosInstance.post('/api/staff/medical-records', recordPayload);
      const recordId = recordResponse.data?.data?.id;
      if (!recordId) throw new Error('Không lấy được recordId sau khi tạo');

      // 2️⃣ Liên kết VitalGroup nếu chọn
      if (selectedVitalGroupId) {
        await axiosInstance.patch(`/api/staff/medical-records/vital-group/${recordId}`, {
          groupId: Number(selectedVitalGroupId),
          doctorId: Number(doctorId),
          examinationDate: new Date().toISOString(),
        });
      }

      // 3️⃣ Gửi vitalValues nếu có
      if (vitalValuesState.length > 0) {
        await axiosInstance.patch(`/api/staff/medical-records/${recordId}/vital-values`, {
          vitalValues: vitalValuesState,
        });
      }

      onClose?.();
    } catch (err) {
      console.error('Lỗi khi tạo medical record:', err.response?.data || err.message);
      setError('Tạo hồ sơ thất bại. Kiểm tra console để biết chi tiết.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Khởi tạo vitalValuesState khi chọn vitalGroup
  useEffect(() => {
    if (selectedVitalGroupId && vitalIndicators.length > 0) {
      const initial = vitalIndicators.map(ind => ({ vitalIndicatorId: ind.id, value: { value: 0 }, note: '' }));
      setVitalValuesState(initial);
    }
  }, [selectedVitalGroupId, vitalIndicators]);

  return (
    <>
      <RecordCreateButtons onTemplateSelect={handleTemplateSelect} />

      <Dialog fullWidth maxWidth="md" open={!!selectedTemplateId} onClose={onClose}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {`Tạo hồ sơ theo mẫu: "${templateName || ''}"`}
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {!isLoading && questions.length > 0 && (
            <Stack spacing={3} sx={{ mt: 2 }}>
              {questions.map((q) => renderQuestion(q, formState, handleInputChange))}

              {/* Chọn VitalGroup */}
              {vitalGroups.length > 0 && (
                <FormControl fullWidth>
                  <InputLabel>Vital Group</InputLabel>
                  <Select
                    value={selectedVitalGroupId || ''}
                    onChange={(e) => setSelectedVitalGroupId(Number(e.target.value))}
                  >
                    {vitalGroups.map((vg) => (
                      <MenuItem key={vg.id} value={vg.id}>{vg.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* Nhập vitalValues */}
              {selectedVitalGroupId && vitalValuesState.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" sx={{ mt: 2 }}>Giá trị sinh tồn</Typography>
                  {vitalValuesState.map((v, idx) => {
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

              <Button variant="contained" size="large" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Đang tạo...' : 'Tạo hồ sơ'}
              </Button>
            </Stack>
          )}

          {!isLoading && questions.length === 0 && (
            <Typography color="text.secondary" sx={{ py: 5, textAlign: 'center' }}>
              Không có câu hỏi nào trong mẫu này.
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
