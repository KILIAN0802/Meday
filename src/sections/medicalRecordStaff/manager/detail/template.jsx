// src/app/record/[id]/page.js
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

import {
  Container, Box, Stepper, Step, StepLabel, Button, Typography, CircularProgress, Alert,
  Paper, Stack, TextField, IconButton,
  // radio/checkbox
  FormControlLabel, Radio, RadioGroup, Checkbox, FormGroup,
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

/* ============================================================================
   Helpers cho lưu ảnh tạm & upload thật
============================================================================ */
const PENDING_PREFIX = 'pendingUploads:'; // key localStorage

const lsSafeParse = (s, fb) => {
  try { return JSON.parse(s); } catch { return fb; }
};
const getPending = (key) => lsSafeParse(localStorage.getItem(PENDING_PREFIX + key) || '[]', []);
const setPending = (key, arr) => localStorage.setItem(PENDING_PREFIX + key, JSON.stringify(arr));
const clearPending = (key) => localStorage.removeItem(PENDING_PREFIX + key);

// Tạo item preview thống nhất
const makePreviewItem = (file) => ({
  name: file.name,
  size: file.size,
  type: file.type,
  src: URL.createObjectURL(file),
  file,
});

// Upload 1 file → trả về URL (dò cả text thuần & JSON)
async function uploadOneFile(file, groupId, templateId) {
  const formDataUpload = new FormData();
  formDataUpload.append('file', file);

  const endpoint = `https://drmayday.ibme.edu.vn/urticaria-collector/api/v1/medical-records/upload?user_id=${groupId}&record_type=${templateId}`;
  const res = await fetch(endpoint, { method: 'POST', body: formDataUpload });

  const text = await res.text();
  if (res.ok && text && text.startsWith('http')) return text.trim();

  // fallback parse json
  try {
    const data = JSON.parse(text);
    const url = data.url || data.data?.url || data.path || data.file_url;
    if (url) return url;
  } catch { /* ignore */ }

  throw new Error('Upload ảnh thất bại hoặc phản hồi không hợp lệ.');
}

// Đệ quy: gặp File hoặc object preview có key .file → upload, thay bằng URL
async function resolveUploadsDeep(value, groupId, templateId) {
  if (!value) return value;

  if (value && typeof value === 'object' && !(value instanceof File) && 'file' in value && value.file instanceof File) {
    const url = await uploadOneFile(value.file, groupId, templateId);
    return url;
  }

  if (value instanceof File) {
    const url = await uploadOneFile(value, groupId, templateId);
    return url;
  }

  if (Array.isArray(value)) {
    const out = [];
    for (const it of value) {
      out.push(await resolveUploadsDeep(it, groupId, templateId));
    }
    return out;
  }

  if (typeof value === 'object') {
    // ✅ NEW: xử lý các object có src blob
    if (value.src && typeof value.src === 'string' && value.src.startsWith('blob:')) {
      const fileName = value.name || `image_${Date.now()}.jpg`;
      const res = await fetch(value.src);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
      const url = await uploadOneFile(file, groupId, templateId);
      return url;
    }

    const out = {};
    for (const k of Object.keys(value)) {
      out[k] = await resolveUploadsDeep(value[k], groupId, templateId);
    }
    return out;
  }

  return value;
}

const isNilOrEmpty = (v) =>
  v === undefined ||
  v === null ||
  (typeof v === 'string' && v.trim() === '') ||
  (Array.isArray(v) && v.length === 0) ||
  (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);

/* ============================================================================
   UI helpers (radio/checkbox)
============================================================================ */
function ClearableSelect({ label, value, options = [], onChange }) {
  return (
    <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ mt: 1 }}>
      <Box sx={{ flexGrow: 1 }}>
        {label && <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{label}</Typography>}
        <RadioGroup value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {options.map((opt) => (
            <FormControlLabel
              key={opt}
              value={opt}
              control={<Radio size="small" />}
              label={opt}
            />
          ))}
        </RadioGroup>
      </Box>
      {value ? (
        <IconButton size="small" aria-label="clear" onClick={() => onChange('')}>
          <CloseIcon fontSize="small" />
        </IconButton>
      ) : null}
    </Stack>
  );
}
function ClearableMultiSelect({ label, value, options = [], onChange }) {
  const arr = Array.isArray(value) ? value : [];
  const toggle = (opt) => {
    if (arr.includes(opt)) onChange(arr.filter((v) => v !== opt));
    else onChange([...arr, opt]);
  };
  return (
    <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ mt: 1 }}>
      <Box sx={{ flexGrow: 1 }}>
        {label && <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{label}</Typography>}
        <FormGroup>
          {options.map((opt) => (
            <FormControlLabel
              key={opt}
              control={
                <Checkbox
                  size="small"
                  checked={arr.includes(opt)}
                  onChange={() => toggle(opt)}
                />
              }
              label={opt}
            />
          ))}
        </FormGroup>
      </Box>
      {arr.length ? (
        <IconButton size="small" aria-label="clear" onClick={() => onChange([])}>
          <CloseIcon fontSize="small" />
        </IconButton>
      ) : null}
    </Stack>
  );
}

/* ============================================================================
   Renderer riêng cho 2 câu đặc biệt (giữ nguyên UI, chỉ chạm xử lý ảnh ở dưới)
============================================================================ */
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

      {mainGroup['Trước đây bạn đã từng bị đợt nào như vậy chưa?'] === 'Có' &&
        groups.slice(1, 1 + (parseInt(mainGroup['Số đợt bị'] || '0', 10) || 0)).map(renderEpisodeGroup)}
    </Paper>
  );
}

/* ============================================================================
   Generic custom (đã thêm xử lý preview + localStorage + defer upload)
============================================================================ */
function GenericCustomRenderer({ indicator, value, onChange }) {
  const groups = (() => {
    const raw = indicator.valueOptions?.group;
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.fields)) return [raw];
    return [];
  })();

  const setKV = (g, k, v) => {
    const current = value?.value || {};
    onChange({
      value: { ...current, [g]: { ...(current[g] || {}), [k]: v } },
      note: '',
    });
  };

  // Lưu/đọc ảnh tạm theo key riêng (indicatorId + đường dẫn field)
  const makeKey = (gKey, fKey) => `${indicator.id}::${gKey}::${fKey}`;

  // Render các requiredFields khi có lựa chọn (ví dụ upload ảnh)
  const renderRequiredFields = (gKey, parentKey, requiredFields, fVal) => {
    if (!Array.isArray(requiredFields) || requiredFields.length === 0) return null;
    const hasSelection =
      (Array.isArray(fVal) && fVal.length > 0) ||
      (typeof fVal === 'string' && fVal.trim() !== '');
    if (!hasSelection) return null;

    return requiredFields.map((rf, idx) => {
      if (rf.type === 'image') {
        const imgKey = `${parentKey}_required_${idx}`;
        const pendingKey = makeKey(gKey, imgKey);
        const previews = getPending(pendingKey);

        const handleFilesChange = (e) => {
          const selected = Array.from(e.target.files || []);
          if (!selected.length) return;
          const newPreviews = selected.map(makePreviewItem);
          const updated = [...previews, ...newPreviews];
          setPending(pendingKey, updated);

          const current = value?.value || {};
          const gVal = current[gKey] || {};
          setKV(gKey, imgKey, updated);
        };
        const handleRemoveFile = (index) => {
          const updated = previews.filter((_, i) => i !== index);
          setPending(pendingKey, updated);
          setKV(gKey, imgKey, updated);
        };

        // đồng bộ form state lần đầu (nếu chưa)
        // Đảm bảo state có giá trị khởi tạo ngay khi render (thay cho useEffect)
        const current = value?.value || {};
        const gVal = current[gKey] || {};
        if (!Array.isArray(gVal[imgKey]) && previews.length > 0) {
          setKV(gKey, imgKey, previews);
        }

        return (
          <Stack key={imgKey} spacing={1} sx={{ mt: 1, pl: 3 }}>
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              {rf.description || 'Tải ảnh bắt buộc'}
            </Typography>
            <Button variant="outlined" component="label" size="small">
              Tải ảnh
              <input hidden multiple accept="image/*" type="file" onChange={handleFilesChange} />
            </Button>
            {previews.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {previews.map((item, i) => (
                  <Box key={i} sx={{ position: 'relative' }}>
                    <Box
                      component="img"
                      src={item.src}
                      alt={item.name}
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 1,
                        border: '1px solid #ccc',
                        objectFit: 'cover',
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveFile(i)}
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        bgcolor: 'rgba(255,255,255,0.8)',
                        '&:hover': { bgcolor: 'white' },
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            )}
          </Stack>
        );
      }
      return null;
    });
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
        {indicator.name}
      </Typography>

      <Box sx={{ borderLeft: 3, borderColor: 'divider', pl: 2 }}>
        {groups.map((group, gi) => {
          const gKey = group.label || `group_${gi}`;
          const fields = group.field || group.fields || [];
          const gVal = value?.value?.[gKey] || {};

          return (
            <Box key={gKey} sx={{ '&:not(:first-of-type)': { mt: 2 } }}>
              {group.label && (
                <Typography variant="subtitle2" gutterBottom>
                  {group.label}
                </Typography>
              )}

              <Stack spacing={2}>
                {fields.map((field, fi) => {
                  const fKey = field.label || `field_${fi}`;
                  const fVal = gVal[fKey];
                  const options = field.option || field.options || [];
                  const keyId = `${gKey}-${fKey}`;
                  const pendingKey = `${indicator.id}::${gKey}::${fKey}`;

                  const handleText = (e) => setKV(gKey, fKey, e.target.value);
                  const handleNumber = (e) =>
                    setKV(gKey, fKey, e.target.value === '' ? '' : Number(e.target.value));
                  const handleSelect = (v) => setKV(gKey, fKey, v);
                  const handleMulti = (v) => setKV(gKey, fKey, v);

                  if (field.type === 'text') {
                    return (
                      <TextField
                        key={keyId}
                        size="small"
                        fullWidth
                        label={fKey}
                        value={fVal ?? ''}
                        onChange={handleText}
                      />
                    );
                  }

                  if (field.type === 'number') {
                    return (
                      <TextField
                        key={keyId}
                        size="small"
                        fullWidth
                        type="number"
                        label={fKey}
                        inputProps={{ step: 'any' }}
                        value={fVal ?? ''}
                        onChange={handleNumber}
                      />
                    );
                  }

                  if (field.type === 'select') {
                    return (
                      <ClearableSelect
                        key={keyId}
                        label={fKey}
                        value={fVal ?? ''}
                        options={options}
                        onChange={handleSelect}
                      />
                    );
                  }

                  if (field.type === 'multi_selection') {
  const arr = Array.isArray(fVal) ? fVal : [];

  return (
    <Box key={keyId}>
      {/* tiêu đề nhóm lựa chọn */}
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        {fKey}
      </Typography>

      <FormGroup>
        {options.map((opt, idx) => {
          const checked = arr.includes(opt);
          const toggle = () => {
            if (checked) setKV(gKey, fKey, arr.filter((v) => v !== opt));
            else setKV(gKey, fKey, [...arr, opt]);
          };

          return (
            <Box key={idx} sx={{ mb: 1 }}>
              <FormControlLabel
                control={<Checkbox size="small" checked={checked} onChange={toggle} />}
                label={opt}
              />
              {/* ✅ hiển thị upload ảnh bắt buộc ngay dưới lựa chọn được chọn */}
              {checked &&
                renderRequiredFields(gKey, `${fKey}_${opt}`, field.requiredFields, [opt])}
            </Box>
          );
        })}
      </FormGroup>
    </Box>
  );
}


                  if (field.type === 'image') {
                    const previews = getPending(pendingKey);

                    const handleFilesChange = (e) => {
                      const selected = Array.from(e.target.files || []);
                      if (!selected.length) return;
                      const newPreviews = selected.map(makePreviewItem);
                      const updated = [...previews, ...newPreviews];
                      setPending(pendingKey, updated);
                      setKV(gKey, fKey, updated);
                    };
                    const handleRemoveFile = (index) => {
                      const updated = previews.filter((_, i) => i !== index);
                      setPending(pendingKey, updated);
                      setKV(gKey, fKey, updated);
                    };

                    useEffect(() => {
                      // đồng bộ form state lần đầu
                      if (!Array.isArray(fVal)) setKV(gKey, fKey, previews);
                      // eslint-disable-next-line react-hooks/exhaustive-deps
                    }, []);

                    return (
                      <Stack key={keyId} spacing={1}>
                        <Typography variant="subtitle2">{fKey}</Typography>
                        <Button variant="outlined" component="label" size="small">
                          Tải ảnh
                          <input hidden multiple accept="image/*" type="file" onChange={handleFilesChange} />
                        </Button>
                        {previews.length > 0 && (
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {previews.map((item, i) => (
                              <Box key={i} sx={{ position: 'relative' }}>
                                <Box
                                  component="img"
                                  src={item.src}
                                  alt={item.name}
                                  sx={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 1,
                                    border: '1px solid #ccc',
                                    objectFit: 'cover',
                                  }}
                                />
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveFile(i)}
                                  sx={{
                                    position: 'absolute',
                                    top: -8,
                                    right: -8,
                                    bgcolor: 'rgba(255,255,255,0.8)',
                                    '&:hover': { bgcolor: 'white' },
                                  }}
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            ))}
                          </Stack>
                        )}
                      </Stack>
                    );
                  }

                  return (
                    <Typography key={keyId} color="error">
                      Loại custom không được hỗ trợ: {field.type}
                    </Typography>
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

/* ============================================================================
   RENDERER CHÍNH (đã thay case 'image' theo cơ chế preview + localStorage)
============================================================================ */
function QuestionRendererMUI({ indicator, value, onChange }) {
  if (EPISODE_IDS.has(indicator.id) || EPISODE_CODES.has(indicator.code)) {
    return <EpisodeInfoRenderer indicator={indicator} value={value} onChange={onChange} />;
  }
  const handleTextChange = (e) => onChange({ value: e.target.value, note: '' });
  const handleNumberChange = (e) => onChange({ value: e.target.value === '' ? '' : Number(e.target.value), note: '' });

  // key lưu ảnh tạm cho indicator này
  const pendingKey = `${indicator.id}`;

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
      <Typography variant="subtitle1" gutterBottom fontWeight="bold">{indicator.name}</Typography>

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
                placeholder="dd/mm/yyyy"
                value={value?.value ?? ''}
                onChange={handleTextChange}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9/]*' }}
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

          case 'image': {
            const previews = getPending(pendingKey);

            const handleFilesChange = (e) => {
              const selected = Array.from(e.target.files || []);
              if (!selected.length) return;
              const newPreviews = selected.map(makePreviewItem);
              const updated = [...previews, ...newPreviews];
              setPending(pendingKey, updated);
              onChange({ value: updated, note: '' });
            };
            const handleRemoveFile = (index) => {
              const updated = previews.filter((_, i) => i !== index);
              setPending(pendingKey, updated);
              onChange({ value: updated, note: '' });
            };

            useEffect(() => {
              if (!Array.isArray(value?.value)) onChange({ value: previews, note: '' });
              // eslint-disable-next-line react-hooks/exhaustive-deps
            }, []);

            return (
              <Stack spacing={1} alignItems="flex-start">
                <Button variant="outlined" component="label" size="small">
                  Tải ảnh
                  <input hidden multiple accept="image/*" type="file" onChange={handleFilesChange} />
                </Button>

                {previews.length > 0 && (
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                    {previews.map((item, i) => (
                      <Box key={i} sx={{ position: 'relative' }}>
                        <Box
                          component="img"
                          src={item.src}
                          alt={item.name}
                          sx={{
                            width: 80,
                            height: 80,
                            borderRadius: 1,
                            border: '1px solid #ccc',
                            objectFit: 'cover',
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveFile(i)}
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            bgcolor: 'rgba(255,255,255,0.8)',
                            '&:hover': { bgcolor: 'white' },
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Stack>
            );
          }

          case 'custom':
            return <GenericCustomRenderer indicator={indicator} value={value} onChange={onChange} />;

          default:
            return <Typography color="error">Loại câu hỏi không được hỗ trợ: {indicator.valueType}</Typography>;
        }
      })()}
    </Paper>
  );
}

/* ============================================================================
   PAGE
============================================================================ */
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

  /* ===================== INNER BUILDERS (KHÔNG tự chế URL nữa) ===================== */
  const innerOfNormalIndicator = (data) => {
    const inner = data?.value;
    if (isNilOrEmpty(inner)) return null;
    return inner;
  };

  const innerOfEpisodeQuestion = (indicator, stored) => {
    const groups = Array.isArray(indicator.valueOptions?.group)
      ? indicator.valueOptions.group
      : [];
    if (!groups.length) return null;

    const MAIN_LABEL = groups[0].label || '__group_0';
    const raw = stored?.value || {};
    const main = raw[MAIN_LABEL] || {};

    const co = main['Có điều trị hay không?'];
    const tt = main['Tình trạng tổn thương khi đang uống thuốc'];
    const da = main['Trước đây bạn đã từng bị đợt nào như vậy chưa?'];
    const so = parseInt(main['Số đợt bị'] || '0', 10) || 0;

    const isNilOrEmpty2 = (v) =>
      v === undefined ||
      v === null ||
      (typeof v === 'string' && v.trim() === '') ||
      (Array.isArray(v) && v.length === 0) ||
      (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);

    const makeGroup = (label, obj) => {
      const co = obj['Có điều trị hay không?'];
      const tt = obj['Tình trạng tổn thương khi đang uống thuốc'];
      const da = obj['Trước đây bạn đã từng bị đợt nào như vậy chưa?'];
      const so = obj['Số đợt bị'];

      const value = {};
      const put = (k, v) => { if (!isNilOrEmpty2(v)) value[k] = v; };

      put('Có điều trị hay không?', co);
      if (co === 'Có') {
        put('Tên thuốc', obj['Tên thuốc']);
        put('Liều thuốc (ghi thời gian nếu nhớ)', obj['Liều thuốc (ghi thời gian nếu nhớ)']);
        put('Tình trạng tổn thương khi đang uống thuốc', tt);
        if (tt === 'Giảm xuống' || tt === 'Nặng lên') {
          put('Triệu chứng Giảm xuống/Nặng lên là gì?', obj['Triệu chứng Giảm xuống/Nặng lên là gì?']);
        }
      }
      if (da) put('Trước đây bạn đã từng bị đợt nào như vậy chưa?', da);
      if (so) put('Số đợt bị', String(so));
      return { label, value };
    };

    const rootGroup = makeGroup(MAIN_LABEL, main);

    const clamp = Math.min(Math.max(so, 0), 3);
    for (let i = 1; i <= clamp; i += 1) {
      const lbl = `Thông tin đợt ${i}`;
      const g = raw[lbl] || {};
      const childGroup = makeGroup(lbl, g);
      if (!isNilOrEmpty2(childGroup.value)) {
        rootGroup.value[lbl] = childGroup;
      }
    }

    if (isNilOrEmpty2(rootGroup.value)) return null;
    return rootGroup;
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
      const allow18 = selectedQ192 === 'Phù mạch' || selectedQ192 === 'Cả hai' || selectedQ192 === 'Khác';
      groups = groups.filter(g => {
        if (g.id === 18) return !!allow18;
        return true;
      });
    }

    if (isChronic1Template) {
      const allow28 = selectedQ62 === 'Phù mạch' || selectedQ62 === 'Cả hai' || selectedQ62 === 'Khác';
      groups = groups.filter(g => {
        if (g.id === 28) return !!allow28;
        return true;
      });
    }

    return groups;
  }, [vitalGroups, isAcuteTemplate, selectedQ192, isChronic1Template, selectedQ62]);

  // Steps
  const steps = [...filteredVitalGroups.map(g => g.name), 'Thông tin bệnh án'];

  // Clamp step index khi danh sách step thay đổi
  useEffect(() => {
    const totalSteps = filteredVitalGroups.length + 1;
    setActiveStep(prev => (prev >= totalSteps ? Math.max(0, totalSteps - 1) : prev));
  }, [filteredVitalGroups.length]);

  /* ===================== SUBMIT ===================== */
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

      // 1) Tạo bệnh án
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

      // 2) Trước khi build payload vitals: duyệt toàn bộ formData.vitalValues và
      //    upload tất cả File/object preview thành URL thật.
      //    Ghi chú: không cần đọc localStorage ở đây, vì state đang chứa các object preview.

      const groupId = parseInt(patientId, 10) || 0;
      const templateIdNum = parseInt(templateId, 10) || 0;

      // Deep-resolve uploads cho từng indicator
      const resolvedVitalValues = {};
      for (const [id, data] of Object.entries(formData.vitalValues)) {
        if (!data) continue;
        const cloned = JSON.parse(JSON.stringify(data));

        // thay mọi file/object preview bằng URL
        const resolved = {
          ...cloned,
          value: await resolveUploadsDeep(cloned.value, groupId, templateIdNum),
        };
        resolvedVitalValues[id] = resolved;
      }

      // 3) Build payload updateVitalMedicalRecordeById
      const formattedVitalValues = [];
      for (const [id, data] of Object.entries(resolvedVitalValues)) {
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

      // 4) Dọn dẹp localStorage cho tất cả key pending của trang này
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PENDING_PREFIX))
        .forEach((k) => localStorage.removeItem(k));

      alert('Tạo và cập nhật bệnh án thành công!');
      router.push(`${paths.dashboard.medicalRecordStaff.create}`);
    } catch (err) {
      setError(err.message || 'Đã có lỗi xảy ra khi lưu bệnh án.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

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

    // 🔹 1️⃣ Template cấp tính (ID = 16)
    if (isAcuteTemplate && group.id === 12) {
      const q192 = group.indicators.find((i) => i.id === 192);
      const others = group.indicators.filter((i) => i.id !== 192);

      const handleQ192Change = (val) => {
        setSelectedQ192(val?.value || null);
        handleVitalValueChange(q192.id, val);
      };

      // Nếu chưa chọn gì ở câu 192 => chỉ render câu đó
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

      // Nếu chọn “Phù mạch” => chỉ hiển thị câu 192 (ẩn các câu khác)
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

      // Nếu chọn “Sẩn phù”, “Cả hai” hoặc “Khác” => render toàn bộ
      return (
        <Stack spacing={2}>
          <QuestionRendererMUI
            key={q192.id}
            indicator={q192}
            value={formData.vitalValues[q192.id]}
            onChange={handleQ192Change}
          />
          {others.map((i) => (
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
      const q62 = group.indicators.find((i) => i.id === 62);
      const others = group.indicators.filter((i) => i.id !== 62);

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
          {others.map((i) => (
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
