'use client';

import { useState } from 'react';
import { Stack, Typography, TextField, Button, Box } from '@mui/material';

export function GeneralInfoStep({ initialData, onComplete, templateName, doctorName }) {
  const [data, setData] = useState(initialData);
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const { diagnosis, symptoms, notes, patientId } = data;
    const newErrors = {};

    if (!patientId.trim()) newErrors.patientId = 'Vui lòng điền ID bệnh nhân.';
    if (!diagnosis || diagnosis.trim().length < 3) newErrors.diagnosis = 'Chẩn đoán phải có ít nhất 3 ký tự.';
    if (!symptoms || symptoms.trim().length < 3) newErrors.symptoms = 'Triệu chứng phải có ít nhất 3 ký tự.';
    if (!notes || notes.trim().length < 3) newErrors.notes = 'Ghi chú phải có ít nhất 3 ký tự.';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextClick = () => {
    if (validate()) {
      onComplete(data);
    }
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Thông tin chung</Typography>
      <TextField label="Loại bệnh án" variant="filled" disabled value={templateName || ''} />
      <TextField label="Bác sĩ phụ trách" variant="filled" disabled value={doctorName || ''} />
      <TextField
        label="ID bệnh nhân"
        required
        value={data.patientId}
        onChange={(e) => handleChange('patientId', e.target.value)}
        error={!!errors.patientId}
        helperText={errors.patientId}
      />
      <TextField
        label="Chẩn đoán"
        required
        value={data.diagnosis}
        onChange={(e) => handleChange('diagnosis', e.target.value)}
        error={!!errors.diagnosis}
        helperText={errors.diagnosis || "Bắt buộc, ít nhất 3 ký tự"}
      />
      <TextField
        label="Triệu chứng"
        multiline
        rows={3}
        required
        value={data.symptoms}
        onChange={(e) => handleChange('symptoms', e.target.value)}
        error={!!errors.symptoms}
        helperText={errors.symptoms || "Bắt buộc, ít nhất 3 ký tự"}
      />
      <TextField
        label="Ghi chú"
        multiline
        rows={3}
        required
        value={data.notes}
        onChange={(e) => handleChange('notes', e.target.value)}
        error={!!errors.notes}
        helperText={errors.notes || "Bắt buộc, ít nhất 3 ký tự"}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
        <Button variant="contained" onClick={handleNextClick}>
          Tiếp theo
        </Button>
      </Box>
    </Stack>
  );
}