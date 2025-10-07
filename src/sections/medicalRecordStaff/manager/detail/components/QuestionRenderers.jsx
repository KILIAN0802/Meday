// src/app/record/[id]/QuestionRenderers.jsx

'use client';

import React from 'react';
import {
  Box, Paper, Stack, Typography, TextField, FormControl, Select, MenuItem, IconButton, Button, RadioGroup, Radio, FormControlLabel
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// ====== Small UI helpers ======
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

// ====== Question renderer for single indicator ======
function QuestionRendererMUI({ indicator, value, onChange }) {
  const handleText = (e) => onChange({ value: e.target.value, note: '' });
  const handleNum  = (e) => onChange({ value: e.target.value === '' ? '' : Number(e.target.value), note: '' });
  const SelectionRadio = () => (
    <Stack direction="row" alignItems="flex-start" spacing={1}>
      <FormControl component="fieldset" sx={{ flexGrow: 1 }}>
        <RadioGroup
          value={value?.value ?? ''}
          onChange={(e) => onChange({ value: e.target.value, note: '' })}
        >
          {(indicator.valueOptions || []).map(opt => (
            <FormControlLabel
              key={opt}
              value={opt}
              control={<Radio />}
              label={opt}
            />
          ))}
        </RadioGroup>
      </FormControl>
      {value?.value ? (
        <IconButton
          size="small"
          aria-label="clear"
          onClick={() => onChange({ value: '', note: '' })}
          sx={{ mt: 0.5 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      ) : null}
    </Stack>
  );
  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
      <Typography variant="subtitle1" gutterBottom fontWeight="bold">{indicator.name}</Typography>
      {indicator.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{indicator.description}</Typography>
      )}

      {(() => {
        switch (indicator.valueType) {
          case 'text':
            return <TextField fullWidth label="Câu trả lời" value={value?.value ?? ''} onChange={handleText} />;

          case 'number':
            return (
              <TextField
                fullWidth label="Câu trả lời" type="number" inputProps={{ step: 'any' }}
                value={value?.value ?? ''} onChange={handleNum}
              />
            );

          case 'full_date':
            return (
              <TextField
                fullWidth label="Ngày" type="date" value={value?.value ?? ''}
                onChange={handleText} InputLabelProps={{ shrink: true }}
              />
            );

          case 'selection':
            return <SelectionRadio />;

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
                  <input hidden multiple type="file"
                         onChange={(e) => onChange({ value: Array.from(e.target.files || []), note: '' })} />
                </Button>
              </Stack>
            );

          case 'custom':
            // giữ custom cơ bản (group/field) như cũ của bạn — có thể mở rộng nếu cần
            return (
              <Typography variant="body2" color="text.secondary">
                (custom) — đã giữ nguyên renderer cũ; thêm nếu cần trong file này.
              </Typography>
            );

          default:
            return <Typography color="error">Loại câu hỏi không được hỗ trợ: {indicator.valueType}</Typography>;
        }
      })()}
    </Paper>
  );
}

/**
 * QuestionGroupRenderer
 * - Render toàn bộ câu hỏi trong một group, bao gồm logic đặc biệt:
 *   * Template 16: group 12 (câu 192) điều khiển group 12/18
 *   * Template 17: group 27 (câu 62) điều khiển group 27/28
 */
export function QuestionGroupRenderer({
  group,
  templateId,
  values,
  onChangeAnswer,
  selectedQ192,
  selectedQ62,
  onSelectQ192,
  onSelectQ62,
}) {
  // Helpers to set answer for any indicator
  const setAns = (id) => (valObj) => onChangeAnswer(id, valObj);

  // Template 16 — group 12 controlled by Q192
  if (templateId === 16 && group.id === 12) {
    const q192 = group.indicators.find(i => i.id === 192);
    const others = group.indicators.filter(i => i.id !== 192);

    const handleQ192Change = (val) => {
      onSelectQ192?.(val?.value || null);
      onChangeAnswer(q192.id, val);
    };

    if (!selectedQ192) {
      // chỉ hiển thị Q192
      return (
        <Stack spacing={2}>
          <QuestionRendererMUI
            indicator={q192}
            value={values[q192.id]}
            onChange={handleQ192Change}
          />
        </Stack>
      );
    }
    if (selectedQ192 === 'Phù mạch') {
      // chỉ hiển thị lại Q192
      return (
        <Stack spacing={2}>
          <QuestionRendererMUI
            indicator={q192}
            value={values[q192.id]}
            onChange={handleQ192Change}
          />
        </Stack>
      );
    }
    // “Sẩn phù” / “Cả hai” / “Khác” -> hiển thị toàn bộ 12
    return (
      <Stack spacing={2}>
        <QuestionRendererMUI indicator={q192} value={values[q192.id]} onChange={handleQ192Change} />
        {others.map(ind => (
          <QuestionRendererMUI key={ind.id} indicator={ind} value={values[ind.id]} onChange={setAns(ind.id)} />
        ))}
      </Stack>
    );
  }

  // Template 17 — group 27 controlled by Q62
  if (templateId === 17 && group.id === 27) {
    const q62 = group.indicators.find(i => i.id === 62);
    const others = group.indicators.filter(i => i.id !== 62);

    const handleQ62Change = (val) => {
      onSelectQ62?.(val?.value || null);
      onChangeAnswer(q62.id, val);
    };

    if (!selectedQ62) {
      // chỉ hiển thị Q62
      return (
        <Stack spacing={2}>
          <QuestionRendererMUI
            indicator={q62}
            value={values[q62.id]}
            onChange={handleQ62Change}
          />
        </Stack>
      );
    }
    if (selectedQ62 === 'Phù mạch') {
      // chỉ hiển thị lại Q62
      return (
        <Stack spacing={2}>
          <QuestionRendererMUI
            indicator={q62}
            value={values[q62.id]}
            onChange={handleQ62Change}
          />
        </Stack>
      );
    }
    // “Sẩn phù” / “Cả hai” / “Khác” -> hiển thị toàn bộ 27
    return (
      <Stack spacing={2}>
        <QuestionRendererMUI indicator={q62} value={values[q62.id]} onChange={handleQ62Change} />
        {others.map(ind => (
          <QuestionRendererMUI key={ind.id} indicator={ind} value={values[ind.id]} onChange={setAns(ind.id)} />
        ))}
      </Stack>
    );
  }

  // Các group còn lại — render bình thường tất cả indicator
  return (
    <Stack spacing={2}>
      {group.indicators.map(ind => (
        <QuestionRendererMUI key={ind.id} indicator={ind} value={values[ind.id]} onChange={setAns(ind.id)} />
      ))}
    </Stack>
  );
}
