'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMedicalRecordForm } from './hooks/useMedicalRecordForm';
import { 
    Box, Button, Container, CircularProgress, Paper, 
    Step, StepLabel, Stepper, Typography, Stack, TextField 
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { FormIndicator } from './components/FormIndicator';

export function RecordDetailView() {
    const params = useParams();
    const router = useRouter();
    const templateID = params?.templateID;

    const { 
        loading, error, vitalGroups, templateName, 
        doctorProfile, saveMedicalRecord 
    } = useMedicalRecordForm(templateID);

    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState({
        initialInfo: { patientId: '', appointmentId: '', diagnosis: '', symptoms: '', notes: '' },
        indicatorValues: {},
    });
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateStep0 = () => {
        const { diagnosis, symptoms, notes, patientId } = formData.initialInfo;
        const errors = {};
        
        if (!patientId.trim()) errors.patientId = 'Điền ID bệnh nhân.';
        if (diagnosis.trim().length < 3) errors.diagnosis = '+3 ký tự.';
        if (symptoms.trim().length < 3) errors.symptoms = '+3 ký tự.';
        if (notes.trim().length < 3) errors.notes = '+3 ký tự.';
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNext = () => {
        if (activeStep === 0) {
            if (validateStep0()) {
                setActiveStep(prev => prev + 1);
            }
        } else {
            setActiveStep(prev => prev + 1);
        }
    };

    const handleBack = () => setActiveStep(prev => Math.max(prev - 1, 0));
    const handleStepClick = (step) => setActiveStep(step);

    const handleInitialInfoChange = (field, value) => {
        setFormData(prev => ({ ...prev, initialInfo: { ...prev.initialInfo, [field]: value } }));
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleIndicatorChange = (fieldCode, value) => {
        setFormData(prev => ({ ...prev, indicatorValues: { ...prev.indicatorValues, [fieldCode]: value } }));
    };
  
    const handleSubmit = async () => {
        if (!validateStep0()) {
            alert("Vui lòng kiểm tra lại thông tin ở bước 1.");
            setActiveStep(0);
            return;
        }

        setIsSubmitting(true);
        try {
            await saveMedicalRecord(formData.initialInfo, formData.indicatorValues);
            alert('Tạo và cập nhật bệnh án thành công!');
            router.push('/dashboard');
        } catch (err) {
            console.error("Lỗi khi lưu bệnh án:", err);
            alert(`Đã xảy ra lỗi: ${err.message || 'Vui lòng thử lại.'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const steps = [{ name: 'Thông tin chung' }, ...vitalGroups];
    const isLastStep = activeStep === steps.length - 1;

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress /> <Typography sx={{ ml: 2 }}>Đang tải...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    return (
        <Container maxWidth="md" sx={{ my: 4 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
                <Button variant="contained" color="secondary" startIcon={<ArrowBackIcon />} onClick={() => router.push('/dashboard')}>
                    Quay lại trang trước
                </Button>
            </Box>
      
            <Paper elevation={2} sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h4" component="h1" gutterBottom align="center">
                    {templateName || 'Tạo Bệnh án'}
                </Typography>

                <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                    {steps.map((step, index) => (
                        <Step key={step.name} onClick={() => handleStepClick(index)} sx={{ cursor: 'pointer' }}>
                            <StepLabel>{step.name}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
        
                <Box sx={{ minHeight: '400px', p: 2 }}>
                    {activeStep === 0 ? (
                        <Stack spacing={2}>
                            <Typography variant="h6">Thông tin chung</Typography>
                            <TextField label="Loại bệnh án" variant="filled" disabled value={templateName || ''} />
                            <TextField label="Bác sĩ phụ trách" variant="filled" disabled value={doctorProfile?.fullname || ''} />
                            <TextField 
                                label="ID bệnh nhân" 
                                required 
                                value={formData.initialInfo.patientId} 
                                onChange={(e) => handleInitialInfoChange('patientId', e.target.value)}
                                error={!!formErrors.patientId}
                                helperText={formErrors.patientId}
                            />
                            <TextField 
                                label="Chẩn đoán" 
                                required 
                                value={formData.initialInfo.diagnosis} 
                                onChange={(e) => handleInitialInfoChange('diagnosis', e.target.value)}
                                error={!!formErrors.diagnosis}
                                helperText={formErrors.diagnosis || "Bắt buộc, ít nhất 3 ký tự"}
                            />
                            <TextField 
                                label="Triệu chứng" 
                                multiline rows={3} 
                                required 
                                value={formData.initialInfo.symptoms} 
                                onChange={(e) => handleInitialInfoChange('symptoms', e.target.value)}
                                error={!!formErrors.symptoms}
                                helperText={formErrors.symptoms || "Bắt buộc, ít nhất 3 ký tự"}
                            />
                            <TextField 
                                label="Ghi chú" 
                                multiline rows={3} 
                                required 
                                value={formData.initialInfo.notes} 
                                onChange={(e) => handleInitialInfoChange('notes', e.target.value)}
                                error={!!formErrors.notes}
                                helperText={formErrors.notes || "Bắt buộc, ít nhất 3 ký tự"}
                            />
                        </Stack>
                    ) : (
                        (() => {
                            const currentGroup = vitalGroups[activeStep - 1];
                            if (!currentGroup) return <Typography>Nhóm chỉ số không hợp lệ.</Typography>;

                            return (
                                <Stack spacing={3}>
                                    <Typography variant="h6">{currentGroup.name}</Typography>
                                    {currentGroup.indicators.map(indicator => (
                                        <FormIndicator
                                            key={indicator.id}
                                            indicator={indicator}
                                            formData={formData.indicatorValues}
                                            onInputChange={handleIndicatorChange}
                                        />
                                    ))}
                                </Stack>
                            );
                        })()
                    )}
                </Box>
        
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 2, borderTop: '1px solid #ddd' }}>
                    <Button disabled={activeStep === 0 || isSubmitting} onClick={handleBack}>Quay lại</Button>
                    {isLastStep ? (
                        <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Hoàn tất & Lưu'}
                        </Button>
                    ) : (
                        <Button variant="contained" onClick={handleNext}>Tiếp theo</Button>
                    )}
                </Box>
            </Paper>
        </Container>
    );
}