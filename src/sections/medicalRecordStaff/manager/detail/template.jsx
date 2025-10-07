// src/app/record/[id]/page.js

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  Container, Box, Stepper, Step, StepLabel, Button, Typography, CircularProgress, Alert,
  Paper, Stack, TextField, FormControl, Select, MenuItem, IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';

import { getMedicalRecordTemplateById } from 'src/api/medical-record-templates-staff';
import { getVitalGroupById } from 'src/api/vitals';
import { createMedicalRecord, updateVitalMedicalRecordeById } from 'src/api/medical-record-staff';
import { getStaffProfile } from 'src/api/auth/owner';
import { paths } from 'src/routes/paths';


const EPISODE_CODES = new Set(['QUES4CTN', 'QUES4MT1']);
const EPISODE_IDS   = new Set([175, 64]);

// =================== UI helpers ===================
function ClearableSelect({ label, value, options, onChange }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 240 }}>
      <FormControl fullWidth size="small">
        <Select
          displayEmpty
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          renderValue={(v) => (v ? v : <span style={{ color: '#9aa0a6' }}>{label}</span>)}
        >
          <MenuItem value=""><em>— Chưa chọn —</em></MenuItem>
          {(options || []).map((opt) => (
            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
          ))}
        </Select>
      </FormControl>
      {value ? (
        <IconButton size="small" aria-label="clear" onClick={() => onChange('')}>
          <CloseIcon fontSize="small" />
        </IconButton>
      ) : null}
    </Stack>
  );
}
function ClearableMultiSelect({ label, value, options, onChange }) {
  const arr = Array.isArray(value) ? value : [];
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 240 }}>
      <FormControl fullWidth size="small">
        <Select
          multiple
          displayEmpty
          value={arr}
          onChange={(e) => onChange(e.target.value)}
          renderValue={(selected) =>
            selected && selected.length ? selected.join(', ') : <span style={{ color: '#9aa0a6' }}>{label}</span>
          }
        >
          {(options || []).map((opt) => (
            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
          ))}
        </Select>
      </FormControl>
      {arr.length ? (
        <IconButton size="small" aria-label="clear" onClick={() => onChange([])}>
          <CloseIcon fontSize="small" />
        </IconButton>
      ) : null}
    </Stack>
  );
}

/* ================== Renderer riêng cho 2 câu tập đặc biệt ================== */
function EpisodeInfoRenderer({ indicator, value, onChange }) {
  const groups = Array.isArray(indicator.valueOptions?.group) ? indicator.valueOptions.group : [];
  if (!groups.length) return null;

  const MAIN_LABEL = groups[0].label || '__group_0';
  const valObj = value?.value || {};
  const mainGroup = valObj[MAIN_LABEL] || {};

  const setKV = (g, k, v) => {
    const current = value?.value || {};
    onChange({ value: { ...current, [g]: { ...(current[g] || {}), [k]: v } }, note: '' });
  };

  const setEpisodeCount = (countStr) => {
    const count = parseInt(countStr || '0', 10) || 0;
    const current = value?.value || {};
    const updated = { ...current, [MAIN_LABEL]: { ...(current[MAIN_LABEL] || {}), ['Số đợt bị']: countStr } };
    for (let i = count + 1; i <= 3; i += 1) {
      const lbl = `Thông tin đợt ${i}`;
      if (updated[lbl]) delete updated[lbl];
    }
    onChange({ value: updated, note: '' });
  };

  const fieldsMain = groups[0].field || groups[0].fields || [];
  const opt = (label) => fieldsMain.find((f) => f.label === label)?.option || [];
  const coDieuTri = mainGroup['Có điều trị hay không?'];
  const tinhTrang = mainGroup['Tình trạng tổn thương khi đang uống thuốc'];
  const daTung    = mainGroup['Trước đây bạn đã từng bị đợt nào như vậy chưa?'];
  const soDotBi   = parseInt(mainGroup['Số đợt bị'] || '0', 10) || 0;

  const renderEpisodeGroup = (group) => {
    const gKey = group.label;
    const gVal = valObj[gKey] || {};
    const flds = group.field || group.fields || [];
    const optEp = (label) => flds.find((f) => f.label === label)?.option || [];
    const epCoDieuTri = gVal['Có điều trị hay không?'];
    const epTinhTrang = gVal['Tình trạng tổn thương khi đang uống thuốc'];

    return (
      <Box key={gKey} sx={{ mt: 2, borderLeft: 3, borderColor: 'divider', pl: 2 }}>
        <Typography variant="subtitle2" gutterBottom>{gKey}</Typography>

        <ClearableSelect
          label="Có điều trị hay không?"
          value={epCoDieuTri ?? ''}
          options={optEp('Có điều trị hay không?')}
          onChange={(v) => setKV(gKey, 'Có điều trị hay không?', v)}
        />
        {epCoDieuTri === 'Có' && (
          <Stack spacing={1} sx={{ mt: 1 }}>
            <TextField
              size="small"
              label="Tên thuốc"
              value={gVal['Tên thuốc'] ?? ''}
              onChange={(e) => setKV(gKey, 'Tên thuốc', e.target.value)}
            />
            <TextField
              size="small"
              label="Liều thuốc (ghi thời gian nếu nhớ)"
              value={gVal['Liều thuốc (ghi thời gian nếu nhớ)'] ?? ''}
              onChange={(e) => setKV(gKey, 'Liều thuốc (ghi thời gian nếu nhớ)', e.target.value)}
            />
            <ClearableSelect
              label="Tình trạng tổn thương khi đang uống thuốc"
              value={epTinhTrang ?? ''}
              options={optEp('Tình trạng tổn thương khi đang uống thuốc')}
              onChange={(v) => setKV(gKey, 'Tình trạng tổn thương khi đang uống thuốc', v)}
            />
            {(epTinhTrang === 'Giảm xuống' || epTinhTrang === 'Nặng lên') && (
              <ClearableSelect
                label="Triệu chứng Giảm xuống/Nặng lên là gì?"
                value={gVal['Triệu chứng Giảm xuống/Nặng lên là gì?'] ?? ''}
                options={optEp('Triệu chứng Giảm xuống/Nặng lên là gì?')}
                onChange={(v) => setKV(gKey, 'Triệu chứng Giảm xuống/Nặng lên là gì?', v)}
              />
            )}
          </Stack>
        )}
      </Box>
    );
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
      <Typography variant="subtitle1" gutterBottom fontWeight="bold">{indicator.name}</Typography>
      {indicator.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {indicator.description}
        </Typography>
      )}

      {/* Nhóm chính */}
      <Box sx={{ borderLeft: 3, borderColor: 'divider', pl: 2 }}>
        <ClearableSelect
          label="Có điều trị hay không?"
          value={coDieuTri ?? ''}
          options={opt('Có điều trị hay không?')}
          onChange={(v) => setKV(MAIN_LABEL, 'Có điều trị hay không?', v)}
        />

        {coDieuTri === 'Có' && (
          <Stack spacing={1} sx={{ mt: 1 }}>
            <TextField
              size="small"
              label="Tên thuốc"
              value={mainGroup['Tên thuốc'] ?? ''}
              onChange={(e) => setKV(MAIN_LABEL, 'Tên thuốc', e.target.value)}
            />
            <TextField
              size="small"
              label="Liều thuốc (ghi thời gian nếu nhớ)"
              value={mainGroup['Liều thuốc (ghi thời gian nếu nhớ)'] ?? ''}
              onChange={(e) => setKV(MAIN_LABEL, 'Liều thuốc (ghi thời gian nếu nhớ)', e.target.value)}
            />
            <ClearableSelect
              label="Tình trạng tổn thương khi đang uống thuốc"
              value={tinhTrang ?? ''}
              options={opt('Tình trạng tổn thương khi đang uống thuốc')}
              onChange={(v) => setKV(MAIN_LABEL, 'Tình trạng tổn thương khi đang uống thuốc', v)}
            />
            {(tinhTrang === 'Giảm xuống' || tinhTrang === 'Nặng lên') && (
              <ClearableSelect
                label="Triệu chứng Giảm xuống/Nặng lên là gì?"
                value={mainGroup['Triệu chứng Giảm xuống/Nặng lên là gì?'] ?? ''}
                options={opt('Triệu chứng Giảm xuống/Nặng lên là gì?')}
                onChange={(v) => setKV(MAIN_LABEL, 'Triệu chứng Giảm xuống/Nặng lên là gì?', v)}
              />
            )}
          </Stack>
        )}

        <Box sx={{ mt: 2 }}>
          <ClearableSelect
            label="Trước đây bạn đã từng bị đợt nào như vậy chưa?"
            value={mainGroup['Trước đây bạn đã từng bị đợt nào như vậy chưa?'] ?? ''}
            options={opt('Trước đây bạn đã từng bị đợt nào như vậy chưa?')}
            onChange={(v) => setKV(MAIN_LABEL, 'Trước đây bạn đã từng bị đợt nào như vậy chưa?', v)}
          />
          {mainGroup['Trước đây bạn đã từng bị đợt nào như vậy chưa?'] === 'Có' && (
            <Box sx={{ mt: 1 }}>
              <ClearableSelect
                label="Số đợt bị"
                value={mainGroup['Số đợt bị'] ?? ''}
                options={['1', '2', '3']}
                onChange={setEpisodeCount}
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* Render đợt 1..N */}
      {mainGroup['Trước đây bạn đã từng bị đợt nào như vậy chưa?'] === 'Có' &&
        groups.slice(1, 1 + (parseInt(mainGroup['Số đợt bị'] || '0', 10) || 0)).map(renderEpisodeGroup)}
    </Paper>
  );
}

/* ================== Generic custom (giữ nguyên cho custom khác) ================== */
function GenericCustomRenderer({ indicator, value, onChange }) {
  const groups = (() => {
    const raw = indicator.valueOptions?.group;
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.fields)) return [raw];
    return [];
  })();

  const setKV = (g, k, v) => {
    const current = value?.value || {};
    onChange({ value: { ...current, [g]: { ...(current[g] || {}), [k]: v } }, note: '' });
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
      <Typography variant="subtitle1" gutterBottom fontWeight="bold">{indicator.name}</Typography>
      {indicator.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {indicator.description}
        </Typography>
      )}

      <Box sx={{ borderLeft: 3, borderColor: 'divider', pl: 2 }}>
        {groups.map((group, gi) => {
          const gKey = group.label || `group_${gi}`;
          const fields = group.field || group.fields || [];
          const gVal = value?.value?.[gKey] || {};

          return (
            <Box key={gKey} sx={{ '&:not(:first-of-type)': { mt: 2 } }}>
              {group.label && <Typography variant="subtitle2" gutterBottom>{group.label}</Typography>}
              <Stack spacing={2}>
                {fields.map((field, fi) => {
                  const fKey = field.label || `field_${fi}`;
                  const fVal = gVal[fKey];
                  const options = field.option || field.options || [];

                  return (
                    <Box key={`${gKey}-${fKey}`}>
                      {field.label && <Typography variant="body1" component="label">{field.label}</Typography>}
                      {field.description && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {String(field.description).replace('//', '')}
                        </Typography>
                      )}

                      {field.type === 'text' && (
                        <TextField size="small" fullWidth value={fVal ?? ''} onChange={(e) => setKV(gKey, fKey, e.target.value)} />
                      )}

                      {field.type === 'select' && (
                        <FormControl size="small" fullWidth>
                          <Select value={fVal ?? ''} onChange={(e) => setKV(gKey, fKey, e.target.value)}>
                            {(options || []).map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                          </Select>
                        </FormControl>
                      )}

                      {field.type === 'multi_selection' && (
                        <FormControl size="small" fullWidth>
                          <Select
                            multiple
                            value={Array.isArray(fVal) ? fVal : []}
                            onChange={(e) => setKV(gKey, fKey, e.target.value)}
                            renderValue={(selected) => (selected || []).join(', ')}
                          >
                            {(options || []).map((opt) => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                          </Select>
                        </FormControl>
                      )}

                      {field.type === 'image' && (
                        <Stack spacing={1} alignItems="flex-start">
                          <Button variant="outlined" component="label">
                            {field.description || 'Tải ảnh'}
                            <input type="file" hidden multiple onChange={(e) => setKV(gKey, fKey, Array.from(e.target.files || []))} />
                          </Button>
                        </Stack>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}

/* ============================== RENDERER CHÍNH ============================== */
function QuestionRendererMUI({ indicator, value, onChange }) {
  if (EPISODE_IDS.has(indicator.id) || EPISODE_CODES.has(indicator.code)) {
    return <EpisodeInfoRenderer indicator={indicator} value={value} onChange={onChange} />;
  }

  const handleTextChange = (e) => onChange({ value: e.target.value, note: '' });
  const handleNumberChange = (e) => onChange({ value: e.target.value === '' ? '' : Number(e.target.value), note: '' });

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
      <Typography variant="subtitle1" gutterBottom fontWeight="bold">{indicator.name}</Typography>
      {indicator.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {indicator.description}
        </Typography>
      )}

      {(() => {
        switch (indicator.valueType) {
          case 'text':
            return <TextField fullWidth label="Câu trả lời" value={value?.value ?? ''} onChange={handleTextChange} />;

          case 'number':
            return (
              <TextField
                fullWidth
                label="Câu trả lời"
                type="number"
                inputProps={{ step: 'any' }}
                value={value?.value ?? ''}
                onChange={handleNumberChange}
              />
            );

          case 'full_date':
            return (
              <TextField
                fullWidth
                label="Ngày"
                type="date"
                value={value?.value ?? ''}
                onChange={handleTextChange}
                InputLabelProps={{ shrink: true }}
              />
            );

          case 'selection':
            return (
              <ClearableSelect
                label="Chọn một đáp án"
                value={value?.value ?? ''}
                options={indicator.valueOptions || []}
                onChange={(v) => onChange({ value: v, note: '' })}
              />
            );

          case 'multi_selection':
            return (
              <ClearableMultiSelect
                label="Chọn nhiều đáp án"
                value={value?.value || []}
                options={indicator.valueOptions || []}
                onChange={(v) => onChange({ value: v, note: '' })}
              />
            );

          case 'image':
            return (
              <Stack spacing={1} alignItems="flex-start">
                <Button variant="outlined" component="label">
                  Tải ảnh
                  <input hidden multiple type="file" onChange={(e) => onChange({ value: Array.from(e.target.files || []), note: '' })} />
                </Button>
              </Stack>
            );

          case 'custom':
            return <GenericCustomRenderer indicator={indicator} value={value} onChange={onChange} />;

          default:
            return <Typography color="error">Loại câu hỏi không được hỗ trợ: {indicator.valueType}</Typography>;
        }
      })()}
    </Paper>
  );
}

/* ================================== PAGE ================================== */
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

  const [initialErrors, setInitialErrors] = useState({ patientId: '', diagnosis: '', symptoms: '' });

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

  const TEMPLATE_OPTIONS = {
    16: 'Bệnh án cấp tính',
    17: 'Bệnh án mãn tính lần 1',
    18: 'Bệnh án mãn tính tái khám',
  };

  // NEW: states điều kiện hiển thị theo câu điều khiển
  const [selectedQ192, setSelectedQ192] = useState(null); // template 16, group 12, id 192
  const [selectedQ62,  setSelectedQ62]  = useState(null); // template 17, group 27, id 62

  const isAcuteTemplate    = parseInt(templateIdFromUrl, 10) === 16; // 12/18
  const isChronic1Template = parseInt(templateIdFromUrl, 10) === 17; // 27/28

  const indicatorMap = useMemo(() => {
    const m = {};
    vitalGroups.forEach((g) => g.indicators.forEach((ind) => (m[ind.id] = ind)));
    return m;
  }, [vitalGroups]);

  // Fetch data
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      if (!templateIdFromUrl) {
        if (!cancelled) {
          setError('Không tìm thấy ID bệnh án trong URL.');
          setLoading(false);
        }
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

        // reset lựa chọn điều kiện khi đổi template
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

  const handleInitialInfoChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      initialInfo: { ...prev.initialInfo, [name]: value },
    }));
    if (initialErrors[name]) setInitialErrors((s) => ({ ...s, [name]: '' }));
  };

  const handleVitalValueChange = useCallback((indicatorId, value) => {
    setFormData((prev) => ({
      ...prev,
      vitalValues: { ...prev.vitalValues, [indicatorId]: value },
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

  /* ===================== SERIALIZE (CHỈ LOGIC GỬI) ===================== */
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

  const innerOfEpisodeQuestion = (indicator, stored) => {
    const groups = Array.isArray(indicator.valueOptions?.group) ? indicator.valueOptions.group : [];
    if (!groups.length) return null;

    const MAIN_LABEL = groups[0].label || '__group_0';
    const raw = stored?.value || {};
    const main = raw[MAIN_LABEL] || {};

    const co = main['Có điều trị hay không?'];
    const tt = main['Tình trạng tổn thương khi đang uống thuốc'];
    const da = main['Trước đây bạn đã từng bị đợt nào như vậy chưa?'];
    const so = parseInt(main['Số đợt bị'] || '0', 10) || 0;

    const root = {};
    const put = (k, v) => { if (!isNilOrEmpty(v)) root[k] = sanitizeValue(v); };

    put('Có điều trị hay không?', co);
    if (co === 'Có') {
      put('Tên thuốc', main['Tên thuốc']);
      put('Liều thuốc (ghi thời gian nếu nhớ)', main['Liều thuốc (ghi thời gian nếu nhớ)']);
      put('Tình trạng tổn thương khi đang uống thuốc', tt);
      if (tt === 'Giảm xuống' || tt === 'Nặng lên') {
        put('Triệu chứng Giảm xuống/Nặng lên là gì?', main['Triệu chứng Giảm xuống/Nặng lên là gì?']);
      }
    }
    put('Trước đây bạn đã từng bị đợt nào như vậy chưa?', da);
    if (da === 'Có') put('Số đợt bị', String(so || ''));

    const clamp = Math.min(Math.max(so, 0), 3);
    for (let i = 1; i <= clamp; i += 1) {
      const lbl = `Thông tin đợt ${i}`;
      const g = raw[lbl] || {};
      const _co = g['Có điều trị hay không?'];
      const _tt = g['Tình trạng tổn thương khi đang uống thuốc'];

      const child = {};
      const putChild = (k, v) => { if (!isNilOrEmpty(v)) child[k] = sanitizeValue(v); };

      putChild('Có điều trị hay không?', _co);
      if (_co === 'Có') {
        putChild('Tên thuốc', g['Tên thuốc']);
        putChild('Liều thuốc (ghi thời gian nếu nhớ)', g['Liều thuốc (ghi thời gian nếu nhớ)']);
        putChild('Tình trạng tổn thương khi đang uống thuốc', _tt);
        if (_tt === 'Giảm xuống' || _tt === 'Nặng lên') {
          putChild('Triệu chứng Giảm xuống/Nặng lên là gì?', g['Triệu chứng Giảm xuống/Nặng lên là gì?']);
        }
      }

      if (!isNilOrEmpty(child)) root[lbl] = child;
    }

    if (isNilOrEmpty(root)) return null;
    return root;
  };

  const innerForApi = (indicator, stored) => {
    if (!indicator) return null;
    if (EPISODE_IDS.has(indicator.id) || EPISODE_CODES.has(indicator.code)) {
      return innerOfEpisodeQuestion(indicator, stored);
    }
    return innerOfNormalIndicator(stored);
  };

  // ===================== FILTER GROUPS (Q192 & Q62 logic) =====================
  const filteredVitalGroups = useMemo(() => {
    let groups = vitalGroups;

    if (isAcuteTemplate) {
      // 16: 12 & 18
      const allow18 = selectedQ192 === 'Phù mạch' || selectedQ192 === 'Cả hai' || selectedQ192 === 'Khác';
      groups = groups.filter(g => {
        if (g.id === 18) return !!allow18;   // 18 chỉ hiện khi phù hợp
        return true;                         // 12 (và các group khác) vẫn có trong list
      });
    }

    if (isChronic1Template) {
      // 17: 27 & 28
      const allow28 = selectedQ62 === 'Phù mạch' || selectedQ62 === 'Cả hai' || selectedQ62 === 'Khác';
      groups = groups.filter(g => {
        if (g.id === 28) return !!allow28;   // 28 chỉ hiện khi phù hợp
        return true;                         // 27 (và các group khác) vẫn có trong list
      });
    }

    return groups;
  }, [vitalGroups, isAcuteTemplate, selectedQ192, isChronic1Template, selectedQ62]);

  // Steps
  const steps = [...filteredVitalGroups.map(g => g.name), 'Thông tin bệnh án'];

  // Clamp step index khi danh sách step thay đổi (không nhảy về 1)
  useEffect(() => {
    const totalSteps = filteredVitalGroups.length + 1;
    setActiveStep(prev => (prev >= totalSteps ? Math.max(0, totalSteps - 1) : prev));
  }, [filteredVitalGroups.length]);

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
          value: { value: inner },
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

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Container>
    );
  }

  // ===================== Render content per step =====================
  const renderStepContent = (step) => {
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
          <TextField
            label="Tên bác sĩ phụ trách"
            value={staffProfile?.fullname || ''}
            InputProps={{ readOnly: true }}
            variant="filled"
          />
          <TextField
            label="Mã bệnh nhân"
            name="patientId"
            type="number"
            value={formData.initialInfo.patientId}
            onChange={handleInitialInfoChange}
            required
            error={Boolean(initialErrors.patientId)}
            helperText={initialErrors.patientId}
          />
          <TextField
            label="Chẩn đoán"
            name="diagnosis"
            multiline
            rows={3}
            value={formData.initialInfo.diagnosis}
            onChange={handleInitialInfoChange}
            required
            error={Boolean(initialErrors.diagnosis)}
            helperText={initialErrors.diagnosis}
          />
          <TextField
            label="Triệu chứng"
            name="symptoms"
            multiline
            rows={3}
            value={formData.initialInfo.symptoms}
            onChange={handleInitialInfoChange}
            required
            error={Boolean(initialErrors.symptoms)}
            helperText={initialErrors.symptoms}
          />
          <TextField
            label="Ghi chú"
            name="notes"
            multiline
            rows={2}
            value={formData.initialInfo.notes}
            onChange={handleInitialInfoChange}
          />
        </Stack>
      );
    }

    const group = filteredVitalGroups[step];
    if (!group) return null;

    if (isAcuteTemplate && group.id === 12) {
      const q192 = group.indicators.find(i => i.id === 192);
      const others = group.indicators.filter(i => i.id !== 192);

      const handleQ192Change = (val) => {
        setSelectedQ192(val?.value || null);
        handleVitalValueChange(q192.id, val);
      };

      if (!selectedQ192) {
        return (
          <Stack spacing={2}>
            <QuestionRendererMUI
              key={q192.id}
              indicator={q192}
              value={formData.vitalValues[q192.id]}
              onChange={handleQ192Change}
            />
          </Stack>
        );
      }

      if (selectedQ192 === 'Phù mạch') {
        return (
          <Stack spacing={2}>
            <QuestionRendererMUI
              key={q192.id}
              indicator={q192}
              value={formData.vitalValues[q192.id]}
              onChange={handleQ192Change}
            />
          </Stack>
        );
      }

      return (
        <Stack spacing={2}>
          <QuestionRendererMUI
            key={q192.id}
            indicator={q192}
            value={formData.vitalValues[q192.id]}
            onChange={handleQ192Change}
          />
          {others.map(i => (
            <QuestionRendererMUI
              key={i.id}
              indicator={i}
              value={formData.vitalValues[i.id]}
              onChange={(val) => handleVitalValueChange(i.id, val)}
            />
          ))}
        </Stack>
      );
    }

    if (isChronic1Template && group.id === 27) {
      const q62 = group.indicators.find(i => i.id === 62);
      const others = group.indicators.filter(i => i.id !== 62);

      const handleQ62Change = (val) => {
        setSelectedQ62(val?.value || null);
        handleVitalValueChange(q62.id, val);
      };

      if (!selectedQ62) {
        return (
          <Stack spacing={2}>
            <QuestionRendererMUI
              key={q62.id}
              indicator={q62}
              value={formData.vitalValues[q62.id]}
              onChange={handleQ62Change}
            />
          </Stack>
        );
      }

      if (selectedQ62 === 'Phù mạch') {
        return (
          <Stack spacing={2}>
            <QuestionRendererMUI
              key={q62.id}
              indicator={q62}
              value={formData.vitalValues[q62.id]}
              onChange={handleQ62Change}
            />
          </Stack>
        );
      }

      return (
        <Stack spacing={2}>
          <QuestionRendererMUI
            key={q62.id}
            indicator={q62}
            value={formData.vitalValues[q62.id]}
            onChange={handleQ62Change}
          />
          {others.map(i => (
            <QuestionRendererMUI
              key={i.id}
              indicator={i}
              value={formData.vitalValues[i.id]}
              onChange={(val) => handleVitalValueChange(i.id, val)}
            />
          ))}
        </Stack>
      );
    }

    return (
      <Stack spacing={2}>
        {group.indicators.map((indicator) => (
          <QuestionRendererMUI
            key={indicator.id}
            indicator={indicator}
            value={formData.vitalValues[indicator.id]}
            onChange={(val) => handleVitalValueChange(indicator.id, val)}
          />
        ))}
      </Stack>
    );
  };

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(`${paths.dashboard.medicalRecordStaff.create}`)}>
          Trang chủ
        </Button>
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
