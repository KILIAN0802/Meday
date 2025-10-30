'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Stack,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Snackbar,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  FormGroup
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import { getMedicalRecordTemplateById } from 'src/api/medical-record-templates-staff';
import { getVitalGroupById } from 'src/api/vitals';
import { createMedicalRecord, updateVitalMedicalRecordeById } from 'src/api/medical-record-staff';
import { getStaffProfile } from 'src/api/auth/owner';
import { paths } from 'src/routes/paths';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const EPISODE_CODES = new Set(['QUES4CTN', 'QUES4MT1']);
const EPISODE_IDS = new Set([175, 64]);
const DRAFT_KEY_PREFIX = 'mr_template_draft:';
const PENDING_PREFIX = 'pendingUploads:';
const MAX_IMAGES_PER_FIELD = 10;
const UPLOAD_CONCURRENCY = 3;
const Q4_IDS = new Set([190, 65]);
const Q5_IDS = new Set([196, 66]);
const Q11_IDS = new Set([185, 71]); // 11.x thá»i gian tá»“n táº¡i
const SHAPE_IDS = new Set([182, 69]); // 9. Hình dạng

const lsSafeParse = (s, fb) => {
  try { return JSON.parse(s); } catch { return fb; }
};

const getPending = (key) => lsSafeParse(localStorage.getItem(PENDING_PREFIX + key) || '[]', []);
const setPending = (key, arr) => localStorage.setItem(PENDING_PREFIX + key, JSON.stringify(arr));
const clearPendingStartsWith = (prefix) => {
  Object.keys(localStorage).forEach((k) => { if (k.startsWith(prefix)) localStorage.removeItem(k); });
};

const makePreviewItem = (file) => ({
  name: file.name,
  size: file.size,
  type: file.type,
  src: URL.createObjectURL(file),
  file
});

function uploadOneFileWithProgress(file, groupId, templateId, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const endpoint = `https://drmayday.ibme.edu.vn/urticaria-collector/api/v1/medical-records/upload?user_id=${groupId}&record_type=${templateId}`;
    xhr.open('POST', endpoint);
    xhr.onload = () => {
      const text = xhr.responseText || '';
      if (xhr.status >= 200 && xhr.status < 300) {
        if (text && text.startsWith('http')) return resolve(text.trim());
        try {
          const data = JSON.parse(text);
          const url = data.url || data.data?.url || data.path || data.file_url;
          if (url) return resolve(url);
        } catch {}
        return reject(new Error('Upload thành công nhưng phản hồi không có URL.'));
      }
      reject(new Error(`Upload thất bại (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('Lỗi mạng khi upload.'));
    if (xhr.upload && typeof onProgress === 'function') {
      xhr.upload.onprogress = (e) => {
        if (!e.lengthComputable) return;
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress(pct);
      };
    }
    const form = new FormData();
    form.append('file', file);
    xhr.send(form);
  });
}

async function resolveUploadsDeepConcurrent(value, groupId, templateId, updateProgress, path = [], pool) {
  const wrapJob = (job) => new Promise((res, rej) => {
    const run = async () => {
      pool.running++;
      try { const out = await job(); res(out); } catch (e) { rej(e); }
      finally { pool.running--; pool.next(); }
    };
    pool.queue.push(run);
    pool.next();
  });

  if (value && typeof value === 'object' && !(value instanceof File) && 'file' in value && value.file instanceof File) {
    const key = path.join('.');
    return wrapJob(() => uploadOneFileWithProgress(value.file, groupId, templateId, (p) => updateProgress(key, p)));
  }

  if (value instanceof File) {
    const key = path.join('.');
    return wrapJob(() => uploadOneFileWithProgress(value, groupId, templateId, (p) => updateProgress(key, p)));
  }

  if (Array.isArray(value)) {
    const results = [];
    for (let i = 0; i < value.length; i += 1) {
      const v = value[i];
      const out = await resolveUploadsDeepConcurrent(v, groupId, templateId, updateProgress, [...path, i], pool);
      results.push(out);
    }
    return results;
  }

  if (value && typeof value === 'object') {
    if (value.src && typeof value.src === 'string' && value.src.startsWith('blob:')) {
      const fileName = value.name || `image_${Date.now()}.jpg`;
      const res = await fetch(value.src);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
      const key = path.join('.');
      return await wrapJob(() => uploadOneFileWithProgress(file, groupId, templateId, (p) => updateProgress(key, p)));
    }

    const out = {};
    for (const k of Object.keys(value)) {
      out[k] = await resolveUploadsDeepConcurrent(value[k], groupId, templateId, updateProgress, [...path, k], pool);
    }
    return out;
  }

  return value;
}

function ClearableSelect({ label, value, options = [], onChange }) {
  return (
    <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ mt: 1 }}>
      <Box sx={{ flexGrow: 1 }}>
        {label && <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{label}</Typography>}
        <RadioGroup value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {options.map((opt, i) => (
            <FormControlLabel key={`${label || 'no_label'}-${i}`} value={opt} control={<Radio size="small" />} label={opt} />
          ))}
        </RadioGroup>
      </Box>
      {value ? (
        <IconButton size="small" aria-label="Xóa lựa Chọn" onClick={() => onChange('')}>
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
          {options.map((opt, i) => (
            <FormControlLabel
              key={`${label || 'no_label'}-${i}`}
              control={<Checkbox size="small" checked={arr.includes(opt)} onChange={() => toggle(opt)} />}
              label={opt}
            />
          ))}
        </FormGroup>
      </Box>
      {arr.length ? (
        <IconButton size="small" aria-label="Xóa táº¥t cáº£" onClick={() => onChange([])}>
          <CloseIcon fontSize="small" />
        </IconButton>
      ) : null}
    </Stack>
  );
}

function EpisodeInfoRenderer({ indicator, value, onChange, groupLabelMap }) {
  const groups = Array.isArray(indicator.valueOptions?.group) ? indicator.valueOptions.group : [];
  if (!groups.length) return null;
  const MAIN_LABEL = groupLabelMap?.[indicator.groupId] || '';
  const valObj = value?.value || {};
  const mainGroup = valObj[MAIN_LABEL] || {};

  const setKV = (g, k, v) => {
    const current = value?.value || {};
    onChange({ value: { ...current, [g]: { ...(current[g] || {}), [k]: v } }, note: '' });
  };

  const setEpisodeCount = (countStr) => {
    const current = value?.value || {};
    const updated = { ...current, [MAIN_LABEL]: { ...(current[MAIN_LABEL] || {}), ['Số đợt bị']: countStr } };
    onChange({ value: updated, note: '' });
  };

  const fieldsMain = groups[0].field || groups[0].fields || [];
  const opt = (label) => fieldsMain.find((f) => f.label === label)?.option || [];
  const coDieuTri = mainGroup['Có điều trị hay không?'];
  const tinhTrang = mainGroup['Tình trạng tổn thương khi đang uống thuốc'];
  const soDotBi = parseInt(mainGroup['Số đợt bị'] || '0', 10) || 0;

  const renderEpisodeGroup = (group) => {
    const gKey = group.label;
    const gVal = valObj[gKey] || {};
    const flds = group.field || group.fields || [];
    const optEp = (label) => flds.find((f) => f.label === label)?.option || [];
    const epCoDieuTri = gVal['Có điều trị hay không?'];
    const epTinhTrang = gVal['Tình trạng tổn thương khi đang uống thuốc'];

    return (
      <Box key={gKey} sx={{ mt: 2, borderLeft: 3, borderColor: 'divider', pl: 2 }}>
        {gKey && <Typography variant="subtitle2" gutterBottom>{gKey}</Typography>}
        <ClearableSelect
          label="Có điều trị hay không?"
          value={epCoDieuTri ?? ''}
          options={optEp('Có điều trị hay không?')}
          onChange={(v) => setKV(gKey, 'Có điều trị hay không?', v)}
        />
        {epCoDieuTri === 'Có' && (
          <Stack spacing={1} sx={{ mt: 1 }}>
            <TextField size="small" label="Tên thuốc" value={gVal['Tên thuốc'] ?? ''} onChange={(e) => setKV(gKey, 'Tên thuốc', e.target.value)} />
            <TextField size="small" label="Liều thuốc (ghi thời gian nếu nhớ)" value={gVal['Liều thuốc (ghi thời gian nếu nhớ)'] ?? ''} onChange={(e) => setKV(gKey, 'Liều thuốc (ghi thời gian nếu nhớ)', e.target.value)} />
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
      <Typography
        variant="subtitle1"
        gutterBottom
        fontWeight="bold"
        component="div"
        dangerouslySetInnerHTML={{ __html: indicator.name }}
      />
      <Box sx={{ borderLeft: 3, borderColor: 'divider', pl: 2 }}>
        <Box>
          {(MAIN_LABEL || '').trim() !== '' && <Typography variant="subtitle2" gutterBottom>{MAIN_LABEL}</Typography>}
          <Stack spacing={1}>
            <ClearableSelect
              label="Có điều trị hay không?"
              value={coDieuTri ?? ''}
              options={opt('Có điều trị hay không?')}
              onChange={(v) => setKV(MAIN_LABEL, 'Có điều trị hay không?', v)}
            />
            {coDieuTri === 'Có' && (
              <Stack spacing={1}>
                <TextField size="small" label="Tên thuốc" value={mainGroup['Tên thuốc'] ?? ''} onChange={(e) => setKV(MAIN_LABEL, 'Tên thuốc', e.target.value)} />
                <TextField size="small" label="Liều thuốc (ghi thời gian nếu nhớ)" value={mainGroup['Liều thuốc (ghi thời gian nếu nhớ)'] ?? ''} onChange={(e) => setKV(MAIN_LABEL, 'Liều thuốc (ghi thời gian nếu nhớ)', e.target.value)} />
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
          </Stack>
        </Box>
      </Box>
      {mainGroup['Trước đây bạn đã từng bị đợt nào như vậy chưa?'] === 'Có' && Array.isArray(groups) && groups.slice(1, 1 + soDotBi).map(renderEpisodeGroup)}
    </Paper>
  );
}

const GenericCustomRenderer = React.memo(function GenericCustomRenderer({
  indicator,
  value,
  onChange,
  onOpenPreview,
  groupLabelMap
}) {
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

  const isShapeThis = SHAPE_IDS.has(indicator.id);
  const isDurationThis = Q11_IDS.has(indicator.id);

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
      <Box sx={{ borderLeft: 3, borderColor: 'divider', pl: 2 }}>
        {groups.map((group, gi) => {
          const gKeyFromApi = groupLabelMap?.[indicator.groupId] || '';
          const gKey = gKeyFromApi;
          const fields = group.field || group.fields || [];
          const gVal = value?.value?.[gKey] || {};

          return (
            <Box key={`${gKey || ''}_${gi}`} sx={{ '&:not(:first-of-type)': { mt: 2 } }}>
              {(gKey || '').trim() !== '' && <Typography variant="subtitle2" gutterBottom>{gKey}</Typography>}
              <Stack spacing={2}>
                {fields.map((field, fi) => {
                  const fKey = field.label || ``;
                  const fVal = gVal[fKey];
                  const options = field.option || field.options || [];
                  const fieldId = field.id ?? fi;
                  const keyId = `${indicator.id}-${gKey || ''}-${fKey}-${fieldId}`;
                  const pendingKey = `${indicator.id}::${gKey}::${fKey}`;
                  const isQ5This = Q5_IDS.has(indicator.id);
                  const handleText = (e) => setKV(gKey, fKey, e.target.value);
                  const handleNumber = (e) => setKV(gKey, fKey, e.target.value === '' ? '' : Number(e.target.value));
                  const handleSelect = (v) => setKV(gKey, fKey, v);

                  if (isShapeThis && field.label && field.label.toLowerCase().includes('mô tả hình dạng khác')) {
                    return null;
                  }
                  if (isDurationThis && field.label === 'Nhập khoảng thời gian') {
                    return null;
                  }

                  if (isQ5This && field.label) {
                    const lower = field.label.toLowerCase();
                    if (lower.includes('chi tiết thức ăn') || lower.includes('chi tiết thuốc')) {
                      return null;
                    }
                  }

                  if (field.type === 'text') {
                    return (
                      <TextField key={keyId} size="small" fullWidth label={fKey} value={fVal ?? ''} onChange={handleText} />
                    );
                  }

                  if (field.type === 'number') {
                    return (
                      <TextField key={keyId} size="small" fullWidth type="number" inputProps={{ step: 'any' }} label={fKey} value={fVal ?? ''} onChange={handleNumber} />
                    );
                  }

                  if (field.type === 'select') {
                    if (isDurationThis && (fKey === '11.1 Khi dùng thuốc' || fKey === '11.2 Khi không dùng thuốc')) {
                      return (
                        <Box key={keyId}>
                          <ClearableSelect label={fKey} value={fVal ?? ''} options={options} onChange={handleSelect} />
                          {fVal === 'Khác (theo giờ)' && (
                            <Box sx={{ mt: 1 }}>
                              <TextField
                                key={`${keyId}-other-hours`}
                                size="small"
                                fullWidth
                                label="Nhập khoảng thời gian"
                                value={gVal[`${fKey} - Khác (theo giờ)`] || ''}
                                onChange={(e) => setKV(gKey, `${fKey} - Khác (theo giờ)`, e.target.value)}
                              />
                            </Box>
                          )}
                        </Box>
                      );
                    }

                    return (
                      <Box key={keyId}>
                        <ClearableSelect label={fKey} value={fVal ?? ''} options={options} onChange={handleSelect} />
                      </Box>
                    );
                  }

                  if (field.type === 'multi_selection') {
                    const arr = Array.isArray(fVal) ? fVal : [];
                    if (isQ5This) {
                      const hasFood = arr.includes('Thức ăn');
                      const hasDrug = arr.includes('Chống viêm, giảm đau');

                      const toggle = (opt) => {
                        const updated = arr.includes(opt)
                          ? arr.filter((v) => v !== opt)
                          : [...arr, opt];
                        setKV(gKey, fKey, updated);
                      };

                      const labelsRendered = new Set();

                      return (
                        <Box key={keyId} sx={{ mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                            {fKey || 'Chọn yếu tố làm nặng bệnh'}
                          </Typography>

                          <FormGroup>
                            {['Stress', 'Thức ăn', 'Chống viêm, giảm đau'].map((opt) => (
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

                          {hasFood &&
                            fields
                              .filter(
                                (fld) =>
                                  fld.label &&
                                  fld.label.toLowerCase().includes('chi tiết thức ăn') &&
                                  !labelsRendered.has(fld.label)
                              )
                              .map((fld) => {
                                labelsRendered.add(fld.label);
                                return (
                                  <TextField
                                    key={fld.label}
                                    size="small"
                                    fullWidth
                                    sx={{ mt: 1 }}
                                    label={fld.label}
                                    placeholder={fld.placeholder || 'Nhập chi tiết thức ăn'}
                                    value={gVal[fld.label] || ''}
                                    onChange={(e) => setKV(gKey, fld.label, e.target.value)}
                                  />
                                );
                              })}

                          {/* ✅ Nếu chọn “Chống viêm, giảm đau” → hiển thị text “Chi tiết thuốc” */}
                          {hasDrug &&
                            fields
                              .filter(
                                (fld) =>
                                  fld.label &&
                                  fld.label.toLowerCase().includes('chi tiết thuốc') &&
                                  !labelsRendered.has(fld.label)
                              )
                              .map((fld) => {
                                labelsRendered.add(fld.label);
                                return (
                                  <TextField
                                    key={fld.label}
                                    size="small"
                                    fullWidth
                                    sx={{ mt: 1 }}
                                    label={fld.label}
                                    placeholder={fld.placeholder || 'Nhập chi tiết thuốc'}
                                    value={gVal[fld.label] || ''}
                                    onChange={(e) => setKV(gKey, fld.label, e.target.value)}
                                  />
                                );
                              })}
                        </Box>
                      );
                    }

                    if (isShapeThis && fKey === 'Chọn hình dạng bạn gặp phải') {
                      const toggleShape = (opt) => {
                        const updated = arr.includes(opt) ? arr.filter((v) => v !== opt) : [...arr, opt];
                        if (!updated.includes('Hình dạng khác')) {
                          setKV(gKey, 'Mô tả hình dạng khác', '');
                        }
                        setKV(gKey, fKey, updated);
                      };
                      const otherSelected = arr.includes('Hình dạng khác');
                      const otherValue = gVal['Mô tả hình dạng khác'] ?? '';

                      return (
                        <Box key={keyId}>
                          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{fKey}</Typography>
                          <FormGroup>
                            {(options || []).map((opt, idx) => (
                              <FormControlLabel
                                key={`${keyId}-opt-${idx}`}
                                control={<Checkbox size="small" checked={arr.includes(opt)} onChange={() => toggleShape(opt)} />}
                                label={opt}
                              />
                            ))}
                          </FormGroup>
                          {otherSelected && (
                            <TextField
                              key={`${keyId}-other-input`}
                              size="small"
                              fullWidth
                              sx={{ mt: 1 }}
                              label="Mô tả hình dạng khác"
                              placeholder="Nhập mô tả"
                              value={otherValue}
                              onChange={(e) => setKV(gKey, 'Mô tả hình dạng khác', e.target.value)}
                            />
                          )}
                        </Box>
                      );
                    }

                    const arrVal = arr;
                    const renderOptions = () => {
                      let list = options;
                      if (Q4_IDS.has(indicator.id) && (fKey.includes('4.') || indicator.id === 190 || indicator.id === 65)) {
                        const baseTwo = ['Một cách ngẫu nhiên', 'Khi có các yếu tố kích thích'];
                        const showExtra = arrVal.includes('Khi có các yếu tố kích thích');
                        list = showExtra ? options : options.filter((o) => baseTwo.includes(o));
                      }
                      return list;
                    };

                    return (
                      <Box key={keyId}>
                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{fKey || 'Chọn'}</Typography>
                        <FormGroup>
                          {renderOptions().map((opt, idx) => {
                            const checked = arrVal.includes(opt);
                            const toggle = () => {
                              const updated = checked ? arrVal.filter((v) => v !== opt) : [...arrVal, opt];
                              setKV(gKey, fKey, updated);
                            };

                            const reqField = Array.isArray(field.requiredFields)
                              ? field.requiredFields.find((r) => r.type === 'image' && r.condition === 'hasSelection')
                              : null;

                            const pendingKey2 = `${indicator.id}::${gKey}::${fKey}::${opt}`;
                            const previews = getPending(pendingKey2);

                            const handleFilesChange = (e) => {
                              const selected = Array.from(e.target.files || []);
                              if (!selected.length) return;
                              const newPreviews = selected.map(makePreviewItem);
                              const updated = [...previews, ...newPreviews];
                              setPending(pendingKey2, updated);
                              setKV(gKey, `${fKey}__${opt}__images`, updated);
                            };

                            const handleRemoveFile = (i) => {
                              const updated = previews.filter((_, j) => j !== i);
                              setPending(pendingKey2, updated);
                              setKV(gKey, `${fKey}__${opt}__images`, updated);
                            };

                            return (
                              <Box key={`${keyId}-opt-${idx}`} sx={{ mb: 1 }}>
                                <FormControlLabel
                                  control={<Checkbox size="small" checked={checked} onChange={toggle} />}
                                  label={opt}
                                />

                                {checked && reqField && (
                                  <Stack spacing={1} sx={{ ml: 4, mt: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">
                                      {reqField.description || 'Tải ảnh'}
                                    </Typography>
                                    <Button variant="outlined" component="label" size="small" sx={{ width: 'fit-content' }}>
                                      Tải ảnh
                                      <input hidden multiple accept="image/*" type="file" onChange={handleFilesChange} />
                                    </Button>
                                    {previews.length > 0 && (
                                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
                                        {previews.map((item, i) => (
                                          <Box key={`${keyId}-prev-${idx}-${i}`} sx={{ position: 'relative' }}>
                                            <Box
                                              component="img"
                                              src={item.src}
                                              alt={item.name}
                                              onClick={() => onOpenPreview && onOpenPreview(item.src)}
                                              sx={{ width: 70, height: 70, borderRadius: 1, border: '1px solid #ccc', objectFit: 'cover', cursor: 'zoom-in' }}
                                            />
                                            <IconButton
                                              size="small"
                                              onClick={() => handleRemoveFile(i)}
                                              sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' } }}
                                            >
                                              <CloseIcon fontSize="small" />
                                            </IconButton>
                                          </Box>
                                        ))}
                                      </Stack>
                                    )}
                                    <Typography variant="caption" color="text.secondary">
                                      {previews.length}/{MAX_IMAGES_PER_FIELD} ảnh
                                    </Typography>
                                  </Stack>
                                )}
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
                      const nextCount = previews.length + selected.length;
                      if (nextCount > MAX_IMAGES_PER_FIELD) {
                        alert(`Tải ảnh${MAX_IMAGES_PER_FIELD} ảnh cho trang này.`);
                        return;
                      }
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
                      if (!Array.isArray(fVal)) setKV(gKey, fKey, previews);
                    }, []);
                    return (
                      <Stack key={keyId} spacing={1} alignItems="flex-start">
                        <Typography variant="subtitle2">{fKey}</Typography>
                        <Button variant="outlined" component="label" size="small" aria-label={`Tải ảnh cho ${fKey}`}>
                          Tải ảnh
                          <input hidden multiple accept="image/*" type="file" onChange={handleFilesChange} />
                        </Button>
                        {previews.length > 0 && (
                          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                            {previews.map((item, i) => (
                              <Box key={`${keyId}-prev-${i}`} sx={{ position: 'relative' }}>
                                <Box
                                  component="img"
                                  src={item.src}
                                  alt={item.name}
                                  onClick={() => onOpenPreview && onOpenPreview(item.src)}
                                  sx={{ width: 80, height: 80, borderRadius: 1, border: '1px solid #ccc', objectFit: 'cover', cursor: 'zoom-in' }}
                                />
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveFile(i)}
                                  aria-label={`Xóa ảnh ${item.name}`}
                                  sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' } }}
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            ))}
                          </Stack>
                        )}
                        <Typography variant="caption" color="text.secondary">{previews.length}/{MAX_IMAGES_PER_FIELD} ảnh</Typography>
                      </Stack>
                    );
                  }

                  return <Typography key={keyId} color="error">Loại custom không được hỗ trợ: {field.type}</Typography>;
                })}
              </Stack>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}, (prev, next) => prev.indicator?.id === next.indicator?.id && prev.value === next.value);

function Q4MultiSelect({ indicator, value, onChange }) {
  const arr = Array.isArray(value?.value) ? value.value : [];
  const baseTwo = ['Một cách ngẫu nhiên', 'Khi có các yếu tố kích thích'];
  const showExtra = arr.includes('Khi có các yếu tố kích thích');
  const list = showExtra ? indicator.valueOptions : indicator.valueOptions.filter((o) => baseTwo.includes(o));
  const toggle = (opt) => {
    const current = Array.isArray(value?.value) ? value.value : [];
    const updated = current.includes(opt) ? current.filter((v) => v !== opt) : [...current, opt];
    onChange({ value: updated, note: '' });
  };
  return (
    <FormGroup>
      {list.map((opt, i) => {
        const checked = arr.includes(opt);
        return (
          <FormControlLabel key={`q4-${i}`} control={<Checkbox size="small" checked={checked} onChange={() => toggle(opt)} />} label={opt} />
        );
      })}
    </FormGroup>
  );
}

const QuestionRendererMUI = React.memo(function QuestionRendererMUI({
  indicator,
  value,
  onChange,
  onOpenPreview,
  groupLabelMap
}) {
  if (EPISODE_IDS.has(indicator.id) || EPISODE_CODES.has(indicator.code)) {
    return <EpisodeInfoRenderer indicator={indicator} value={value} onChange={onChange} groupLabelMap={groupLabelMap} />;
  }
  if (Q4_IDS.has(indicator.id) && indicator.valueType === 'multi_selection') {
    return (
      <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
        <Typography
          variant="subtitle1"
          gutterBottom
          fontWeight="bold"
          component="div"
          dangerouslySetInnerHTML={{ __html: indicator.name }}
        />
        <Q4MultiSelect indicator={indicator} value={value} onChange={onChange} />
      </Paper>
    );
  }

  const handleTextChange = (e) => onChange({ value: e.target.value, note: '' });
  const handleNumberChange = (e) => onChange({ value: e.target.value === '' ? '' : Number(e.target.value), note: '' });
  const pendingKey = `${indicator.id}`;

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
      <Typography
        variant="subtitle1"
        gutterBottom
        fontWeight="bold"
        component="div"
        dangerouslySetInnerHTML={{ __html: indicator.name }}
      />
      {(() => {
        switch (indicator.valueType) {
          case 'text':
            return <TextField fullWidth label="Câu trả lời" value={value?.value ?? ''} onChange={handleTextChange} />;
          case 'number':
            return <TextField fullWidth label="Câu trả lời" type="number" inputProps={{ step: 'any' }} value={value?.value ?? ''} onChange={handleNumberChange} />;
          case 'full_date':
            return (
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  format="DD/MM/YYYY"
                  value={value?.value ? dayjs(value.value, 'DD/MM/YYYY') : null}
                  onChange={(newVal) => {
                    const formatted = newVal ? dayjs(newVal).format('DD/MM/YYYY') : '';
                    onChange({ value: formatted, note: '' });
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'medium',
                    },
                  }}
                />
              </LocalizationProvider>
            );

          case 'selection':
            return <ClearableSelect label="Chọn một đáp án" value={value?.value ?? ''} options={indicator.valueOptions || []} onChange={(v) => onChange({ value: v, note: '' })} />;
          case 'multi_selection':
            return <ClearableMultiSelect label="Chọn nhiều đáp án" value={value?.value || []} options={indicator.valueOptions || []} onChange={(v) => onChange({ value: v, note: '' })} />;
          case 'image': {
            const previews = getPending(pendingKey);
            const handleFilesChange = (e) => {
              const selected = Array.from(e.target.files || []);
              if (!selected.length) return;
              const nextCount = previews.length + selected.length;
              if (nextCount > MAX_IMAGES_PER_FIELD) { alert(`Tải ảnh ${MAX_IMAGES_PER_FIELD} ảnh cho câu này`); return; }
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
            }, []);
            return (
              <Stack spacing={1} alignItems="flex-start">
                <Button variant="outlined" component="label" size="small" aria-label="Tải ảnh">
                  Tải ảnh
                  <input hidden multiple accept="image/*" type="file" onChange={handleFilesChange} />
                </Button>
                {previews.length > 0 && (
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                    {previews.map((item, i) => (
                      <Box key={`img-prev-${i}`} sx={{ position: 'relative' }}>
                        <Box component="img" src={item.src} alt={item.name} onClick={() => onOpenPreview && onOpenPreview(item.src)} sx={{ width: 80, height: 80, borderRadius: 1, border: '1px solid #ccc', objectFit: 'cover', cursor: 'zoom-in' }} />
                        <IconButton size="small" onClick={() => handleRemoveFile(i)} aria-label={`Xóa ảnh ${item.name}`} sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' } }}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>
                )}
                <Typography variant="caption" color="text.secondary">{previews.length}/{MAX_IMAGES_PER_FIELD} ảnh</Typography>
              </Stack>
            );
          }
          case 'custom':
            return <GenericCustomRenderer indicator={indicator} value={value} onChange={onChange} onOpenPreview={onOpenPreview} groupLabelMap={groupLabelMap} />;
          default:
            return <Typography color="error">Loại câu hỏi không được hỗ trợ {indicator.valueType}</Typography>;
        }
      })()}
    </Paper>
  );
}, (prev, next) => prev.indicator?.id === next.indicator?.id && prev.value === next.value);

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
  const [snackMsg, setSnackMsg] = useState('');

  const [previewSrc, setPreviewSrc] = useState(null);
  const [uploadProgressMap, setUploadProgressMap] = useState({});
  const updateProgress = (key, pct) => setUploadProgressMap((m) => ({ ...m, [key]: pct }));

  const [selectedQ192, setSelectedQ192] = useState(null);
  const [selectedQ62, setSelectedQ62] = useState(null);
  const isAcuteTemplate = parseInt(templateIdFromUrl, 10) === 16;
  const isChronic1Template = parseInt(templateIdFromUrl, 10) === 17;

  const [groupLabelMap, setGroupLabelMap] = useState({});

  const [formData, setFormData] = useState({
    initialInfo: {
      patientId: '',
      doctorId: null,
      diagnosis: '',
      symptoms: '',
      notes: '',
      templateId: templateIdFromUrl,
      vitalValues: [null]
    },
    vitalValues: {}
  });

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      if (!templateIdFromUrl) { setError('Không tìm thấy ID bệnh án trong URL.'); setLoading(false); return; }
      try {
        if (!cancelled) { setLoading(true); setError(null); }
        const [profileRes, templateRes] = await Promise.all([getStaffProfile(), getMedicalRecordTemplateById(templateIdFromUrl)]);
        if (cancelled) return;

        setStaffProfile(profileRes?.data || null);
        setFormData((prev) => ({
          ...prev,
          initialInfo: { ...prev.initialInfo, doctorId: profileRes?.data?.id ?? null, templateId: templateIdFromUrl }
        }));

        const { vitalGroupIds = [], name = '' } = templateRes?.data || {};
        setTemplateName(name);

        const orderedIds = Array.from(new Set(vitalGroupIds)).filter(Boolean);
        const resGroups = await Promise.all(orderedIds.map(async (id) => {
          try {
            const gr = await getVitalGroupById(id);
            return gr?.data ?? null;
          } catch { return null; }
        }));
        const groups = resGroups.filter(Boolean);
        setVitalGroups(groups);

        const gmap = {};
        groups.forEach((g) => { gmap[g.id] = (g.label && typeof g.label === 'string') ? g.label.trim() : ''; });
        setGroupLabelMap(gmap);

        setSelectedQ192(null);
        setSelectedQ62(null);
      } catch (err) {
        setError(err?.message || 'Không thể tải dữ liệu bệnh án. Vui lòng thử lại.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [templateIdFromUrl]);

  const indicatorMap = useMemo(() => {
    const m = {};
    vitalGroups.forEach((g) => g.indicators?.forEach((ind) => (m[ind.id] = ind)));
    return m;
  }, [vitalGroups]);

  const filteredVitalGroups = useMemo(() => {
    let groups = vitalGroups;
    if (isAcuteTemplate) {
      const allow18 = selectedQ192 === 'Phù mạch' || selectedQ192 === 'Cả hai' || selectedQ192 === 'Khác';
      groups = groups.filter(g => (g.id === 18 ? !!allow18 : true));
    }
    if (isChronic1Template) {
      const allow28 = selectedQ62 === 'Phù mạch' || selectedQ62 === 'Cả hai' || selectedQ62 === 'Khác';
      groups = groups.filter(g => (g.id === 28 ? !!allow28 : true));
    }
    return groups;
  }, [vitalGroups, isAcuteTemplate, selectedQ192, isChronic1Template, selectedQ62]);

  const steps = useMemo(() => [...filteredVitalGroups.map(g => g.name), 'Thông tin bệnh án'], [filteredVitalGroups]);
  useEffect(() => {
    const total = steps.length;
    setActiveStep(prev => (prev >= total ? Math.max(0, total - 1) : prev));
  }, [steps.length]);

  const handleInitialInfoChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      initialInfo: { ...prev.initialInfo, [name]: value }
    }));
    if (initialErrors[name]) setInitialErrors((s) => ({ ...s, [name]: '' }));
  };
  const handleVitalValueChange = useCallback((indicatorId, value) => {
    setFormData((prev) => ({
      ...prev,
      vitalValues: { ...prev.vitalValues, [indicatorId]: value }
    }));
  }, []);

  const validateInitialInfo = () => {
    const diag = formData.initialInfo.diagnosis?.trim() || '';
    const symp = formData.initialInfo.symptoms?.trim() || '';
    const pid = formData.initialInfo.patientId;

    const errs = {
      patientId: pid ? '' : 'Bắt buộc',
      diagnosis: diag.length < 3 ? '+3 kí tự' : '',
      symptoms: symp.length < 3 ? '+3 kí tự' : ''
    };

    setInitialErrors(errs);
    return !errs.patientId && !errs.diagnosis && !errs.symptoms;
  };

  const isNilOrEmpty2 = (v) =>
    v === undefined ||
    v === null ||
    (typeof v === 'string' && v.trim() === '') ||
    (Array.isArray(v) && v.length === 0) ||
    (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);

  const innerOfNormalIndicator = (data) => {
    const inner = data?.value;
    if (isNilOrEmpty2(inner)) return null;
    return inner;
  };

  const innerOfEpisodeQuestion = (indicator, stored) => {
    const groups = Array.isArray(indicator.valueOptions?.group) ? indicator.valueOptions.group : [];
    if (!groups.length) return null;
    const MAIN_LABEL = (groupLabelMap?.[indicator.groupId] || '');
    const raw = stored?.value || {};
    const main = raw[MAIN_LABEL] || {};
    const buildGroup = (obj) => {
      const co = obj['Có điều trị hay không?'];
      const tt = obj['Tình trạng tổn thương khi đang uống thuốc'];
      const da = obj['Trước đây bạn đã từng bị đợt nào như vậy chưa?'];
      const so = obj['Số đợt bị'];
      const value = {};
      const put = (k, v) => { if (!isNilOrEmpty2(v)) value[k] = v; };
      put('Có điều trị hay không?', co);
      if (co === 'Có') {
        put('Tên thuốc', obj['Tên thuốc']);
        put('liều thuốc (ghi thời gian nếu nhớ)', obj['liều thuốc (ghi thời gian nếu nhớ)']);
        put('Tình trạng tổn thương khi đang uống thuốc', tt);
        if (tt === 'Giảm xuống' || tt === 'Tăng lên') {
          put('Triệu chứng Giảm xuống/Nặng lên là gì?', obj['Triệu chứng Giảm xuống/Nặng lên là gì?']);
        }
      }
      if (da) put('Trước đây bạn đã đừng bị đợt nào như vậy chưa?', da);
      if (so) put('Số đợt bỏ', String(so));
      return value;
    };
    const result = { [MAIN_LABEL]: buildGroup(main) };
    const soDotBi = parseInt(main['Số đợt bị'] || '0', 10) || 0;
    for (let i = 1; i <= soDotBi; i += 1) {
      const lbl = `Thông tin đợt ${i}`;
      const g = raw[lbl] || {};
      const sub = buildGroup(g);
      if (!isNilOrEmpty2(sub)) {
        result[MAIN_LABEL][lbl] = sub;
      }
    }
    if (isNilOrEmpty2(result[MAIN_LABEL])) return null;
    return result;
  };

  const innerForApi = (indicator, stored) => {
    if (!indicator) return null;
    if (EPISODE_IDS.has(indicator.id) || EPISODE_CODES.has(indicator.code)) {
      return innerOfEpisodeQuestion(indicator, stored);
    }
    return innerOfNormalIndicator(stored);
  };
  const isStepComplete = (stepIdx) => {
    if (stepIdx === steps.length - 1) {
      const { patientId, diagnosis, symptoms } = formData.initialInfo;
      return !!patientId && !!diagnosis?.trim() && !!symptoms?.trim();
    }

    const group = filteredVitalGroups[stepIdx];
    if (!group) return false;

    return group.indicators.every((indicator) => {
      const val = formData.vitalValues[indicator.id];
      const inner = val?.value;
      return inner !== undefined && inner !== null && inner !== '' && !(Array.isArray(inner) && inner.length === 0);
    });
  };
  const renderStepContent = (stepIdx) => {
    if (stepIdx === steps.length - 1) {
      return (
        <Stack spacing={3}>
          <TextField label="Mã bệnh nhân" name="patientId" type="number" value={formData.initialInfo.patientId} onChange={handleInitialInfoChange} required error={Boolean(initialErrors.patientId)} helperText={initialErrors.patientId} />
          <TextField label="Chẩn đoán" name="diagnosis" multiline rows={3} value={formData.initialInfo.diagnosis} onChange={handleInitialInfoChange} required error={Boolean(initialErrors.diagnosis)} helperText={initialErrors.diagnosis} />
          <TextField label="Triệu chứng" name="symptoms" multiline rows={3} value={formData.initialInfo.symptoms} onChange={handleInitialInfoChange} required error={Boolean(initialErrors.symptoms)} helperText={initialErrors.symptoms} />
          <TextField label="Ghi chúº" name="notes" multiline rows={2} value={formData.initialInfo.notes} onChange={handleInitialInfoChange} />
          <TextField label="Mẫu bệnh án" value={{16:'Bệnh án cấp tính',17:'Bệnh án mạn tính lần 1',18:'Bệnh án mạn tính tái khám'}[formData.initialInfo.templateId] || ''} InputProps={{ readOnly: true }} variant="filled" />
          <TextField label="Bác sĩ phụ trách" value={staffProfile?.fullname || ''} InputProps={{ readOnly: true }} variant="filled" />
        </Stack>
      );
    }

    const group = filteredVitalGroups[stepIdx];
    if (!group) return null;

    if (isAcuteTemplate && group.id === 12) {
      const q192 = group.indicators.find((i) => i.id === 192);
      const others = group.indicators.filter((i) => i.id !== 192);
      const handleQ192Change = (val) => {
        setSelectedQ192(val?.value || null);
        handleVitalValueChange(q192.id, val);
      };
      if (!selectedQ192 || selectedQ192 === 'Phù mạch') {
        return (
          <Stack spacing={2}>
            <QuestionRendererMUI key={q192.id} indicator={q192} value={formData.vitalValues[q192.id]} onChange={handleQ192Change} onOpenPreview={(src) => setPreviewSrc(src)} groupLabelMap={groupLabelMap} />
          </Stack>
        );
      }
      return (
        <Stack spacing={2}>
          <QuestionRendererMUI key={q192.id} indicator={q192} value={formData.vitalValues[q192.id]} onChange={handleQ192Change} onOpenPreview={(src) => setPreviewSrc(src)} groupLabelMap={groupLabelMap} />
          {others.map((i) => (
            <QuestionRendererMUI key={i.id} indicator={i} value={formData.vitalValues[i.id]} onChange={(val) => handleVitalValueChange(i.id, val)} onOpenPreview={(src) => setPreviewSrc(src)} groupLabelMap={groupLabelMap} />
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
      if (!selectedQ62 || selectedQ62 === 'Phù mạch') {
        return (
          <Stack spacing={2}>
            <QuestionRendererMUI key={q62.id} indicator={q62} value={formData.vitalValues[q62.id]} onChange={handleQ62Change} onOpenPreview={(src) => setPreviewSrc(src)} groupLabelMap={groupLabelMap} />
          </Stack>
        );
      }
      return (
        <Stack spacing={2}>
          <QuestionRendererMUI key={q62.id} indicator={q62} value={formData.vitalValues[q62.id]} onChange={handleQ62Change} onOpenPreview={(src) => setPreviewSrc(src)} groupLabelMap={groupLabelMap} />
          {others.map((i) => (
            <QuestionRendererMUI key={i.id} indicator={i} value={formData.vitalValues[i.id]} onChange={(val) => handleVitalValueChange(i.id, val)} onOpenPreview={(src) => setPreviewSrc(src)} groupLabelMap={groupLabelMap} />
          ))}
        </Stack>
      );
    }

    return (
      <Stack spacing={2}>
        {group.indicators.map((indicator) => (
          <QuestionRendererMUI key={indicator.id} indicator={indicator} value={formData.vitalValues[indicator.id]} onChange={(val) => handleVitalValueChange(indicator.id, val)} onOpenPreview={(src) => setPreviewSrc(src)} groupLabelMap={groupLabelMap} />
        ))}
      </Stack>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const incompleteSteps = steps
    .slice(0, -1)
    .filter((_, idx) => !isStepComplete(idx));

    if (incompleteSteps.length > 0) {
      const confirmProceed = window.confirm(
        'Còn câu hỏi chưa trả lời. Bạn muốn trả lời hết chứ?\n\nNhấn "OK" để tiếp tục lưu hoặc "Cancel" để quay lại.'
      );
      if (!confirmProceed) {
        setIsSubmitting(false);
        return;
      }
    }
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
        vitalValues: [null]
      };

      const createResponse = await createMedicalRecord(createPayload);
      const newId = createResponse.data?.id;
      if (!newId) throw new Error('Không nhận được ID bệnh án sau khi tạo!');

      const groupId = parseInt(patientId, 10) || 0;
      const templateIdNum = parseInt(templateId, 10) || 0;

      const pool = {
        running: 0,
        queue: [],
        next() {
          while (this.running < UPLOAD_CONCURRENCY && this.queue.length) {
            const job = this.queue.shift();
            job && job();
          }
        }
      };

      const resolvedVitalValues = {};
      for (const [id, data] of Object.entries(formData.vitalValues)) {
        if (!data) continue;
        const cloned = JSON.parse(JSON.stringify(data));
        const resolved = {
          ...cloned,
          value: await resolveUploadsDeepConcurrent(cloned.value, groupId, templateIdNum, updateProgress, [id], pool)
        };
        resolvedVitalValues[id] = resolved;
      }

      await new Promise((r) => {
        const tick = () => (pool.running === 0 && pool.queue.length === 0 ? r() : setTimeout(tick, 100));
        tick();
      });

      const formattedVitalValues = [];
      for (const [id, data] of Object.entries(resolvedVitalValues)) {
        const indicator = indicatorMap[Number(id)];
        const inner = innerForApi(indicator, data);
        if (inner === null) continue;
        formattedVitalValues.push({
          vitalIndicatorId: parseInt(id, 10),
          value: { value: inner },
          note: data?.note || ''
        });
      }
      if (formattedVitalValues.length) {
        await updateVitalMedicalRecordeById(newId, { vitalValues: formattedVitalValues });
      }

      clearPendingStartsWith(PENDING_PREFIX);

      alert('Tạo bệnh án thành công!!!');
      router.push(`${paths.dashboard.medicalRecordStaff.create}`);
    } catch (err) {

      let msg = 'Đã có lỗi xảy ra khi lưu bệnh án';

      const backendMsg = err?.response?.data?.message || err?.message || '';

      if (
        typeof backendMsg === 'string' &&
        (backendMsg.includes('violates foreign key constraint') ||
        backendMsg.includes('FK_43e2800e756c913a6c7a07cc271'))
      ) {
        msg = 'Mã bệnh nhân không tồn tại trong hệ thống.';
      } else if (backendMsg.includes('500')) {
        msg = 'Máy chủ gặp lỗi. Vui lòng thử lại sau.';
      }

      setError(msg);
    } finally {
      setIsSubmitting(false);
      setUploadProgressMap({});
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ my: 6, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>Đang tải template...</Typography>
      </Container>
    );
  }

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

      {Object.keys(uploadProgressMap).length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom aria-live="polite">Đang tải ảnh...</Typography>
          <LinearProgress />
        </Paper>
      )}

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label, i) => {
          const completed = isStepComplete(i);
          return (
            <Step key={`${label}-${i}`} completed={completed}>
              <StepLabel
                error={i < activeStep && !completed}
                onClick={() => setActiveStep(i)}
                sx={{ cursor: 'pointer' }}
              >
                {label}
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, mb: 8 }}>
        <Typography variant="h5" gutterBottom>{steps[activeStep]}</Typography>
        {error && <Alert severity="error" sx={{ mb: 3, mt: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          {renderStepContent(activeStep)}
        </Box>
      </Paper>

      <Paper elevation={6} sx={{ position: 'fixed', left: 0, right: 0, bottom: 0, py: 1.5, px: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', zIndex: (t) => t.zIndex.appBar + 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" disabled={activeStep === 0 || isSubmitting} onClick={() => setActiveStep((p) => p - 1)}>
              Quay lại
            </Button>
          </Stack>
          {activeStep < steps.length - 1 ? (
            <Button variant="contained" onClick={() => setActiveStep((p) => p + 1)}>
              Tiếp theo
            </Button>
          ) : (
            <Button variant="contained" color="success" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Hoàn tất và lưu'}
            </Button>
          )}
        </Box>
      </Paper>

      <Dialog open={Boolean(previewSrc)} onClose={() => setPreviewSrc(null)} maxWidth="md" fullWidth>
        <DialogTitle>Xem ảnh</DialogTitle>
        <DialogContent>
          {previewSrc ? <Box component="img" src={previewSrc} alt="preview" sx={{ width: '100%', borderRadius: 1 }} /> : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewSrc(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(snackMsg)} autoHideDuration={2000} onClose={() => setSnackMsg('')} message={snackMsg} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Container>
  );
}