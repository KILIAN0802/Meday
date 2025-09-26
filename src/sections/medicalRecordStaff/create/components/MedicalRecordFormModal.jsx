'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  CircularProgress, Box, Typography, Stack,
  Stepper, Step, StepLabel
} from '@mui/material';

import { getMedicalRecordTemplateById } from 'src/api/medical-record-templates-staff';
import { getVitalGroupById } from 'src/api/vitals';

import { FormIndicator } from './FormIndicator';

export function MedicalRecordFormModal({ open, onClose, templateId }) {
  const [loading, setLoading] = useState(false);
  const [templateInfo, setTemplateInfo] = useState(null);
  const [vitalGroups, setVitalGroups] = useState([]);
  const [formData, setFormData] = useState({});
  const [activeStep, setActiveStep] = useState(0);

  const fetchData = useCallback(async () => {
    if (!templateId) return;
    setLoading(true);
    setVitalGroups([]);
    setFormData({});
    setActiveStep(0);
    try {
      const templateRes = await getMedicalRecordTemplateById(templateId);
      const templateData = templateRes.data;
      setTemplateInfo(templateData);

      const groupPromises = templateData.vitalGroupIds.map(id => getVitalGroupById(id));
      const groupResponses = await Promise.all(groupPromises);
      const detailedGroups = groupResponses.map(res => res.data);
      setVitalGroups(detailedGroups);
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết form bệnh án:", error);
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, fetchData]);

  const handleInputChange = (indicatorId, value) => {
    setFormData(prev => ({ ...prev, [indicatorId]: value }));
  };
  
  const handleNext = () => setActiveStep(prev => prev + 1);
  const handleBack = () => setActiveStep(prev => prev - 1);
  
  const handleSubmit = () => {
    console.log("Dữ liệu form đã nhập:", formData);
    onClose();
  };

  const currentGroup = vitalGroups[activeStep];
  const isLastStep = activeStep === vitalGroups.length - 1;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" scroll="paper">
      <DialogTitle variant="h5">{templateInfo ? `Bệnh án: ${templateInfo.name}` : 'Đang tải...'}</DialogTitle>
      
      <Box sx={{ px: 3, pt: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {vitalGroups.map((group) => (
            <Step key={group.name}>
              <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: '12px', fontWeight: 500 }}}>
                {group.name}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      <DialogContent dividers sx={{ height: '60vh', maxHeight: '750px' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          currentGroup && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              {currentGroup.indicators.map(indicator => (
                <FormIndicator
                  key={indicator.id}
                  indicator={indicator}
                  formData={formData}
                  onInputChange={handleInputChange}
                />
              ))}
            </Stack>
          )
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={onClose}>Hủy</Button>
        <Box sx={{ flex: '1 1 auto' }} />
        <Button onClick={handleBack} disabled={activeStep === 0}>
          Quay lại
        </Button>
        {isLastStep ? (
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            Xác nhận
          </Button>
        ) : (
          <Button onClick={handleNext} variant="contained" disabled={loading || !vitalGroups.length}>
            Tiếp theo
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}