'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, CircularProgress, Box, Typography, Stack, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { getMedicalRecordTemplateById } from 'src/api/medical-record-templates-staff.js';
import { getVitalValuesMedicalRecord, updateVitalMedicalRecordeById } from 'src/api/medical-record-staff.js';
import { RecordCreateButtons } from 'src/sections/medicalRecordStaff/create/Record-create-button.jsx';
import axiosInstance from 'src/lib/axios.js';
// Render từng trường trong form
function QuestionRenderer({ indicator, value, onChange }) {
  return (
    <TextField
      fullWidth
      margin="normal"
      type={indicator.valueType === 'number' ? 'number' : 'text'}
      label={indicator.name || `Chỉ số ${indicator.id}`}
      variant="outlined"
      helperText={indicator.unit || ''}
      value={value}
      onChange={e => onChange(indicator.id, e.target.value)}
    />
  );
}

// Modal hiển thị form bệnh án
function VitalsFormModal({
  open, onClose, questions, loading, onSave,
  medicalRecordId, appointment
}) {
  const [formValues, setFormValues] = useState({});

  useEffect(() => {
    if (questions) {
      const initialValues = {};
      questions.forEach(q => initialValues[q.id] = q.savedValue ?? '');
      setFormValues(initialValues);
    }
  }, [questions]);

  const handleValueChange = (id, val) => {
    setFormValues(prev => ({ ...prev, [id]: val }));
  };

  const handleSave = () => {
    onSave(medicalRecordId, formValues);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {`Hồ sơ của: ${appointment?.fullName || appointment?.patient?.fullname || ''}`}
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <RecordCreateButtons onTemplateSelect={() => {}} />

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && questions.length > 0 && (
          <Stack spacing={2} sx={{ mt: 2 }}>
            {questions.map(q => (
              <QuestionRenderer
                key={q.id}
                indicator={q}
                value={formValues[q.id] || ''}
                onChange={handleValueChange}
              />
            ))}
          </Stack>
        )}

        {!loading && questions.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 5, textAlign: 'center' }}>
            Chưa chọn template hoặc không có câu hỏi nào.
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={handleSave} disabled={loading || questions.length === 0}>
          Lưu hồ sơ
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Component chính load + save form
export default function MedicalRecordFormLoader({
  templateId,
  medicalRecordId,
  appointment,
  currentStaff,
  setSnackbar,
  open,
  onClose
}) {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const loadFormData = async () => {
      if (!templateId || !medicalRecordId) return;
      setLoading(true);
      try {
        // Load template + saved values
        const [templateRes, savedRes] = await Promise.all([
          getMedicalRecordTemplateById(templateId),
          getVitalValuesMedicalRecord(medicalRecordId)
        ]);

        const savedValuesMap = new Map();
        (savedRes?.data || []).forEach(val => {
          let actual = val.value;
          if (actual && typeof actual === 'object' && 'value' in actual) actual = actual.value;
          savedValuesMap.set(val.vitalIndicatorId, actual);
        });

        // Load tất cả group song song
        const vitalGroupIds = templateRes?.data?.vitalGroupIds || [];
        const groups = await Promise.all(
          vitalGroupIds.map(async id => {
            const mod = await import('src/api/vitals');
            const res = await mod.getVitalGroupById(id);
            return res?.data?.indicators || [];
          })
        );
        const vitalIndicators = groups.flat();

        // Gán giá trị đã lưu
        const questionsWithValues = vitalIndicators.map(ind => ({
          ...ind,
          savedValue: savedValuesMap.get(ind.id) ?? ''
        }));

        setQuestions(questionsWithValues);
      } catch (err) {
        console.error('Lỗi load form:', err);
        setSnackbar?.({ open: true, severity: 'error', message: 'Lỗi khi load form bệnh án' });
      } finally {
        setLoading(false);
      }
    };

    loadFormData();
  }, [templateId, medicalRecordId, setSnackbar]);

const handleSave = async (medicalRecordId, values, doctorId) => {
  if (!medicalRecordId) {
    console.error('MedicalRecordId không tồn tại, không thể lưu');
    setSnackbar?.({ open: true, severity: 'error', message: 'Không tìm thấy bệnh án để lưu!' });
    return;
  }

  try {
    // 1️⃣ Lọc các indicator mới
    const newIndicators = questions.filter(q => values[q.id] && !q.savedValue);

    for (const q of newIndicators) {
      // 2️⃣ Tạo vitalGroup mới cho indicator
     await axiosInstance.patch(
  `/api/staff/medical-records/vital-group/${q.vitalGroupId}`,
  {
    examinationDate: new Date().toISOString(),
    groupId: q.vitalGroupId, // bắt buộc
    doctorId: currentStaff.id // bắt buộc
  }
);
      console.log(`Tạo vitalGroup mới cho indicator ${q.id}`);
    }

    // 3️⃣ Chuẩn hóa tất cả giá trị (cũ + mới)
    const formatted = Object.entries(values)
      .filter(([, v]) => v !== '' && v !== null)
      .map(([id, v]) => ({
        vitalIndicatorId: parseInt(id),
        value: { value: v },
        note: ''
      }));

    // 4️⃣ Cập nhật giá trị
    if (formatted.length) {
      await axiosInstance.patch(`/api/staff/medical-records/${medicalRecordId}/vital-values`, {
        vitalValues: formatted
      });
    }

    setSnackbar?.({ open: true, severity: 'success', message: 'Lưu thành công!' });
  } catch (err) {
    console.error('Lỗi save form:', err);
    setSnackbar?.({ open: true, severity: 'error', message: 'Lỗi khi lưu chỉ số.' });
  }
};



  return (
    <VitalsFormModal
      open={open}
      onClose={onClose}
      loading={loading}
      questions={questions}
      onSave={handleSave}
      medicalRecordId={medicalRecordId}
      appointment={appointment}
    />
  );
}
