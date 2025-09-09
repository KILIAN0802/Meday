'use client';

import React, { useState, useEffect } from 'react';
import {
  Snackbar, Alert, Box, Card, Table, Container, TableBody, TableCell, TableHead, TableRow, Typography,
  TableContainer, CircularProgress, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel,
  Checkbox, FormGroup // THAY ĐỔI: Thêm Checkbox và FormGroup cho multiple choice
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { getMedicalRecordTemplateById } from 'src/api/medical-record-templates-staff.js';
import { getVitalValuesMedicalRecord, updateVitalMedicalRecordeById } from 'src/api/medical-record-staff.js';
import { RecordCreateButtons } from 'src/sections/medicalRecordStaff/create/Record-create-button.jsx';
import axiosInstance from 'src/lib/axios.js';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';

import { useVitalsTemplate } from './useVitalsTemplate';
import { useUpdateVitalValues } from './useUpdateVitalValues';
// Render từng trường trong form
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
// Component chính load + save form
export function MedicalRecordFormLoader({
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

  const { fetchVitalsForm } = useVitalsTemplate();
  const { updateVitals } = useUpdateVitalValues();

  // Load dữ liệu
  useEffect(() => {
    const loadData = async () => {
      if (!templateId || !medicalRecordId) return;
      setLoading(true);
      try {
        const groups = await fetchVitalsForm(templateId, medicalRecordId);
        setQuestions(groups);
      } catch (err) {
        setSnackbar?.({ open: true, severity: 'error', message: 'Lỗi khi load form bệnh án' });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [templateId, medicalRecordId]);

  // Save dữ liệu (chỉ gọi hook)
const handleSave = async (medicalRecordId, values) => {
  try {
    await updateVitals(medicalRecordId, values, questions, currentStaff.id);
    setSnackbar?.({ open: true, severity: 'success', message: 'Lưu thành công!' });
  } catch (err) {
    console.error('Lỗi save form:', err.response?.data || err.message || err);
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

