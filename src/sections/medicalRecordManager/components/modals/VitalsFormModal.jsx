'use client';

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Dialog, DialogTitle, DialogContent, 
  DialogActions, Button, CircularProgress
} from '@mui/material';
import { FormIndicator } from 'src/sections/medicalRecordStaff/manager/detail/components/FormIndicator';

export function VitalsFormModal({ open, onClose, questionGroups, loading, onSave, medicalRecordId }) {
  const [formValues, setFormValues] = useState({});

  useEffect(() => {
    if (questionGroups) {
      const initialValues = {};
      questionGroups.forEach(group => {
        group.indicators.forEach(q => {
          if (q.savedValue !== null && typeof q.savedValue !== 'undefined') {
            initialValues[q.id] = q.savedValue;
          }
        });
      });
      setFormValues(initialValues);
    }
  }, [questionGroups, open]);

  const handleValueChange = (indicatorId, newValue) => {
    setFormValues(prev => ({ ...prev, [indicatorId]: newValue }));
  };

  const handleSave = () => {
    onSave(medicalRecordId, formValues);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Cập nhật Bệnh án</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
            <CircularProgress />
          </Box>
        ) : questionGroups.length > 0 ? (
          <Box component="form" noValidate autoComplete="off" sx={{ mt: 1 }}>
            {questionGroups.map((group) => (
              <Box key={group.id} sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>{group.name}</Typography>
                {group.indicators.map((indicator) => (
                  <Box key={indicator.id} sx={{ mb: 2 }}>
                    <FormIndicator
                      indicator={indicator}
                      formData={formValues}
                      onInputChange={handleValueChange}
                    />
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        ) : (
          <Typography sx={{ my: 5, textAlign: 'center' }}>Không tìm thấy chỉ số nào.</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>Lưu thay đổi</Button>
      </DialogActions>
    </Dialog>
  );
}