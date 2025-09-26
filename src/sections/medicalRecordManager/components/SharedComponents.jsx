'use client';

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton,
  CircularProgress, TextField, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel,
  Checkbox, FormGroup 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export function extractFinalValue(data) {
  if (data === null || typeof data === 'undefined') {
    return '';
  }
  if (typeof data !== 'object' || data === null) {
    return String(data);
  }
  if (Array.isArray(data)) {
    return data.map(extractFinalValue).join(', ');
  }
  const values = Object.values(data);
  const extracted = values.map(extractFinalValue).filter(Boolean);
  return extracted.join('; ');
}

export function findImageUrls(data) {
  let urls = [];
  if (typeof data === 'string' && data.startsWith('http')) {
    return [data];
  }
  if (Array.isArray(data)) {
    for (const item of data) {
      urls = urls.concat(findImageUrls(item));
    }
  } else if (typeof data === 'object' && data !== null) {
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        urls = urls.concat(findImageUrls(data[key]));
      }
    }
  }
  return urls;
}

export function PersonDetailsModal({ person, open, onClose }) {
    if (!person) return null;
    const KEY_LABELS = { id: 'Mã số', fullname: 'Họ và tên', phone: 'Số điện thoại', email: 'Email', role: 'Vai trò' };
    const roleMap = { 1: 'Bác sĩ', 2: 'Y tá' };
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
        <DialogTitle>Thông tin chi tiết</DialogTitle>
        <DialogContent dividers>
          {Object.keys(KEY_LABELS).map((key) => {
            if (person?.[key]) {
              const displayValue = key === 'role' ? roleMap[person[key]] || 'Không xác định' : person[key];
              return (
                <Box key={key} sx={{ display: 'flex', mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', minWidth: '120px' }}>{`${KEY_LABELS[key]}:`}</Typography>
                  <Typography variant="body2">{displayValue}</Typography>
                </Box>
              );
            }
            return null;
          })}
        </DialogContent>
        <DialogActions><Button onClick={onClose}>Đóng</Button></DialogActions>
      </Dialog>
    );
}
export function ImageViewerModal({ images, open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Hình ảnh chi tiết
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
          {(images || []).map((url, index) => (
            <Box
              key={index}
              component="img"
              src={url}
              alt={`Hình ảnh chi tiết ${index + 1}`}
              sx={{
                maxWidth: '100%',
                maxHeight: '80vh',
                height: 'auto',
                borderRadius: 2,
                boxShadow: 3,
              }}
            />
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
export function StatusChip({ status }) {
  const statusMap = {
    PENDING: { color: 'warning', text: 'CHỜ XỬ LÝ' },
    CONFIRMED: { color: 'primary', text: 'ĐÃ XÁC NHẬN' },
    CANCELLED: { color: 'error', text: 'ĐÃ HUỶ' },
    COMPLETED: { color: 'success', text: 'HOÀN THÀNH' },
  };
  const { color, text } = statusMap[status] || { color: 'default', text: 'KHÔNG RÕ' };
  return <Chip label={text} color={color} size="small" sx={{ fontWeight: 'bold' }} />;
}

export function QuestionRenderer({ indicator, value, onChange }) {
  const parseOptions = (optionsArray) => (optionsArray || [])
    .filter(Boolean)
    .map(optStr => {
      let optValue = optStr, optLabel = optStr;
      if (optStr.includes('.')) {
        const parts = optStr.split('.');
        optValue = parts[0];
        optLabel = parts.slice(1).join('.');
      }
      return { value: optValue, label: optLabel };
    });

  switch (indicator.valueType) {
    case 'multi_selection': {
      const options = parseOptions(indicator.valueOptions);
      const selectedSet = new Set(Array.isArray(value) ? value : []);

      const handleCheckboxChange = (optionValue, isChecked) => {
        const newSelectedSet = new Set(selectedSet);
        if (isChecked) {
          newSelectedSet.add(optionValue);
        } else {
          newSelectedSet.delete(optionValue);
        }
        onChange(indicator.id, Array.from(newSelectedSet));
      };

      return (
        <FormControl component="fieldset" margin="normal" fullWidth>
          <FormLabel component="legend">{indicator.name}</FormLabel>
          <FormGroup row>
            {options.map(optionObj => (
              <FormControlLabel
                key={`${optionObj.value}-${optionObj.label}`} 
                control={
                  <Checkbox
                    checked={selectedSet.has(optionObj.value)}
                    onChange={(e) => handleCheckboxChange(optionObj.value, e.target.checked)}
                  />
                }
                label={optionObj.label}
              />
            ))}
          </FormGroup>
        </FormControl>
      );
    }
    case 'selection': {
      const options = parseOptions(indicator.valueOptions);
      const handleChange = (event) => onChange(indicator.id, event.target.value);
      return (
        <FormControl component="fieldset" margin="normal" fullWidth>
          <FormLabel component="legend">{indicator.name}</FormLabel>
          <RadioGroup row name={indicator.code || `indicator-${indicator.id}`} value={value || ''} onChange={handleChange}>
            {options.map(optionObj => (
              <FormControlLabel key={`${optionObj.value}-${optionObj.label}`} value={optionObj.value} control={<Radio />} label={optionObj.label} />
            ))}
          </RadioGroup>
        </FormControl>
      );
    }
    default: {
      const handleChange = (event) => onChange(indicator.id, event.target.value);
      return (
        <TextField
          key={indicator.id} fullWidth margin="normal"
          type={indicator.valueType === 'number' ? 'number' : indicator.valueType === 'full_date' ? 'date' : 'text'}
          label={indicator.name || `Chỉ số ${indicator.id}`}
          variant="outlined" helperText={indicator.unit || ''} value={value || ''} onChange={handleChange}
          InputLabelProps={indicator.valueType === 'full_date' ? { shrink: true } : {}}
        />
      );
    }
  }
}

export function VitalsFormModal({ open, onClose, questionGroups, loading, onSave, medicalRecordId }) {
    const [formValues, setFormValues] = useState({});

    useEffect(() => {
      if (questionGroups) {
        const initialValues = {};
        questionGroups.forEach(group => {
          group.indicators.forEach(q => {
            if (q.valueType === 'multi_selection') {
                initialValues[q.id] = Array.isArray(q.savedValue) ? q.savedValue : [];
            } else {
                initialValues[q.id] = extractFinalValue(q.savedValue);
            }
          });
        });
        setFormValues(initialValues);
      }
    }, [questionGroups]);
  
    const handleValueChange = (indicatorId, newValue) => {
      setFormValues(prev => ({ ...prev, [indicatorId]: newValue }));
    };
  
    const handleSave = () => {
      onSave(medicalRecordId, formValues);
      onClose();
    };
  
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Form Bệnh án</DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>
          ) : questionGroups.length > 0 ? (
            <Box component="form" noValidate autoComplete="off" sx={{ mt: 1 }}>
              {questionGroups.map((group) => (
                <Box key={group.id} sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>{group.name}</Typography>
                    {group.indicators.map((indicator) => (
                        <QuestionRenderer 
                            key={indicator.id} 
                            indicator={indicator} 
                            value={formValues[indicator.id]}
                            onChange={handleValueChange}
                        />
                    ))}
                </Box>
              ))}
            </Box>
          ) : (
            <Typography sx={{ my: 5, textAlign: 'center' }}>Không tìm thấy chỉ số sinh tồn nào.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Hủy</Button>
          <Button variant="contained" onClick={handleSave} disabled={loading}>Lưu</Button>
        </DialogActions>
      </Dialog>
    );
}

export function QuestionViewer({ indicator, value, onImageClick }) {
  if (indicator.valueType === 'image' || indicator.valueType === 'custom') {
    const imageUrls = findImageUrls(value);
    if (imageUrls.length > 0) {
      return (
        <Box sx={{ py: 1.5, borderBottom: '1px solid #f0f0f0' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{indicator.name}:</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {imageUrls.map((url, index) => (
              <Box
                key={index} component="img" src={url} alt={`${indicator.name} ${index + 1}`}
                sx={{ width: 80, height: 80, borderRadius: 1.5, objectFit: 'cover', cursor: 'pointer', border: '1px solid #ddd' }}
                onClick={() => onImageClick(imageUrls)}
              />
            ))}
          </Box>
        </Box>
      );
    }
  }

  const finalDisplayValue = extractFinalValue(value);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: '1px solid #f0f0f0' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', pr: 2 }}>{indicator.name}:</Typography>
      <Typography variant="body2" sx={{ textAlign: 'right', color: finalDisplayValue ? 'text.primary' : 'text.secondary' }}>
        {finalDisplayValue || 'Chưa có dữ liệu'}
      </Typography>
    </Box>
  );
}

export function MedicalRecordViewerModal({ open, onClose, questionGroups, loading, onImageClick }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Chi tiết Bệnh án</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>
        ) : questionGroups.length > 0 ? (
          questionGroups.map((group) => (
            <Box key={group.id} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, borderBottom: '2px solid #007bff', pb: 1, color: '#005bab' }}>
                {group.name}
              </Typography>
              {group.indicators.map((indicator) => (
                <QuestionViewer
                  key={indicator.id}
                  indicator={indicator}
                  value={indicator.savedValue}
                  onImageClick={onImageClick}
                />
              ))}
            </Box>
          ))
        ) : (
          <Typography sx={{ my: 5, textAlign: 'center' }}>Không có dữ liệu chi tiết cho bệnh án này.</Typography>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Đóng</Button></DialogActions>
    </Dialog>
  );
}

