'use client';

import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  CircularProgress, Box, Typography, TextField, Stack,
  Stepper, Step, StepLabel
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { useMedicalRecordForm } from '../hooks/useMedicalRecordForm'; 
import { FormIndicator } from './FormIndicator';

export function MedicalRecordFormModal({open, onClose, templateId, templateName }) {
  const {
    loading, error, vitalGroups, initialFormData, formData, activeStep, doctorProfile, highestStep, templateName: fetchedTemplateName,
    handleInitialFormChange, handleInputChange, handleNext, handleBack, handleSubmit, handleStepClick,
  } = useMedicalRecordForm(templateId);
  
  const steps = [{ name: 'Thông tin chung' }, ...vitalGroups];
  const currentGroup = vitalGroups[activeStep - 1];
  const isLastStep = activeStep === steps.length - 1;
  const isInitialFormValid = initialFormData.patientId;
  console.log('steps', steps);
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" scroll="paper">
      <DialogTitle variant="h5">{(fetchedTemplateName || templateName) ? `Bệnh án: ${fetchedTemplateName || templateName}` : 'Tạo bệnh án'}</DialogTitle>
      
      {loading && vitalGroups.length === 0 ? (
        <DialogContent sx={{ height: '65vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress /><Typography sx={{ mt: 2 }}>Đang tải...</Typography>
          </Box>
        </DialogContent>
      ) : error && vitalGroups.length === 0 ? (
        <DialogContent sx={{ height: '65vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
              <ErrorOutlineIcon color="error" sx={{ fontSize: 48 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>Đã xảy ra lỗi</Typography>
              <Typography color="text.secondary">{error}</Typography>
          </Box>
        </DialogContent>
      ) : (
        <>
          <Box sx={{ px: 3, pt: 1, borderBottom: 1, borderColor: 'divider' }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((step, index) => {
                const isStepDisabled = index > highestStep;
                return (
                  <Step 
                    key={step.name} 
                    onClick={() => !isStepDisabled && handleStepClick(index)}
                    sx={{ cursor: isStepDisabled ? 'not-allowed' : 'pointer' }}
                  >
                    <StepLabel 
                      sx={{ '& .MuiStepLabel-label': { fontSize: '12px', fontWeight: 500 }}}
                      style={{ opacity: isStepDisabled ? 0.7 : 1 }}
                    >
                      {step.name}
                    </StepLabel>
                  </Step>
                );
              })}
            </Stepper>
          </Box>

          <DialogContent dividers sx={{ height: '60vh', maxHeight: '750px' }}>
            {error && isLastStep && (
                <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
            )}
            {activeStep === 0 ? (
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <Typography variant="h6">Thông tin chung</Typography>
                  <TextField label="Loại bệnh án" variant="filled" disabled value={fetchedTemplateName || templateName || ''} />
                  <TextField label="Bác sĩ phụ trách" variant="filled" disabled value={doctorProfile?.fullname || ''} />
                  <TextField label="ID bệnh nhân" type="number" value={initialFormData.patientId} onChange={(e) => handleInitialFormChange('patientId', e.target.value)} />
                  <TextField label="ID cuộc hẹn (Tùy chọn)" type="number" value={initialFormData.appointmentId} onChange={(e) => handleInitialFormChange('appointmentId', e.target.value)} />
                  <TextField label="Chẩn đoán" value={initialFormData.diagnosis} onChange={(e) => handleInitialFormChange('diagnosis', e.target.value)} />
                  <TextField label="Triệu chứng" multiline rows={3} value={initialFormData.symptoms} onChange={(e) => handleInitialFormChange('symptoms', e.target.value)} />
                  <TextField label="Ghi chú" multiline rows={3} value={initialFormData.notes} onChange={(e) => handleInitialFormChange('notes', e.target.value)} />
                </Stack>
            ) : (
              currentGroup && (
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {currentGroup.indicators.map(indicator => (
                    <FormIndicator key={indicator.id} indicator={indicator} formData={formData} onInputChange={handleInputChange} />
                  ))}
                </Stack>
              )
            )}
          </DialogContent>
        </>
      )}
      
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={onClose} disabled={loading}>
          {error && vitalGroups.length === 0 ? "Đóng" : "Hủy"}
        </Button>
        {!loading && !(error && vitalGroups.length === 0) && (
            <>
                <Box sx={{ flex: '1 1 auto' }} />
                <Button onClick={handleBack} disabled={activeStep === 0 || loading}>Quay lại</Button>
                {isLastStep ? (
                  <Button onClick={() => handleSubmit(onClose)} variant="contained" disabled={loading}>
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Xác nhận'}
                  </Button>
                ) : (
                  <Button onClick={handleNext} variant="contained" disabled={activeStep === 0 && !isInitialFormValid}>
                    Tiếp theo
                  </Button>
                )}
            </>
        )}
      </DialogActions>
    </Dialog>
  );
}