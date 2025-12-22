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
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  FormGroup,
  Table, TableHead, TableRow, TableCell, TableBody
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import { getMedicalRecordById, getVitalValuesMedicalRecord, updateVitalMedicalRecordById } from 'src/api/medical-record-staff';
import { getMedicalRecordTemplateById } from 'src/api/medical-record-templates-staff';
import { getVitalGroupById } from 'src/api/vitals';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

// ==== CÁC HẰNG SỐ & CONFIG TỪ FILE 1 ====
const EPISODE_CODES = new Set(['QUES4CTN', 'QUES4MT1']);
const EPISODE_IDS = new Set([175, 64]);
const PENDING_PREFIX = 'pendingUploads:';
const MAX_IMAGES_PER_FIELD = 10;
const UPLOAD_CONCURRENCY = 3;
const Q4_IDS = new Set([190, 65]);
const Q5_IDS = new Set([196, 66]);
const Q11_IDS = new Set([185, 71, 41, 81]);
const CONDITIONAL_TEXT_IDS = new Set([204, 209]);
const SHAPE_IDS = new Set([182, 69]);

const LAB_STANDARD_RANGES = {
  WBC: "4-10",
  EO: "0-0.8",
  BA: "0.0-0.12",
  CRP: "<1.0",
  "Máu lắng - 1h": "",
  "Máu lắng - 2h": "",
  FT3: "3.1-6.8",
  FT4: "11.9-21.6",
  TSH: "0.27-4.2",
  "IgE toàn phần": "<100",
  "Anti-TPO": "0-34",
};

function normalizeLabName(name) {
  return name.replace(/^Chỉ số\s*/i, "").trim();
}

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

const sanitizeName = (str) => str ? str.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '') : '';

// ==== HÀM CHUẨN HÓA DỮ LIỆU TỪ SERVER ====
function normalizeVitalValue(value) {
  if (value == null) return null;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return normalizeVitalValue(parsed);
    } catch {
      return value;
    }
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeVitalValue(item));
  }
  if (typeof value === 'object') {
    const normalized = {};
    for (const [key, val] of Object.entries(value)) {
      normalized[key] = normalizeVitalValue(val);
    }
    return normalized;
  }
  return value;
}

// ==== UPLOAD HELPERS ====
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

// ==== BASIC COMPONENTS ====

function ClearableSelect({ label, value, options = [], onChange, name, hidden = false }) {
  return (
    <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ mt: 1, display: hidden ? 'none' : 'flex' }}>
      <Box sx={{ flexGrow: 1 }}>
        {label && <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{label}</Typography>}
        <RadioGroup name={name} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {options.map((opt, i) => (
            <FormControlLabel key={`${name || label}-${i}`} value={opt} control={<Radio size="small" />} label={opt} />
          ))}
        </RadioGroup>
      </Box>
      <IconButton size="small" onClick={(e) => { e.preventDefault(); onChange(''); }} disabled={!value}>
        <CloseIcon fontSize="small" />
      </IconButton>
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
        <IconButton size="small" aria-label="Xóa tất cả" onClick={() => onChange([])}>
          <CloseIcon fontSize="small" />
        </IconButton>
      ) : null}
    </Stack>
  );
}

// ==== RENDERERS TỪ FILE 1 (FULL LOGIC) ====

const EpisodeSingleForm = ({ title, prefixKey, data, onChange, isMainEpisode = false }) => {
  const safePrefix = sanitizeName(prefixKey);
  const setVal = (field, val) => onChange(`${prefixKey}_${field}`, val);
  const getVal = (field) => data[`${prefixKey}_${field}`] ?? '';

  const startDateStr = getVal('StartDate');
  const endDateStr = getVal('EndDate');
  
  const startDate = startDateStr ? dayjs(startDateStr) : null;
  const endDate = endDateStr ? dayjs(endDateStr) : null;
  const weeksVal = getVal('Số tuần bị đợt này');

  const handleDateChange = (pos, newVal) => {
    const valStr = newVal ? newVal.toISOString() : '';
    if (pos === 'start') onChange(`${prefixKey}_StartDate`, valStr);
    else onChange(`${prefixKey}_EndDate`, valStr);

    const s = pos === 'start' ? newVal : startDate;
    const e = (pos === 'end' ? newVal : endDate) || dayjs(); 

    let w = 0;
    if (s) {
       const startM = s.startOf('month');
       const endM = e.startOf('month');
       if (!startM.isAfter(endM)) {
          const days = endM.diff(startM, 'day') + 1;
          w = Math.ceil(days / 7);
       }
    }
    setVal('Số tuần bị đợt này', w);
  };

  const treatmentVal = getVal('Có điều trị hay không?');
  const showMedicine = treatmentVal === 'Có';
  const statusVal = getVal('Tình trạng tổn thương khi đang uống thuốc');
  const showSymptoms = statusVal === 'Giảm xuống' || statusVal === 'Nặng lên';

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: isMainEpisode ? '#fff' : '#f9f9f9' }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main', textTransform: 'uppercase' }}>
        {title}
      </Typography>

      <Stack spacing={2}>
        <Stack spacing={1}>
            <Typography variant="body2">Thời gian (Từ tháng... đến tháng...)</Typography>
            <Stack direction="row" spacing={2}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker 
                        label="Từ tháng" views={['month', 'year']} format="MM/YYYY"
                        value={startDate} 
                        onChange={(v) => handleDateChange('start', v)}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                    <DatePicker 
                        label="Đến tháng" views={['month', 'year']} format="MM/YYYY"
                        value={endDate} 
                        onChange={(v) => handleDateChange('end', v)}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                </LocalizationProvider>
            </Stack>
        </Stack>

        <TextField
            label="Số tuần bị đợt này" size="small" type="number"
            value={weeksVal}
            InputProps={{ readOnly: true }}
        />

        <ClearableSelect
            name={`treat_${safePrefix}`}
            label={isMainEpisode 
                ? "Đợt bệnh này bạn đã điều trị hay chưa? (1 đợt bệnh liên tục có nghĩa là bị ít nhất 2 ngày/tuần)" 
                : "Có điều trị hay không?"}
            value={treatmentVal}
            options={['Có', 'Không', 'Không nhớ']}
            onChange={(v) => setVal('Có điều trị hay không?', v)}
        />

        <Box sx={{ pl: 2, borderLeft: '2px solid #eee', display: showMedicine ? 'block' : 'none' }}>
            <Stack spacing={2}>
                <TextField 
                    label="Tên thuốc" size="small" 
                    value={getVal('Tên thuốc')} 
                    onChange={(e) => setVal('Tên thuốc', e.target.value)} 
                />
                <TextField 
                    label="Liều thuốc (ghi thời gian nếu nhớ)" size="small" 
                    value={getVal('Liều thuốc (ghi thời gian nếu nhớ)')} 
                    onChange={(e) => setVal('Liều thuốc (ghi thời gian nếu nhớ)', e.target.value)} 
                />
                
                <ClearableSelect
                    name={`status_${safePrefix}`}
                    label="Tình trạng tổn thương khi đang uống thuốc"
                    value={statusVal}
                    options={['Hết hoàn toàn', 'Không hết', 'Giảm xuống', 'Nặng lên']}
                    onChange={(v) => setVal('Tình trạng tổn thương khi đang uống thuốc', v)}
                />

                <ClearableSelect
                    name={`symptom_${safePrefix}`}
                    hidden={!showSymptoms}
                    label="Triệu chứng Giảm xuống/ Nặng lên là gì?"
                    value={getVal('Triệu chứng Giảm xuống/ Nặng lên là gì?')}
                    options={['Nốt đỏ', 'Ngứa', 'Cả hai']}
                    onChange={(v) => setVal('Triệu chứng Giảm xuống/ Nặng lên là gì?', v)}
                />
            </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};

function LabResultTable({ title, indicators, values, onChange, extraQuestions }) {
  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f5f5f5", borderBottom: "1px solid #ddd" }}>
              <th style={{ padding: 8 }}>Chỉ số</th>
              <th style={{ padding: 8 }}>Kết quả</th>
              <th style={{ padding: 8 }}>Tiêu chuẩn</th>
              <th style={{ padding: 8 }}>Đơn vị</th>
            </tr>
          </thead>
          <tbody>
            {indicators.map((ind) => {
              const val = values[ind.id]?.value ?? "";
              const standard = LAB_STANDARD_RANGES[normalizeLabName(ind.name)] || "—";
              return (
                <tr key={ind.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: 8 }}>{ind.name}</td>
                  <td style={{ padding: 8, width: 160 }}>
                    <TextField
                      size="small" fullWidth type="number" value={val}
                      onChange={(e) => onChange(ind.id, { value: e.target.value, note: "" })}
                    />
                  </td>
                  <td style={{ padding: 8 }}>{standard}</td>
                  <td style={{ padding: 8 }}>{ind.unit || ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Paper>
      {extraQuestions && extraQuestions.length > 0 && (
        <Stack spacing={2}>
          {extraQuestions.map((ind) => (
            <QuestionRendererMUI
              key={ind.id}
              indicator={ind}
              value={values[ind.id]}
              onChange={(val) => onChange(ind.id, val)}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function CustomTableRenderer({ indicator, value, onChange }) {
  const groups = indicator.valueOptions?.group || [];
  const fields = groups[0]?.fields || [];
  const currentValues = value?.value || {};

  // 3. Hàm update dữ liệu
  const handleChange = (fieldLabel, newVal) => {
    // Clone data cũ và cập nhật field đang sửa
    const nextValues = { ...currentValues, [fieldLabel]: newVal };
    
    onChange({
      value: nextValues,
      note: ''
    });
  };

  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      <Typography variant="subtitle1" fontWeight="bold">
        {indicator.name}
      </Typography>

      <Paper variant="outlined" sx={{ p: 0, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Chỉ số</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '120px' }}>Kết quả</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Đơn vị</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Tiêu chuẩn</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.map((field, index) => {
              // Lấy giá trị hiện tại
              const val = currentValues[field.label] ?? "";
              
              // Tạo chuỗi hiển thị min-max (Ví dụ: 4 - 10)
              let standard = "";
              if (field.minValue !== undefined && field.maxValue !== undefined) {
                standard = `${field.minValue} - ${field.maxValue}`;
              } else if (field.maxValue !== undefined) {
                standard = `< ${field.maxValue}`;
              } else if (field.minValue !== undefined) {
                standard = `> ${field.minValue}`;
              }

              return (
                <TableRow key={index} hover>
                  <TableCell>{field.label}</TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      variant="outlined"
                      fullWidth
                      type="number"
                      placeholder="..."
                      value={val}
                      onChange={(e) => handleChange(field.label, e.target.value)}
                      sx={{ 
                        '& .MuiInputBase-input': { py: 0.5, px: 1 } 
                      }}
                    />
                  </TableCell>
                  <TableCell>{field.unit || ""}</TableCell>
                  <TableCell>{standard}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}

function ControlLevelRenderer({ indicator, value, onChange }) {
  const groupConfig = indicator.valueOptions?.group?.[0] || {};
  const fields = groupConfig.fields || [];
  const groupName = groupConfig.name || ""; 
  const currentValues = value?.value?.[groupName] || {};

  const getScore = (valStr) => {
    if (!valStr) return 0;
    const numberPart = valStr.split(' ')[0]; 
    return parseInt(numberPart, 10) || 0;
  };

  const calculateTotal = (questionLabels, currentData) => {
    return questionLabels.reduce((sum, label) => {
      return sum + getScore(currentData[label]);
    }, 0);
  };

  const handleChange = (changedLabel, changedValue) => {
    const nextValues = { ...currentValues, [changedLabel]: changedValue };
    const uctQuestionLabels = fields.slice(1, 5).map(f => f.label);
    const uctTotal = calculateTotal(uctQuestionLabels, nextValues);
    const actQuestionLabels = fields.slice(6, 10).map(f => f.label);
    const actTotal = calculateTotal(actQuestionLabels, nextValues);

    if (fields[0]?.label === "UCT") nextValues["UCT"] = uctTotal; 
    if (fields[5]?.label === "ACT") nextValues["ACT"] = actTotal;

    onChange({ value: { ...value?.value, [groupName]: nextValues }, note: '' });
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>{indicator.name}</Typography>
      <Stack spacing={2}>
        {fields.map((field, index) => {
          const isScoreField = field.label === "UCT" || field.label === "ACT";
          const val = currentValues[field.label] ?? "";
          if (isScoreField) {
            return (
              <TextField key={index} label={field.label} value={val} variant="filled" size="small"
                InputProps={{ readOnly: true, sx: { fontWeight: 'bold', color: 'primary.main' } }}
                helperText={field.description}
              />
            );
          }
          if (field.type === 'selection') {
            return (
              <Box key={index} sx={{ pl: 2, borderLeft: '2px solid #eee' }}>
                <ClearableSelect label={field.label} value={val} options={field.options} onChange={(newVal) => handleChange(field.label, newVal)} />
              </Box>
            );
          }
          return null;
        })}
      </Stack>
    </Paper>
  );
}

function EpisodeInfoRenderer({ indicator, value, onChange }) {
  const currentData = value?.value || {};
  const handleUpdate = (key, val) => {
    onChange({ value: { ...currentData, [key]: val }, note: '' });
  };

  const historyKey = "Đợt này_Trước đây bạn đã từng bị đợt nào tương tự như vậy chưa?";
  const historyVal = currentData[historyKey];
  const showHistoryCount = historyVal === 'Có';
  const countKey = "Đợt này_Số đợt bị tương tự như đợt này";
  const countVal = currentData[countKey];
  
  let subCount = 0;
  if (showHistoryCount) {
      if (countVal === '1 đợt') subCount = 1;
      if (countVal === '2 đợt') subCount = 2;
      if (countVal === '3 đợt') subCount = 3;
  }

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom dangerouslySetInnerHTML={{ __html: indicator.name }} />
      <EpisodeSingleForm 
        title="Đợt này" prefixKey="Đợt này"
        data={currentData} onChange={handleUpdate} isMainEpisode={true}
      />
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderColor: 'primary.light', bgcolor: '#f0f7ff' }}>
        <Stack spacing={2}>
            <ClearableSelect
                name="main_history_trigger"
                label="Trước đây bạn đã từng bị đợt nào tương tự như vậy chưa?"
                value={historyVal} options={['Có', 'Không']}
                onChange={(v) => handleUpdate(historyKey, v)}
            />
            <ClearableSelect
                hidden={!showHistoryCount}
                name="main_count_trigger"
                label="Số đợt bị tương tự như đợt này"
                value={countVal} options={['1 đợt', '2 đợt', '3 đợt']}
                onChange={(v) => handleUpdate(countKey, v)}
            />
        </Stack>
      </Paper>
      {Array.from({ length: subCount }).map((_, i) => (
        <EpisodeSingleForm key={i} title={`Thông tin đợt ${i + 1}`} prefixKey={`Đợt ${i + 1}`} data={currentData} onChange={handleUpdate} />
      ))}
    </Box>
  );
}

const GenericCustomRenderer = React.memo(function GenericCustomRenderer({
  indicator, value, onChange, onOpenPreview, groupLabelMap
}) {
  const groups = (() => {
    const raw = indicator.valueOptions?.group || indicator.valueOptions?.groups;
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.fields) || Array.isArray(raw.field)) return [raw];
    return [];
  })();

  const setKV = (g, k, v) => {
    const current = value?.value || {};
    onChange({ value: { ...current, [g]: { ...(current[g] || {}), [k]: v } }, note: '' });
  };
  
  // Logic helpers
  const isShapeThis = SHAPE_IDS.has(indicator.id);
  const isDurationThis = Q11_IDS.has(indicator.id);
  const isConditionalTextThis = CONDITIONAL_TEXT_IDS.has(indicator.id);
  const normalize = (s) => String(s ?? '').trim();
  const arrIncludes = (arr, opt) => Array.isArray(arr) && arr.some(a => normalize(a) === normalize(opt));
  const arrRemove = (arr, opt) => (Array.isArray(arr) ? arr.filter(a => normalize(a) !== normalize(opt)) : []);

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
      <Box sx={{ borderLeft: 3, borderColor: 'divider', pl: 2 }}>
        {groups.map((group, gi) => {
          const gKey = groupLabelMap?.[indicator.groupId] || '';
          let fields = group.field || group.fields || [];
          if (fields.length === 0 && (group.label || group.type)) fields = [group];
          const gVal = value?.value?.[gKey] || {};
          const renderedFieldLabels = new Set();

          return (
            <Box key={`${gKey || ''}_${gi}`} sx={{ '&:not(:first-of-type)': { mt: 2 } }}>
              {(gKey || '').trim() !== '' && <Typography variant="subtitle2" gutterBottom>{gKey}</Typography>}
              <Stack spacing={2}>
                {fields.map((field, fi) => {
                  const isConditionalQuestion = indicator.id === 204 || indicator.id === 209;
                  const fKeyRaw = field.label || ``;
                  const fKey = fKeyRaw === '' ? 'chọn 1 đáp án' : fKeyRaw;
                  if (renderedFieldLabels.has(fKey)) return null;
                  if (isConditionalQuestion && field.label === 'Số lần bị khó thở') return null;
                  const fVal = gVal[fKey];
                  const options = field.option || field.options || [];
                  const keyId = `${indicator.id}-${gKey || ''}-${fKey}-${fi}`;
                  const pendingKey = `${indicator.id}::${gKey}::${fKey}`;
                  const isQ5This = Q5_IDS.has(indicator.id);

                  const handleText = (e) => setKV(gKey, fKey, e.target.value);
                  const handleNumber = (e) => setKV(gKey, fKey, e.target.value === '' ? '' : Number(e.target.value));
                  
                  // Logic Conditional Question (204, 209)
                   if (isConditionalQuestion && field.type === 'selection') {
                    const selectKey = fKey;
                    const textKey = 'Số lần bị khó thở'; 
                    const currentSelectValue = gVal[selectKey];
                    const handleSelectChange = (val) => {
                      const currentAllData = value?.value || {};
                      const currentGroupData = currentAllData[gKey] || {};
                      const nextGroupData = { ...currentGroupData, [selectKey]: val };
                      if (val !== 'Có') nextGroupData[textKey] = '';
                      onChange({ value: { ...currentAllData, [gKey]: nextGroupData }, note: '' });
                  };
                  return (
                    <Box key={keyId} sx={{ mt: 1 }}>
                          <ClearableSelect label={indicator.name || ""} value={currentSelectValue ?? ''} options={options} onChange={handleSelectChange} />
                          {currentSelectValue === 'Có' && (
                              <TextField key={`${keyId}-conditional-text`} size="small" fullWidth sx={{ mt: 2 }} label="Số lần bị khó thở" placeholder="Nhập số lần..." value={gVal[textKey] ?? ''} onChange={(e) => setKV(gKey, textKey, e.target.value)} />
                          )}
                    </Box>
                  );
                  }

                  if (isShapeThis && field.label && field.label.toLowerCase().includes('mô tả hình dạng khác')) return null;
                  if (isDurationThis && field.label === 'Nhập khoảng thời gian') return null;
                  if (isConditionalTextThis && field.label === 'Số lần bị khó thở' && field.type === 'text') return null;
                  if (isQ5This && field.label) {
                    const lower = field.label.toLowerCase();
                    if (lower.includes('chi tiết thức ăn') || lower.includes('chi tiết thuốc')) return null;
                  }

                  if (field.type === 'text') return <TextField key={keyId} size="small" fullWidth label={fKey} value={fVal ?? ''} onChange={handleText} />;
                  if (field.type === 'number') return <TextField key={keyId} size="small" fullWidth type="number" inputProps={{ step: 'any' }} label={fKey} value={fVal ?? ''} onChange={handleNumber} />;
                  if (field.type === 'full_date') {
                    return (
                      <Box key={keyId}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DatePicker label={fKey} format="DD/MM/YYYY" value={fVal ? dayjs(fVal, 'DD/MM/YYYY') : null}
                            onChange={(date) => { const formatted = date ? dayjs(date).format('DD/MM/YYYY') : ''; setKV(gKey, fKey, formatted); }}
                            slotProps={{ textField: { size: 'small', fullWidth: true } }}
                          />
                        </LocalizationProvider>
                      </Box>
                    );
                  }

                  if (field.type === 'selection' || field.type === 'select') {
                    const reqTextField = Array.isArray(field.requiredFields) ? field.requiredFields.find(r => r.type === 'text') : null;
                    const reqCondition = reqTextField ? (reqTextField.condition || reqTextField.condiction) : null;
                    const extraTextLabel = reqTextField ? reqTextField.description : `${fKey} - Chi tiết`;
                    const handleSelect = (v) => {
                        if (reqTextField && v !== reqCondition) setKV(gKey, extraTextLabel, '');
                        setKV(gKey, fKey, v);
                    };
                    if (isDurationThis && (fKey === '11.1 Khi dùng thuốc' || fKey === '11.2 Khi không dùng thuốc' || fKey.includes('4.1') || fKey.includes('4.2'))) {
                        const otherInputField = fields.find(f => f.label === 'Nhập khoảng thời gian' && f.type === 'text');
                        const otherInputKey = otherInputField ? 'Nhập khoảng thời gian' : `${fKey} - Khác (theo giờ)`;
                        return (
                          <Box key={keyId}>
                            <ClearableSelect label={fKey} value={fVal ?? ''} options={options} onChange={handleSelect} />
                            {reqTextField && fVal === reqCondition && (
                                  <Box sx={{ mt: 1, ml: 2, p: 1, borderLeft: '2px solid #ccc' }}>
                                    <TextField key={`${keyId}-extra-text`} size="small" fullWidth label={extraTextLabel} placeholder={extraTextLabel} value={gVal[extraTextLabel] || ''} onChange={(e) => setKV(gKey, extraTextLabel, e.target.value)} />
                                  </Box>
                            )}
                            {fVal === 'Khác (theo giờ)' && (
                              <Box sx={{ mt: 1 }}>
                                <TextField key={`${keyId}-other-hours`} size="small" fullWidth label="Nhập khoảng thời gian" value={gVal[otherInputKey] || ''} onChange={(e) => setKV(gKey, otherInputKey, e.target.value)} />
                              </Box>
                            )}
                          </Box>
                        );
                    }
                    if (isConditionalTextThis && fKey === 'chọn 1 đáp án') {
                        const selectedOption = gVal[fKey];
                        const textControl = fields.find((f, index) => index > fi && f.label === 'Số lần bị khó thở' && f.type === 'text');
                        const textKey = textControl?.label;
                        if (textKey) renderedFieldLabels.add(textKey); 
                        const handleConditionalSelect = (v) => { setKV(gKey, fKey, v); if (normalize(v) !== 'Có' && textKey) setKV(gKey, textKey, ''); };
                        return (
                            <Box key={keyId}>
                                <ClearableSelect label="" name={keyId} value={selectedOption ?? ''} options={options} onChange={handleConditionalSelect} />
                                {textKey && normalize(selectedOption) === 'Có' && (
                                    <Box sx={{ mt: 1 }}>
                                        <TextField key={`${keyId}-conditional-text`} size="small" fullWidth label={textKey} type="number" inputProps={{ step: '1', min: '0' }} value={gVal[textKey] ?? ''} onChange={(e) => setKV(gKey, textKey, e.target.value)} />
                                    </Box>
                                )}
                            </Box>
                        );
                    }
                    return <Box key={keyId}><ClearableSelect label={fKey} value={fVal ?? ''} options={options} onChange={handleSelect} /></Box>;
                  }

                  if (field.type === 'multi_selection') {
                    const arr = Array.isArray(fVal) ? fVal : [];
                    if (isQ5This) {
                      const hasFood = arrIncludes(arr, 'Thức ăn');
                      const hasDrug = arrIncludes(arr, 'Chống viêm, giảm đau');
                      const toggle = (opt) => {
                        const updated = arrIncludes(arr, opt) ? arrRemove(arr, opt) : [...arr, opt];
                        setKV(gKey, fKey, updated);
                      };
                      const labelsRenderedLocal = new Set();
                      return (
                        <Box key={keyId} sx={{ mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{fKey || 'Chọn yếu tố làm nặng bệnh'}</Typography>
                          <FormGroup>
                            {['Stress', 'Thức ăn', 'Chống viêm, giảm đau'].map((opt) => (
                              <FormControlLabel key={opt} control={<Checkbox size="small" checked={arrIncludes(arr, opt)} onChange={() => toggle(opt)} />} label={opt} />
                            ))}
                          </FormGroup>
                          {hasFood && fields.filter((fld) => fld.label && fld.label.toLowerCase().includes('chi tiết thức ăn') && !labelsRenderedLocal.has(fld.label)).map((fld) => {
                                labelsRenderedLocal.add(fld.label);
                                return <TextField key={fld.label} size="small" fullWidth sx={{ mt: 1 }} label={fld.label} placeholder={fld.placeholder} value={gVal[fld.label] || ''} onChange={(e) => setKV(gKey, fld.label, e.target.value)} />;
                              })}
                          {hasDrug && fields.filter((fld) => fld.label && fld.label.toLowerCase().includes('chi tiết thuốc') && !labelsRenderedLocal.has(fld.label)).map((fld) => {
                                labelsRenderedLocal.add(fld.label);
                                return <TextField key={fld.label} size="small" fullWidth sx={{ mt: 1 }} label={fld.label} placeholder={fld.placeholder} value={gVal[fld.label] || ''} onChange={(e) => setKV(gKey, fld.label, e.target.value)} />;
                              })}
                        </Box>
                      );
                    }
                    if (isShapeThis && fKey === 'Chọn hình dạng bạn gặp phải') {
                      const toggleShape = (opt) => {
                        const updated = arrIncludes(arr, opt) ? arrRemove(arr, opt) : [...arr, opt];
                        if (!arrIncludes(updated, 'Hình dạng khác')) setKV(gKey, 'Mô tả hình dạng khác', '');
                        setKV(gKey, fKey, updated);
                      };
                      const otherSelected = arrIncludes(arr, 'Hình dạng khác');
                      const otherValue = gVal['Mô tả hình dạng khác'] ?? '';
                      return (
                        <Box key={keyId}>
                           <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{fKey}</Typography>
                           <FormGroup>{(options || []).map((opt, idx) => (
                               <FormControlLabel key={`${keyId}-opt-${idx}`} control={<Checkbox size="small" checked={arrIncludes(arr, opt)} onChange={() => toggleShape(opt)} />} label={opt} />
                             ))}</FormGroup>
                           {otherSelected && <TextField key={`${keyId}-other-input`} size="small" fullWidth sx={{ mt: 1 }} label="Mô tả hình dạng khác" placeholder="Nhập mô tả" value={otherValue} onChange={(e) => setKV(gKey, 'Mô tả hình dạng khác', e.target.value)} />}
                        </Box>
                      );
                    }
                    const arrVal = arr;
                    const renderOptions = () => {
                      let list = options;
                      if (Q4_IDS.has(indicator.id) && (fKey.includes('4.') || indicator.id === 190 || indicator.id === 65)) {
                        const baseTwo = ['Một cách ngẫu nhiên', 'Khi có các yếu tố kích thích'];
                        const showExtra = arrIncludes(arrVal, 'Khi có các yếu tố kích thích');
                        list = showExtra ? options : options.filter((o) => baseTwo.includes(o));
                      }
                      return list;
                    };
                    return (
                      <Box key={keyId}>
                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{fKey || 'Chọn'}</Typography>
                        <FormGroup>{renderOptions().map((opt, idx) => {
                            const checked = arrIncludes(arrVal, opt);
                            const toggle = () => { const updated = checked ? arrRemove(arrVal, opt) : [...arrVal, opt]; setKV(gKey, fKey, updated); };
                            const reqField = Array.isArray(field.requiredFields) ? field.requiredFields.find((r) => r.type === 'image' && r.condition === 'hasSelection') : null;
                            const pendingKey2 = `${indicator.id}::${gKey}::${fKey}::${opt}`;
                            const previews = getPending(pendingKey2);
                            const handleFilesChange = (e) => {
                              const selected = Array.from(e.target.files || []);
                              if (!selected.length) return;
                              const newPreviews = selected.map(makePreviewItem);
                              setPending(pendingKey2, [...previews, ...newPreviews]);
                              setKV(gKey, `${fKey}__${opt}__images`, [...previews, ...newPreviews]);
                            };
                            const handleRemoveFile = (i) => {
                              const updated = previews.filter((_, j) => j !== i);
                              setPending(pendingKey2, updated);
                              setKV(gKey, `${fKey}__${opt}__images`, updated);
                            };
                            return (
                              <Box key={`${keyId}-opt-${idx}`} sx={{ mb: 1 }}>
                                <FormControlLabel control={<Checkbox size="small" checked={checked} onChange={toggle} />} label={opt} />
                                {checked && reqField && (
                                  <Stack spacing={1} sx={{ ml: 4, mt: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">{reqField.description || 'Tải ảnh'}</Typography>
                                    <Button variant="outlined" component="label" size="small" sx={{ width: 'fit-content' }}>Tải ảnh <input hidden multiple accept="image/*" type="file" onChange={handleFilesChange} /></Button>
                                    {previews.length > 0 && <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.5 }}>{previews.map((item, i) => (<Box key={`${keyId}-prev-${idx}-${i}`} sx={{ position: 'relative' }}><Box component="img" src={item.src} alt={item.name} onClick={() => onOpenPreview && onOpenPreview(item.src)} sx={{ width: 70, height: 70, borderRadius: 1, border: '1px solid #ccc', objectFit: 'cover', cursor: 'zoom-in' }} /><IconButton size="small" onClick={() => handleRemoveFile(i)} sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' } }}><CloseIcon fontSize="small" /></IconButton></Box>))}</Stack>}
                                  </Stack>
                                )}
                              </Box>
                            );
                          })}</FormGroup>
                      </Box>
                    );
                  }

                  if (field.type === 'image') {
                    const previews = getPending(pendingKey);
                    const handleFilesChange = (e) => {
                      const selected = Array.from(e.target.files || []);
                      if (!selected.length) return;
                      const newPreviews = selected.map(makePreviewItem);
                      setPending(pendingKey, [...previews, ...newPreviews]);
                      setKV(gKey, fKey, [...previews, ...newPreviews]);
                    };
                    const handleRemoveFile = (index) => {
                      const updated = previews.filter((_, i) => i !== index);
                      setPending(pendingKey, updated);
                      setKV(gKey, fKey, updated);
                    };
                    return (
                      <Stack key={keyId} spacing={1} alignItems="flex-start">
                        <Typography variant="subtitle2">{fKey}</Typography>
                        <Button variant="outlined" component="label" size="small">Tải ảnh <input hidden multiple accept="image/*" type="file" onChange={handleFilesChange} /></Button>
                        {previews.length > 0 && <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>{previews.map((item, i) => (<Box key={`${keyId}-prev-${i}`} sx={{ position: 'relative' }}><Box component="img" src={item.src} alt={item.name} onClick={() => onOpenPreview && onOpenPreview(item.src)} sx={{ width: 80, height: 80, borderRadius: 1, border: '1px solid #ccc', objectFit: 'cover', cursor: 'zoom-in' }} /><IconButton size="small" onClick={() => handleRemoveFile(i)} sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' } }}><CloseIcon fontSize="small" /></IconButton></Box>))}</Stack>}
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
  indicator, value, onChange, onOpenPreview, groupLabelMap
}) {
  if (EPISODE_IDS.has(indicator.id) || EPISODE_CODES.has(indicator.code)) {
    return <EpisodeInfoRenderer indicator={indicator} value={value} onChange={onChange} groupLabelMap={groupLabelMap} />;
  }
  if (Q4_IDS.has(indicator.id) && indicator.valueType === 'multi_selection') {
    return (
      <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="bold" component="div" dangerouslySetInnerHTML={{ __html: indicator.name }} />
        <Q4MultiSelect indicator={indicator} value={value} onChange={onChange} />
      </Paper>
    );
  }

  const handleTextChange = (e) => onChange({ value: e.target.value, note: '' });
  const handleNumberChange = (e) => onChange({ value: e.target.value === '' ? '' : Number(e.target.value), note: '' });
  const pendingKey = `${indicator.id}`;

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
      <Typography variant="subtitle1" gutterBottom fontWeight="bold" component="div" dangerouslySetInnerHTML={{ __html: indicator.name }} />
      {(() => {
        switch (indicator.valueType) {
          case 'text': return <TextField fullWidth label="Câu trả lời" value={value?.value ?? ''} onChange={handleTextChange} />;
          case 'number': return <TextField fullWidth label="Câu trả lời" type="number" inputProps={{ step: 'any' }} value={value?.value ?? ''} onChange={handleNumberChange} />;
          case 'full_date': {
            const parsedDate = value?.value ? dayjs(value.value, ['DD/MM/YYYY', 'YYYY-MM-DD', 'ISO 8601']) : null;
            return (
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker format="DD/MM/YYYY" value={parsedDate?.isValid() ? parsedDate : null} onChange={(newVal) => { const formatted = newVal ? dayjs(newVal).format('DD/MM/YYYY') : ''; onChange({ value: formatted, note: '' }); }} slotProps={{ textField: { fullWidth: true, size: 'medium' } }} />
              </LocalizationProvider>
            );
          }
          case 'selection': return <ClearableSelect label="Chọn một đáp án" value={value?.value ?? ''} options={indicator.valueOptions || []} onChange={(v) => onChange({ value: v, note: '' })} />;
          case 'multi_selection': return <ClearableMultiSelect label="Chọn nhiều đáp án" value={value?.value || []} options={indicator.valueOptions || []} onChange={(v) => onChange({ value: v, note: '' })} />;
          case 'image': {
            const previews = getPending(pendingKey);
            const handleFilesChange = (e) => {
              const selected = Array.from(e.target.files || []);
              if (!selected.length) return;
              const newPreviews = selected.map(makePreviewItem);
              setPending(pendingKey, [...previews, ...newPreviews]);
              onChange({ value: [...previews, ...newPreviews], note: '' });
            };
            const handleRemoveFile = (index) => {
              const updated = previews.filter((_, i) => i !== index);
              setPending(pendingKey, updated);
              onChange({ value: updated, note: '' });
            };
            useEffect(() => { if (!Array.isArray(value?.value)) onChange({ value: previews, note: '' }); }, []);
            return (
              <Stack spacing={1} alignItems="flex-start">
                <Button variant="outlined" component="label" size="small">Tải ảnh <input hidden multiple accept="image/*" type="file" onChange={handleFilesChange} /></Button>
                {previews.length > 0 && <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>{previews.map((item, i) => (<Box key={`img-prev-${i}`} sx={{ position: 'relative' }}><Box component="img" src={item.src} alt={item.name} onClick={() => onOpenPreview && onOpenPreview(item.src)} sx={{ width: 80, height: 80, borderRadius: 1, border: '1px solid #ccc', objectFit: 'cover', cursor: 'zoom-in' }} /><IconButton size="small" onClick={() => handleRemoveFile(i)} sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' } }}><CloseIcon fontSize="small" /></IconButton></Box>))}</Stack>}
              </Stack>
            );
          }
          case 'custom': return <GenericCustomRenderer indicator={indicator} value={value} onChange={onChange} onOpenPreview={onOpenPreview} groupLabelMap={groupLabelMap} />;
          default: return <Typography color="error">Loại câu hỏi không được hỗ trợ {indicator.valueType}</Typography>;
        }
      })()}
    </Paper>
  );
}, (prev, next) => prev.indicator?.id === next.indicator?.id && prev.value === next.value);

// ==== MAIN COMPONENT ====
export function DetailViewMedicalRecord() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [uploadProgressMap, setUploadProgressMap] = useState({});
  const [record, setRecord] = useState(null);
  const [template, setTemplate] = useState(null);
  const [vitalGroups, setVitalGroups] = useState([]);
  const [groupLabelMap, setGroupLabelMap] = useState({});
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [selectedQ192, setSelectedQ192] = useState(null);
  const [selectedQ62, setSelectedQ62] = useState(null);

  const updateProgress = (key, pct) => setUploadProgressMap((m) => ({ ...m, [key]: pct }));
  
  const templateId = record?.template?.id;
  const isAcuteTemplate = templateId === 16;
  const isChronic1Template = templateId === 17;

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        const recordRes = await getMedicalRecordById(id);
        const recData = recordRes?.data;
        if (!recData) throw new Error('Không tìm thấy bệnh án.');
        setRecord(recData);

        const tplRes = await getMedicalRecordTemplateById(recData.template.id);
        const tpl = tplRes?.data;
        if (!tpl) throw new Error('Không tải được template.');
        setTemplate(tpl);

        const orderedIds = Array.from(new Set(tpl.vitalGroupIds)).filter(Boolean);
        const resGroups = await Promise.all(
          orderedIds.map(async (gid) => {
            try { const r = await getVitalGroupById(gid); return r?.data ?? null; } catch { return null; }
          })
        );
        const groups = resGroups.filter(Boolean);
        setVitalGroups(groups);

        const gmap = {};
        groups.forEach((g) => { gmap[g.id] = (g.label && typeof g.label === 'string') ? g.label.trim() : ''; });
        setGroupLabelMap(gmap);

        const vitalValuesRes = await getVitalValuesMedicalRecord(recData.id);
        const vitals = vitalValuesRes?.data || [];

        const formMap = {};
        vitals.forEach((v) => {
          const indicatorId = Number(v.vitalIndicatorId);
          let normalized = normalizeVitalValue(v.value);

          // Cần map lại object nếu là câu hỏi dạng Group/Custom
          // Logic này cực kỳ quan trọng để Render Custom hoạt động đúng
          if (EPISODE_IDS.has(indicatorId) || EPISODE_CODES.has(v.indicatorCode)) {
             const groupLabel = gmap[Object.keys(gmap)[0]] || 'Thông tin chính'; // Tạm thời lấy label đầu tiên
             // Nếu normalized đã là object rồi thì thôi, nếu không thì wrap
             // Tuy nhiên, logic chuẩn hóa từ API có thể đã parse ra object. 
             // Form cần { "Label Nhóm": { ...data } }
             // Nếu normalized đã có key trùng với gmap[v.groupId] thì ok.
             // Do logic backend trả về có thể khác nhau, ta giữ nguyên normalized nếu nó là object.
          }
          if (Q5_IDS.has(indicatorId) || SHAPE_IDS.has(indicatorId)) {
             // Tương tự, GenericCustomRenderer cần object
          }

          // Cập nhật selectedQ192/Q62 nếu có dữ liệu cũ
          if (indicatorId === 192) setSelectedQ192(normalized);
          if (indicatorId === 62) setSelectedQ62(normalized);

          formMap[indicatorId] = { value: normalized, note: v.note || '' };
        });
        setFormData(formMap);
      } catch (e) {
        setError(e?.message || 'Lỗi tải dữ liệu.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (id) fetchAll();
    return () => { cancelled = true; };
  }, [id]);

  const handleVitalValueChange = useCallback((indicatorId, valueObj) => {
    setFormData((prev) => ({ ...prev, [indicatorId]: valueObj }));
  }, []);

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

  const steps = filteredVitalGroups.map((g) => g.name);

  // ==== LOGIC MAP DỮ LIỆU ĐỂ LƯU (QUAN TRỌNG) ====
  const innerOfEpisodeQuestion = (indicator, stored) => {
    const groups = Array.isArray(indicator.valueOptions?.group) ? indicator.valueOptions.group : [];
    if (!groups.length) return null;
    const MAIN_LABEL = (groupLabelMap?.[indicator.groupId] || '');
    const raw = stored?.value || {};
    const labelMap = {
        RANGE_LABEL: 'Đợt này: Từ tháng...năm...đến tháng...năm...', 
        CO_DIEU_TRI: indicator.id === 175 ? 'Đợt bệnh này bạn đã điều trị hay chưa? (1 đợt bệnh liên tục có nghĩa là bị ít nhất 2 ngày/tuần)' : 'Có điều trị hay không?',
        DA_BI_DOT_TUONG_TU: 'Trước đây bạn đã từng bị đợt nào tương tự như vậy chưa?',
        SO_DOT: 'Số đợt bị tương tự như đợt này',
        SO_TUAN: 'Số tuần bị đợt này',
        TEN_THUOC: 'Tên thuốc',
        LIEU_THUOC: 'Liều thuốc (ghi thời gian nếu nhớ)',
        TINH_TRANG: 'Tình trạng tổn thương khi đang uống thuốc',
        TRIEU_CHUNG: 'Triệu chứng Giảm xuống/ Nặng lên là gì?'
    };
    const buildGroup = (obj, isMainGroup = false) => {
        const rangePrefix = isMainGroup ? 'Đợt này' : obj['__group_label_for_range_prefix'] || ''; 
        const rangeStart = obj[`${rangePrefix}:start`];
        const rangeEnd = obj[`${rangePrefix}:end`];
        // Nếu có date picker riêng (từ logic EpisodeSingleForm), state sẽ lưu Đợt này_StartDate
        // Logic EpisodeSingleForm ở trên đang lưu: `${prefixKey}_StartDate`
        const formPrefix = isMainGroup ? 'Đợt này' : `Đợt ${obj.__episode_index}`;
        const sDate = obj[`${formPrefix}_StartDate`];
        const eDate = obj[`${formPrefix}_EndDate`];
        
        let rangeValue = '';
        if (sDate && eDate) {
             rangeValue = `${dayjs(sDate).format('MM/YYYY')} đến ${dayjs(eDate).format('MM/YYYY')}`;
        }

        const co = obj[labelMap.CO_DIEU_TRI] || obj[`${formPrefix}_Có điều trị hay không?`];
        const tt = obj[labelMap.TINH_TRANG] || obj[`${formPrefix}_Tình trạng tổn thương khi đang uống thuốc`];
        const da = obj[labelMap.DA_BI_DOT_TUONG_TU]; // Chỉ có ở main
        const so = obj[labelMap.SO_DOT]; // Chỉ có ở main
        const soTuan = obj[labelMap.SO_TUAN] || obj[`${formPrefix}_Số tuần bị đợt này`];
        const tenThuoc = obj[labelMap.TEN_THUOC] || obj[`${formPrefix}_Tên thuốc`];
        const lieuThuoc = obj[labelMap.LIEU_THUOC] || obj[`${formPrefix}_Liều thuốc (ghi thời gian nếu nhớ)`];
        const trieuChung = obj[labelMap.TRIEU_CHUNG] || obj[`${formPrefix}_Triệu chứng Giảm xuống/ Nặng lên là gì?`];

        const value = {};
        const put = (k, v) => { if (v !== undefined && v !== null && v !== '') value[k] = v; };
        
        if (isMainGroup) {
             put(labelMap.RANGE_LABEL, rangeValue);
             put(labelMap.SO_TUAN, soTuan);
        } else {
             const subRangeLabel = groups.find(g => g.label === formPrefix)?.field?.find(f => f.type === 'range')?.label || formPrefix;
             put(subRangeLabel, rangeValue);
             put(labelMap.SO_TUAN, soTuan);
        }
        put(labelMap.CO_DIEU_TRI, co);
        if (co === 'Có') {
          put(labelMap.TEN_THUOC, tenThuoc);
          put(labelMap.LIEU_THUOC, lieuThuoc);
          put(labelMap.TINH_TRANG, tt);
          if (tt === 'Giảm xuống' || tt === 'Nặng lên') {
            put(labelMap.TRIEU_CHUNG, trieuChung);
          }
        }
        if (isMainGroup) {
            if (da) put(labelMap.DA_BI_DOT_TUONG_TU, da);
            if (so) put(labelMap.SO_DOT, so);
        }
        return value;
    };

    // Do EpisodeSingleForm lưu phẳng (flatten) vào object chính, ta cần gom lại
    // Nhưng stored.value hiện tại đang chứa object lồng nhau (do load từ API).
    // Khi sửa trên UI, EpisodeSingleForm sẽ update vào stored.value theo key phẳng "Đợt này_StartDate"...
    // Nên ta cần merge data cũ (lồng nhau) và data mới (phẳng) ?
    // Thực tế: onChange ở EpisodeInfoRenderer gọi: onChange({ value: { ...currentData, [key]: val } })
    // => stored.value sẽ chứa cả keys cũ và keys mới.
    const main = stored.value || {};
    // Cần mapping keys phẳng từ UI form về cấu trúc lồng nhau
    // Logic này phức tạp, nên để đơn giản ta dùng chính logic buildGroup ở trên để tạo lại object sạch
    
    // Tìm số đợt phụ
    const soDotBiStr = main["Đợt này_Số đợt bị tương tự như đợt này"] || main[labelMap.SO_DOT] || '0 đợt';
    const soDotBi = parseInt(soDotBiStr.split(' ')[0], 10) || 0;

    const result = { [MAIN_LABEL]: buildGroup(main, true) };
    for (let i = 1; i <= soDotBi; i += 1) {
      const lbl = `Thông tin đợt ${i}`;
      // Hack: truyền index để buildGroup biết tìm key prefix
      const subData = { ...main, __episode_index: i }; 
      const sub = buildGroup(subData, false);
      // Chỉ add nếu có dữ liệu
      if (Object.keys(sub).length > 0) {
        result[MAIN_LABEL][lbl] = sub;
      }
    }
    return result;
};

  const handleSubmitUpdate = async () => {
    try {
      setError(null);
      const groupId = record?.patient?.id || 0;
      const templateIdNum = record?.template?.id || 0;

      const pool = {
        running: 0, queue: [],
        next() { while (this.running < UPLOAD_CONCURRENCY && this.queue.length) { const job = this.queue.shift(); job && job(); } }
      };

      const resolvedVitalValues = {};
      for (const [idStr, data] of Object.entries(formData)) {
        if (!data) continue;
        const indicatorId = Number(idStr);
        const cloned = JSON.parse(JSON.stringify(data));
        const resolved = {
          ...cloned,
          value: await resolveUploadsDeepConcurrent(cloned.value, groupId, templateIdNum, updateProgress, [indicatorId], pool)
        };
        resolvedVitalValues[indicatorId] = resolved;
      }

      await new Promise((r) => { const tick = () => pool.running === 0 && pool.queue.length === 0 ? r(0) : setTimeout(tick, 100); tick(); });

      const indicatorMap = {};
      vitalGroups.forEach((g) => g.indicators?.forEach((ind) => (indicatorMap[ind.id] = ind)));

      const formattedVitalValues = [];
      for (const [idStr, data] of Object.entries(resolvedVitalValues)) {
        const indicator = indicatorMap[Number(idStr)];
        if (!indicator) continue;

        let inner = data?.value;
        // Áp dụng logic map đặc biệt cho Episode
        if (EPISODE_IDS.has(indicator.id) || EPISODE_CODES.has(indicator.code)) {
             inner = innerOfEpisodeQuestion(indicator, data);
        }
        
        // Loại bỏ value rỗng
        const isNilOrEmpty2 = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0) || (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);
        if (isNilOrEmpty2(inner)) continue;

        formattedVitalValues.push({
          vitalIndicatorId: parseInt(idStr, 10),
          value: { value: inner },
          note: data?.note || ''
        });
      }

      if (formattedVitalValues.length) {
        await updateVitalMedicalRecordById(record.id, { vitalValues: formattedVitalValues });
      }

      clearPendingStartsWith(PENDING_PREFIX);
      alert('Cập nhật bệnh án thành công!');
      router.back();
    } catch (err) {
      setError(err?.message || 'Lỗi khi cập nhật bệnh án');
    } finally {
      setUploadProgressMap({});
    }
  };

  if (loading) return <Container maxWidth="sm" sx={{ my: 6, textAlign: 'center' }}><CircularProgress /><Typography variant="body2" sx={{ mt: 2 }}>Đang tải dữ liệu...</Typography></Container>;

  const renderStepContent = (stepIdx) => {
    const group = filteredVitalGroups[stepIdx];
    if (!group) return null;

    if (isAcuteTemplate && group.id === 12) {
      const q192 = group.indicators.find((i) => i.id === 192);
      const handleQ192Change = (val) => { setSelectedQ192(val?.value || null); handleVitalValueChange(q192.id, val); };
      if (!selectedQ192 || selectedQ192 === 'Phù mạch') return <Stack spacing={2}><QuestionRendererMUI key={q192.id} indicator={q192} value={formData[q192.id]} onChange={handleQ192Change} onOpenPreview={(src) => setPreviewSrc(src)} groupLabelMap={groupLabelMap} /></Stack>;
      return (
        <Stack spacing={2}>
            {group.indicators.map((indicator) => {
                if (indicator.id === 97) return <ControlLevelRenderer key={indicator.id} indicator={indicator} value={formData[indicator.id]} onChange={(val) => handleVitalValueChange(indicator.id, val)} />;
                return <QuestionRendererMUI key={indicator.id} indicator={indicator} value={formData[indicator.id]} onChange={(val) => handleVitalValueChange(indicator.id, val)} onOpenPreview={(src) => setPreviewSrc(src)} groupLabelMap={groupLabelMap} />;
            })}
        </Stack>
      );
    }

    if (isChronic1Template && group.id === 27) {
      const q62 = group.indicators.find((i) => i.id === 62);
      const others = group.indicators.filter((i) => i.id !== 62);
      const handleQ62Change = (val) => { setSelectedQ62(val?.value || null); handleVitalValueChange(q62.id, val); };
      if (!selectedQ62 || selectedQ62 === 'Phù mạch') return <Stack spacing={2}><QuestionRendererMUI key={q62.id} indicator={q62} value={formData[q62.id]} onChange={handleQ62Change} onOpenPreview={(src) => setPreviewSrc(src)} groupLabelMap={groupLabelMap} /></Stack>;
      return (
        <Stack spacing={2}>
          <QuestionRendererMUI key={q62.id} indicator={q62} value={formData[q62.id]} onChange={handleQ62Change} onOpenPreview={(src) => setPreviewSrc(src)} groupLabelMap={groupLabelMap} />
          {others.map((i) => <QuestionRendererMUI key={i.id} indicator={i} value={formData[i.id]} onChange={(val) => handleVitalValueChange(i.id, val)} onOpenPreview={(src) => setPreviewSrc(src)} groupLabelMap={groupLabelMap} />)}
        </Stack>
      );
    }
    
    if (group.id === 23) return <LabResultTable indicators={group.indicators} values={formData} onChange={handleVitalValueChange} />;
    return (
          <Stack spacing={2}>
            {group.indicators.map((indicator) => {
              if (indicator.id === 97) {
                return (
                  <ControlLevelRenderer
                    key={indicator.id}
                    indicator={indicator}
                    value={formData[indicator.id]}
                    onChange={(val) => handleVitalValueChange(indicator.id, val)}
                  />
                );
              }
              if (indicator.id === 99){
                return (
                  <CustomTableRenderer
                    key={indicator.id}
                    indicator={indicator}
                    value={formData[indicator.id]}
                    onChange={(val) => handleVitalValueChange(indicator.id, val)}
                  />
                );
              }
              return (
                <QuestionRendererMUI key={indicator.id} indicator={indicator} value={formData[indicator.id]} onChange={(val) => handleVitalValueChange(indicator.id, val)} onOpenPreview={(src) => setPreviewSrc(src)} groupLabelMap={groupLabelMap} />
              );
            })}
          </Stack>
        );
  };

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.back()}>Quay lại</Button>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1, textAlign: 'center' }}>Chỉnh sửa bệnh án #{record?.id}</Typography>
      </Box>

      {Object.keys(uploadProgressMap).length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Đang tải ảnh...</Typography>
          <LinearProgress />
        </Paper>
      )}

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label, i) => (
          <Step key={i}><StepLabel onClick={() => setActiveStep(i)} sx={{ cursor: 'pointer' }}>{label}</StepLabel></Step>
        ))}
      </Stepper>

      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, mb: 8 }}>
        <Typography variant="h5" gutterBottom>{steps[activeStep]}</Typography>
        {error && <Alert severity="error" sx={{ mb: 3, mt: 2 }}>{error}</Alert>}
        {renderStepContent(activeStep)}
      </Paper>

      <Paper elevation={6} sx={{ position: 'fixed', left: 0, right: 0, bottom: 0, py: 1.5, px: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button variant="outlined" disabled={activeStep === 0} onClick={() => setActiveStep((p) => p - 1)}>Quay lại</Button>
          {activeStep < steps.length - 1 ? <Button variant="contained" onClick={() => setActiveStep((p) => p + 1)}>Tiếp theo</Button> : <Button variant="contained" color="success" onClick={handleSubmitUpdate}>Lưu cập nhật</Button>}
        </Box>
      </Paper>

      <Dialog open={Boolean(previewSrc)} onClose={() => setPreviewSrc(null)} maxWidth="md" fullWidth>
        <DialogTitle>Xem ảnh</DialogTitle>
        <DialogContent>{previewSrc ? <Box component="img" src={previewSrc} alt="preview" sx={{ width: '100%', borderRadius: 1 }} /> : null}</DialogContent>
        <DialogActions><Button onClick={() => setPreviewSrc(null)}>Đóng</Button></DialogActions>
      </Dialog>
    </Container>
  );
}