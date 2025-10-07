// src/app/record/[id]/page.js

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  Container, Box, Stepper, Step, StepLabel, Button, Typography, CircularProgress, Alert,
  Paper, Stack, TextField
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { getMedicalRecordTemplateById } from 'src/api/medical-record-templates-staff';
import { getVitalGroupById } from 'src/api/vitals';
import { createMedicalRecord, updateVitalMedicalRecordeById } from 'src/api/medical-record-staff';
import { getStaffProfile } from 'src/api/auth/owner';
import { paths } from 'src/routes/paths';

// TẤT CẢ RENDER CÂU HỎI ĐÃ TÁCH SANG FILE NÀY
import { QuestionGroupRenderer } from './components/QuestionRenderers';

const EPISODE_CODES = new Set(['QUES4CTN', 'QUES4MT1']);
const EPISODE_IDS   = new Set([175, 64]);

export function RecordDetailView() {
  const router = useRouter();
  const params = useParams();
  const templateIdFromUrl = params.templateID;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const [vitalGroups, setVitalGroups] = useState([]);
  const [staffProfile, setStaffProfile] = useState(null);
  const [templateName, setTemplateName] = useState('');

  const [initialErrors, setInitialErrors] = useState({
    patientId: '', diagnosis: '', symptoms: ''
  });

  const [formData, setFormData] = useState({
    initialInfo: {
      patientId: '',
      doctorId: null,
      diagnosis: '',
      symptoms: '',
      notes: '',
      templateId: templateIdFromUrl,
      vitalValues: [null],
    },
    vitalValues: {},
  });

  // State điều kiện (điều khiển group) — chỉ lưu giá trị string người dùng chọn
  const [selectedQ192, setSelectedQ192] = useState(null); // template 16, group 12
  const [selectedQ62,  setSelectedQ62]  = useState(null); // template 17, group 27

  const isAcuteTemplate    = parseInt(templateIdFromUrl, 10) === 16; // 12/18
  const isChronic1Template = parseInt(templateIdFromUrl, 10) === 17; // 27/28

  const TEMPLATE_OPTIONS = {
    16: 'Bệnh án cấp tính',
    17: 'Bệnh án mãn tính lần 1',
    18: 'Bệnh án mãn tính tái khám',
  };

  // ---------- Fetch ----------
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      if (!templateIdFromUrl) {
        if (!cancelled) { setError('Không tìm thấy ID bệnh án trong URL.'); setLoading(false); }
        return;
      }

      try {
        if (!cancelled) { setLoading(true); setError(null); }

        const [profileRes, templateRes] = await Promise.all([
          getStaffProfile(),
          getMedicalRecordTemplateById(templateIdFromUrl),
        ]);
        if (cancelled) return;

        setStaffProfile(profileRes?.data || null);
        setFormData(prev => ({
          ...prev,
          initialInfo: {
            ...prev.initialInfo,
            doctorId: profileRes?.data?.id ?? null,
            templateId: templateIdFromUrl,
          },
        }));

        const { vitalGroupIds = [], name = '' } = templateRes?.data || {};
        setTemplateName(name);

        const orderedIds = Array.from(new Set(vitalGroupIds)).filter(Boolean);
        const groupResults = await Promise.all(
          orderedIds.map(async (id) => {
            try {
              const res = await getVitalGroupById(id);
              return res?.data ?? null;
            } catch {
              return null;
            }
          })
        );
        if (cancelled) return;

        const groups = groupResults.filter(Boolean);
        setVitalGroups(groups);

        // reset điều kiện khi đổi template
        setSelectedQ192(null);
        setSelectedQ62(null);

      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Không thể tải dữ liệu bệnh án. Vui lòng thử lại.');
          console.error(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [templateIdFromUrl]);

  // ---------- Helpers ----------
  const indicatorMap = useMemo(() => {
    const m = {};
    vitalGroups.forEach((g) => g.indicators.forEach((ind) => (m[ind.id] = ind)));
    return m;
  }, [vitalGroups]);

  const handleInitialInfoChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      initialInfo: { ...prev.initialInfo, [name]: value },
    }));
    if (initialErrors[name]) setInitialErrors((s) => ({ ...s, [name]: '' }));
  };

  const onChangeAnswer = useCallback((indicatorId, valueObj) => {
    // valueObj = { value: any, note?: string }
    setFormData((prev) => ({
      ...prev,
      vitalValues: { ...prev.vitalValues, [indicatorId]: valueObj },
    }));
  }, []);

  const handleNext = useCallback(() => setActiveStep((p) => p + 1), []);
  const handleBack = useCallback(() => setActiveStep((p) => p - 1), []);

  const validateInitialInfo = () => {
    const errs = {
      patientId: formData.initialInfo.patientId ? '' : 'Bắt buộc',
      diagnosis: formData.initialInfo.diagnosis?.trim() ? '' : 'Bắt buộc',
      symptoms: formData.initialInfo.symptoms?.trim() ? '' : 'Bắt buộc',
    };
    setInitialErrors(errs);
    return !errs.patientId && !errs.diagnosis && !errs.symptoms;
  };

  // ---------- Serialize for API ----------
  const isNilOrEmpty = (v) =>
    v === undefined ||
    v === null ||
    (typeof v === 'string' && v.trim() === '') ||
    (Array.isArray(v) && v.length === 0) ||
    (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);

  const sanitizeValue = (v) => {
    if (v instanceof File) return v.name;
    if (Array.isArray(v)) return v.map(sanitizeValue);
    if (v && typeof v === 'object') {
      const out = {};
      Object.keys(v).forEach((k) => (out[k] = sanitizeValue(v[k])));
      return out;
    }
    return v;
  };

  const innerOfNormalIndicator = (data) => {
    const inner = sanitizeValue(data?.value);
    if (isNilOrEmpty(inner)) return null;
    return inner;
  };

  // mapping “bằng tay” cho QUES4CTN/QUES4MT1 (id 175/64)
  const innerOfEpisodeQuestion = (indicator, stored) => {
    const groups = Array.isArray(indicator.valueOptions?.group)
      ? indicator.valueOptions.group
      : [];
    if (!groups.length) return null;

    const raw = stored?.value || {};
    const mappedGroups = groups.map((group) => {
      const label = group.label;
      const fields = (group.field || []).map((f) => ({
        label: f.label,
        type: f.type,
        value: raw?.[label]?.[f.label] ?? null,
      }));
      return { label, field: fields };
    });

    const cleaned = mappedGroups.filter(
      (g) => g.field.some((f) => f.value !== null && f.value !== '')
    );

    if (!cleaned.length) return null;
    return cleaned;
  };

  const innerForApi = (indicator, stored) => {
    if (!indicator) return null;
    if (EPISODE_IDS.has(indicator.id) || EPISODE_CODES.has(indicator.code)) {
      return innerOfEpisodeQuestion(indicator, stored);
    }
    return innerOfNormalIndicator(stored);
  };

  // ---------- Filter groups by controller answers ----------
  const filteredVitalGroups = useMemo(() => {
    let groups = vitalGroups;

    if (isAcuteTemplate) {
      // 16: 12 & 18
      const allow18 = selectedQ192 === 'Phù mạch' || selectedQ192 === 'Cả hai' || selectedQ192 === 'Khác';
      groups = groups.filter(g => (g.id === 18 ? allow18 : true));
    }

    if (isChronic1Template) {
      // 17: 27 & 28
      const allow28 = selectedQ62 === 'Phù mạch' || selectedQ62 === 'Cả hai' || selectedQ62 === 'Khác';
      groups = groups.filter(g => (g.id === 28 ? allow28 : true));
    }

    return groups;
  }, [vitalGroups, isAcuteTemplate, selectedQ192, isChronic1Template, selectedQ62]);

  // ---------- Steps ----------
  const steps = [...filteredVitalGroups.map(g => g.name), 'Thông tin bệnh án'];

  // không tự nhảy về đầu khi steps thay đổi
  useEffect(() => {
    const totalSteps = filteredVitalGroups.length + 1;
    setActiveStep(prev => (prev >= totalSteps ? Math.max(0, totalSteps - 1) : prev));
  }, [filteredVitalGroups.length]);

  // ---------- Submit ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!validateInitialInfo()) {
      setError('Vui lòng nhập đầy đủ Mã bệnh nhân, Chẩn đoán và Triệu chứng.');
      setIsSubmitting(false);
      return;
    }

    try {
      const { patientId, doctorId, diagnosis, symptoms, notes, templateId } = formData.initialInfo;

      const createPayload = {
        patientId: parseInt(patientId, 10),
        doctorId,
        templateId: parseInt(templateId, 10),
        diagnosis,
        symptoms,
        ...(notes ? { notes } : {}),
        vitalValues: [null],
      };

      const createResponse = await createMedicalRecord(createPayload);
      const newId = createResponse.data?.id;
      if (!newId) throw new Error('Không nhận được ID bệnh án sau khi tạo.');

      const formattedVitalValues = [];
      for (const [id, data] of Object.entries(formData.vitalValues)) {
        const indicator = indicatorMap[Number(id)];
        const inner = innerForApi(indicator, data);
        if (inner === null) continue;

        formattedVitalValues.push({
          vitalIndicatorId: parseInt(id, 10),
          value: { value: inner }, // luôn bọc theo mẫu API
          note: data?.note || '',
        });
      }

      if (formattedVitalValues.length) {
        await updateVitalMedicalRecordeById(newId, { vitalValues: formattedVitalValues });
      }

      alert('Tạo và cập nhật bệnh án thành công!');
      router.push(`${paths.dashboard.medicalRecordStaff.create}`);
    } catch (err) {
      setError(err.message || 'Đã có lỗi xảy ra khi lưu bệnh án.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------- Render ----------
  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Container>
    );
  }

  const renderStepContent = (step) => {
    // Bước cuối: Thông tin bệnh án
    if (step === steps.length - 1) {
      return (
        <Stack spacing={3}>
          <TextField
            fullWidth
            label="Mẫu bệnh án"
            value={{16:'Bệnh án cấp tính',17:'Bệnh án mãn tính lần 1',18:'Bệnh án mãn tính tái khám'}[formData.initialInfo.templateId] || ''}
            InputProps={{ readOnly: true }}
            variant="filled"
          />
          <TextField label="Tên bác sĩ phụ trách" value={staffProfile?.fullname || ''} InputProps={{ readOnly: true }} variant="filled" />
          <TextField label="Mã bệnh nhân" name="patientId" type="number" value={formData.initialInfo.patientId} onChange={handleInitialInfoChange} required error={Boolean(initialErrors.patientId)} helperText={initialErrors.patientId} />
          <TextField label="Chẩn đoán" name="diagnosis" multiline rows={3} value={formData.initialInfo.diagnosis} onChange={handleInitialInfoChange} required error={Boolean(initialErrors.diagnosis)} helperText={initialErrors.diagnosis} />
          <TextField label="Triệu chứng" name="symptoms" multiline rows={3} value={formData.initialInfo.symptoms} onChange={handleInitialInfoChange} required error={Boolean(initialErrors.symptoms)} helperText={initialErrors.symptoms} />
          <TextField label="Ghi chú" name="notes" multiline rows={2} value={formData.initialInfo.notes} onChange={handleInitialInfoChange} />
        </Stack>
      );
    }

    const group = filteredVitalGroups[step];
    if (!group) return null;

    // Toàn bộ render câu hỏi của 1 group đã tách sang QuestionRenderers.jsx
    return (
      <QuestionGroupRenderer
        group={group}
        templateId={parseInt(templateIdFromUrl, 10)}
        values={formData.vitalValues}
        onChangeAnswer={onChangeAnswer}
        selectedQ192={selectedQ192}
        selectedQ62={selectedQ62}
        onSelectQ192={setSelectedQ192}
        onSelectQ62={setSelectedQ62}
      />
    );
  };

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(`${paths.dashboard.medicalRecordStaff.create}`)}>Trang chủ</Button>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1, textAlign: 'center' }}>
          Tạo bệnh án: {templateName}
        </Typography>
      </Box>

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label, i) => (
          <Step key={`${label}-${i}`}>
            <StepLabel onClick={() => setActiveStep(i)} sx={{ cursor: 'pointer' }}>
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" gutterBottom>{steps[activeStep]}</Typography>
        {error && <Alert severity="error" sx={{ mb: 3, mt: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          {renderStepContent(activeStep)}
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button variant="outlined" disabled={activeStep === 0 || isSubmitting} onClick={() => setActiveStep((p) => p - 1)}>Quay lại</Button>
        {activeStep < steps.length - 1 ? (
          <Button variant="contained" onClick={() => setActiveStep((p) => p + 1)}>Tiếp theo</Button>
        ) : (
          <Button variant="contained" color="success" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Hoàn tất và Lưu'}
          </Button>
        )}
      </Box>
    </Container>
  );
}
