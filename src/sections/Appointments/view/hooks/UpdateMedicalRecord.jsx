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
import {
  Accordion, AccordionSummary, AccordionDetails
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { RecordCreateButtons } from 'src/sections/medicalRecordStaff/create/Record-create-button.jsx';
import axiosInstance from 'src/lib/axios.js';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { useSnackbar } from 'notistack';
import { useVitalsTemplate } from './useVitalsTemplate';
import { useUpdateVitalValues } from './useUpdateVitalValues';

// Render từng trường trong form
function QuestionRenderer({ indicator, value, onChange }) {
  // --- Parser chung cho các tùy chọn ---
  const parseOptions = (optionsArray) =>
    (optionsArray || [])
      .filter(Boolean)
      .map((optStr) => {
        let optValue = optStr,
          optLabel = optStr;
        if (optStr.includes(".")) {
          const parts = optStr.split(".");
          optValue = parts[0];
          optLabel = parts.slice(1).join(".");
        }
        return { value: optValue, label: optLabel };
      });

  switch (indicator.valueType) {
    // --- Multiple Choice (Checkbox) ---
    case "multi_selection": {
      const options = parseOptions(indicator.valueOptions);
      const selectedValues = Array.isArray(value) ? value : [];

      const handleCheckboxChange = (event) => {
        const { value: checkboxValue, checked } = event.target;
        const newSelectedValues = checked
          ? [...selectedValues, checkboxValue]
          : selectedValues.filter((v) => v !== checkboxValue);
        onChange(indicator.id, newSelectedValues);
      };

      return (
        <FormControl component="fieldset" margin="normal" fullWidth>
          <FormLabel component="legend">{indicator.name}</FormLabel>
          <FormGroup row>
            {options.map((optionObj) => (
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

    // --- Single Choice (Radio) ---
    case "selection": {
      const options = parseOptions(indicator.valueOptions);
      const handleChange = (event) =>
        onChange(indicator.id, event.target.value);
      return (
        <FormControl component="fieldset" margin="normal" fullWidth>
          <FormLabel component="legend">{indicator.name}</FormLabel>
          <RadioGroup
            row
            name={indicator.code || `indicator-${indicator.id}`}
            value={value || ""}
            onChange={handleChange}
          >
            {options.map((optionObj) => (
              <FormControlLabel
                key={`${optionObj.value}-${optionObj.label}`}
                value={optionObj.value}
                control={<Radio />}
                label={optionObj.label}
              />
            ))}
          </RadioGroup>
        </FormControl>
      );
    }

    // --- Boolean (true/false) ---
    case "bool": {
      const handleChange = (event) =>
        onChange(indicator.id, event.target.checked);
      return (
        <FormControlLabel
          control={<Checkbox checked={!!value} onChange={handleChange} />}
          label={indicator.name}
        />
      );
    }

    // --- Dropdown (Select) ---
    case "dropdown": {
      const options = parseOptions(indicator.valueOptions);
      const handleChange = (event) => onChange(indicator.id, event.target.value);
      return (
        <FormControl fullWidth margin="normal">
          <FormLabel>{indicator.name}</FormLabel>
          <Select
            value={value || ""}
            onChange={handleChange}
            displayEmpty
          >
            {options.map((optionObj) => (
              <MenuItem key={optionObj.value} value={optionObj.value}>
                {optionObj.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    // --- Date (full_date) ---
    case "full_date": {
      const handleChange = (event) => onChange(indicator.id, event.target.value);
      return (
        <TextField
          key={indicator.id}
          fullWidth
          margin="normal"
          type="date"
          label={indicator.name}
          value={value || ""}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
        />
      );
    }

    // --- Number ---
    case "number": {
      const handleChange = (event) => onChange(indicator.id, event.target.value);
      return (
        <TextField
          key={indicator.id}
          fullWidth
          margin="normal"
          type="number"
          label={indicator.name}
          value={value || ""}
          onChange={handleChange}
          helperText={indicator.unit || ""}
        />
      );
    }

    // --- Default text ---
    default: {
      const handleChange = (event) =>
        onChange(indicator.id, event.target.value);

      // fix [object Object]
      let displayValue = value;
      if (typeof displayValue === "object" && displayValue !== null) {
        displayValue = ""; // hoặc JSON.stringify(displayValue) nếu debug
      }

      return (
        <TextField
          key={indicator.id}
          fullWidth
          margin="normal"
          type="text"
          label={indicator.name || `Chỉ số ${indicator.id}`}
          variant="outlined"
          helperText={indicator.unit || ""}
          value={displayValue || ""}
          onChange={handleChange}
        />
      );
    }
  }
}


// Modal hiển thị form bệnh án
function VitalsFormModal({
  open, onClose,  questionGroups , loading, onSave,
  medicalRecordId, appointment
}) {
  console.log('questionGroup:', questionGroups)
  const [formValues, setFormValues] = useState({});
  const [formData, setFormData] = useState({
    diagnosis:  'Chưa có chẩn đoán',
    symptoms:  'Chưa có triệu chứng',
    notes:  'Chưa có ghi chú',
  });
   const { enqueueSnackbar } = useSnackbar();
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
    {`Hồ sơ của: ${ appointment?.patient?.fullname || ''}`}
    <IconButton onClick={onClose}><CloseIcon /></IconButton>
  </DialogTitle>

  <DialogContent dividers>
    {/* <RecordCreateButtons onTemplateSelect={() => {}} /> */}

    {/* <Accordion sx={{ mt: 3,color: 'primary.main', border: '1px solid', borderColor: 'primary.main' }}>
  <AccordionSummary
    expandIcon={<ExpandMoreIcon />}
    aria-controls="clinical-info-content"
    id="clinical-info-header"
  >
    <Typography variant="subtitle1" fontWeight={600}>
      Thông tin lâm sàng
    </Typography>
  </AccordionSummary>
  <AccordionDetails>
    <Stack spacing={2}>
      <TextField
        label="Triệu chứng"
        fullWidth
        multiline
        minRows={2}
        value={formData.symptoms}
        onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
      />

      <TextField
        label="Chẩn đoán"
        fullWidth
        multiline
        minRows={2}
        value={formData.diagnosis}
        onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
      />

      <TextField
        label="Ghi chú"
        fullWidth
        multiline
        minRows={2}
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
      />

      <Button
        variant="outlined"
        onClick={handleUpdateInfo}
      >
        Cập nhật thông tin
      </Button>
    </Stack>
  </AccordionDetails>
    </Accordion> */}

    {loading && (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
        <CircularProgress />
      </Box>
    )}

   {!loading && questionGroups.length > 0 && (
  <Box sx={{ mt: 2 }}>
    {questionGroups.map(group => (
      <Box key={group.id} sx={{ mb: 4 }}>
        {/* tiêu đề nhóm */}
        <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>
          {group.name}
        </Typography>

        {/* danh sách indicators trong nhóm */}
        <Stack spacing={2}>
          {group.indicators.map(indicator => (
            <QuestionRenderer
              key={indicator.id}
              indicator={indicator}
              value={formValues[indicator.id] || ''}
              onChange={handleValueChange}
            />
          ))}
        </Stack>
      </Box>
    ))}
  </Box>
)}


    {!loading && questionGroups.length === 0 && (
      <Typography color="text.secondary" sx={{ py: 5, textAlign: 'center' }}>
        Chưa chọn template hoặc không có câu hỏi nào.
      </Typography>
    )}
  </DialogContent>

  <DialogActions>
    <Button onClick={onClose}>Hủy</Button>
    <Button
      variant="contained"
      onClick={handleSave}
      disabled={loading || questionGroups.length === 0}
    >
      Lưu hồ sơ
    </Button>
  </DialogActions>
</Dialog>

  );
}

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
  const [questionGroups, setQuestions] = useState([]);


  const { fetchVitalsForm } = useVitalsTemplate();
  const { updateVitals } = useUpdateVitalValues();

  // Load dữ liệu
  useEffect(() => {
    const loadData = async () => {
      if (!templateId || !medicalRecordId) return;
      setLoading(true);
      try {
        const groups = await fetchVitalsForm(templateId, medicalRecordId);
        // console.log("questionGroups in VitalsFormModal:", questionGroups);
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
const handleSave = async (medicalRecordId, updatedValues) => {
  
  if (!medicalRecordId) return;

  try {
    // --- Format dữ liệu để gửi backend ---
    const formattedValues = Object.entries(updatedValues)
      .filter(([, value]) => {
        if (Array.isArray(value)) return value.length > 0; // giữ array không rỗng
        return value !== '' && value !== null && value !== undefined;
      })
      .map(([indicatorId, value]) => {
        const idAsNumber = parseInt(indicatorId, 10);
        let finalValue = value;

        const originalIndicator = questionGroups.find(q => q.id === idAsNumber);

        if (originalIndicator) {
          // chuyển số string -> number
          if (originalIndicator.valueType === 'number' && typeof value === 'string') {
            finalValue = parseFloat(value);
          }

          // multi_selection thì giữ nguyên array
          if (originalIndicator.valueType === 'multi_selection' && !Array.isArray(value)) {
            finalValue = [String(value)];
          }

          // radio/selection thì ép kiểu string
          if (originalIndicator.valueType === 'selection' && typeof value !== 'string') {
            finalValue = String(value);
          }
        }

        return {
          vitalIndicatorId: idAsNumber,
          value: { value: finalValue },
          note: ""
        };
      });

    if (formattedValues.length === 0) {
      setSnackbar?.({ open: true, severity: 'info', message: 'Không có thay đổi nào để lưu.' });
      return;
    }

    // --- Gửi dữ liệu lên backend ---
    await updateVitalMedicalRecordeById(medicalRecordId, { vitalValues: formattedValues });

    setSnackbar?.({ open: true, severity: 'success', message: 'Cập nhật chỉ số thành công!' });
  } catch (err) {
    console.error('Lỗi khi lưu chỉ số:', err);
    const backendMessage = err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
    setSnackbar?.({ open: true, severity: 'error', message: backendMessage });
  }

};


  return (
   <VitalsFormModal
  open={open}
  onClose={onClose}
  loading={loading}
  questionGroups={questionGroups} // 👈 đổi tên prop cho đúng
  onSave={handleSave}
  medicalRecordId={medicalRecordId}
  appointment={appointment}
/>

  );
}

