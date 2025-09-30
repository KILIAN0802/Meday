'use client';

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress
} from '@mui/material';
import { QuestionRenderer } from '../questions/QuestionRenderer';
import { extractFinalValue } from '../../utils/dataUtils';

export function VitalsFormModal({ open, onClose, questionGroups, loading, onSave, medicalRecordId }) {
  const [formValues, setFormValues] = useState({});

  useEffect(() => {
    if (questionGroups) {
      const initialValues = {};
      questionGroups.forEach(group => {
        group.indicators.forEach(q => {
          initialValues[q.id] = q.valueType === 'multi_selection'
            ? (Array.isArray(q.savedValue) ? q.savedValue : [])
            : extractFinalValue(q.savedValue);
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
            {questionGroups.map((group) => (
              <Box key={group.id} sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>{group.name}</Typography>
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