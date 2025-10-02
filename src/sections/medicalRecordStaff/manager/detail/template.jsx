'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Container,
  CircularProgress,
  Paper,
  Typography,
  LinearProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { useMedicalRecordForm } from './hooks/useMedicalRecordForm';
import { GeneralInfoStep } from './components/GeneralInfoStep';
import { IndicatorStep } from './components/IndicatorStep';
import { paths } from 'src/routes/paths';

export function RecordDetailView() {
  const params = useParams();
  const router = useRouter();
  const templateID = params?.templateID;

  const {
    loading,
    error,
    vitalGroups,
    templateName,
    doctorProfile,
    saveMedicalRecord,
  } = useMedicalRecordForm(templateID);

  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalPayload, setFinalPayload] = useState({
    initialInfo: {
      patientId: '',
      appointmentId: '',
      diagnosis: '',
      symptoms: '',
      notes: '',
    },
    indicatorValues: {},
  });

  const steps = [{ name: 'Thông tin chung' }, ...vitalGroups];
  const isLastStep = activeStep === steps.length - 1;
  const progressValue =
    steps.length > 0 ? ((activeStep + 1) / steps.length) * 100 : 0;

  const handleGeneralInfoComplete = (step1Data) => {
    setFinalPayload((prev) => ({ ...prev, initialInfo: step1Data }));
    setActiveStep(1);
  };

  const handleIndicatorChange = (indicatorId, value) => {
    setFinalPayload((prev) => ({
      ...prev,
      indicatorValues: {
        ...prev.indicatorValues,
        [indicatorId]: value,
      },
    }));
  };
  const handleBack = () => setActiveStep((prev) => Math.max(prev - 1, 0));
  const handleNext = () =>
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await saveMedicalRecord(
        finalPayload.initialInfo,
        finalPayload.indicatorValues
      );
      alert('Tạo và cập nhật bệnh án thành công!');
      router.push(`${paths.dashboard.medicalRecordStaff.create}`);
    } catch (err) {
      console.error('Lỗi khi lưu bệnh án:', err);
      alert(`Đã xảy ra lỗi: ${err.message || 'Vui lòng thử lại.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80vh',
        }}
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Đang tải...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80vh',
        }}
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<ArrowBackIcon />}
          onClick={() =>
            router.push(`${paths.dashboard.medicalRecordStaff.create}`)
          }
        >
          Quay lại trang trước
        </Button>
      </Box>

      <Paper elevation={2} sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          {templateName || 'Tạo Bệnh án'}
        </Typography>

        <Box sx={{ mb: 4, px: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'normal' }}>
            {steps[activeStep]?.name || 'Hoàn tất'}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progressValue}
            sx={{ height: 10, borderRadius: 5, mt: 1 }}
          />
        </Box>

        <Box sx={{ minHeight: '400px', p: 2 }}>
          {activeStep === 0 && (
            <GeneralInfoStep
              initialData={finalPayload.initialInfo}
              onComplete={handleGeneralInfoComplete}
              templateName={templateName}
              doctorName={doctorProfile?.fullname}
            />
          )}

          {activeStep > 0 && (
            <IndicatorStep
              group={vitalGroups[activeStep - 1]}
              currentValues={finalPayload.indicatorValues}
              onDataChange={handleIndicatorChange}
            />
          )}
        </Box>
        {activeStep > 0 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mt: 4,
              pt: 2,
              borderTop: '1px solid #ddd',
            }}
          >
            <Button disabled={isSubmitting} onClick={handleBack}>
              Quay lại
            </Button>
            {isLastStep ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Hoàn tất & Lưu'
                )}
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext}>
                Tiếp theo
              </Button>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
}