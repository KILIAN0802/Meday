'use client';

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, FormControl,
  InputLabel, Select, MenuItem, FormGroup, FormControlLabel, Checkbox, Stack, Button
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export function FormIndicator({ indicator, formData, onInputChange }) {
  const { id, name, valueType, valueOptions, code } = indicator;
  const [showSubOptions, setShowSubOptions] = useState(false);

  useEffect(() => {
    if (code === 'QUES17CTN') {
      const currentSelection = formData[id] || [];
      setShowSubOptions(currentSelection.includes('Khi có các yếu tố kích thích'));
    }
  }, [formData, id, code]);

  const handleInputChange = (indicatorId, value) => {
    onInputChange(indicatorId, value);
  };

  const handleMultiSelectionChange = (option, checked) => {
    const currentSelection = formData[id] || [];
    let newSelection;
    if (code === 'QUES17CTN' && option === 'Khi có các yếu tố kích thích' && !checked) {
      const mainOptions = ["Một cách ngẫu nhiên", "Khi có các yếu tố kích thích"];
      newSelection = currentSelection.filter(item => mainOptions.includes(item) && item !== option);
    } else {
      newSelection = checked ? [...currentSelection, option] : currentSelection.filter(item => item !== option);
    }
    handleInputChange(id, newSelection);
  };

  switch (valueType) {
    case 'label':
      return <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 1 }}>{name}</Typography>;

    case 'custom': {
      if (!valueOptions?.group) return null;
      const groupsToRender = Array.isArray(valueOptions.group) ? valueOptions.group : [valueOptions.group];
      return (
        <Box sx={{ border: '1px solid #e0e0e0', borderRadius: '8px', p: 2, bgcolor: '#fafafa' }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>{name}</Typography>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {groupsToRender.map((item, index) => {
              const fields = item.field || item.fields;
              if (fields) {
                return (
                  <Stack key={index} spacing={1}>
                    {item.label && <Typography fontWeight="medium">{item.label}</Typography>}
                    {fields.map((fieldItem, fieldIndex) => {
                      const subIndicator = {
                        id: fieldItem.id || `${id}-${index}-${fieldIndex}-${fieldItem.label}`,
                        name: fieldItem.label,
                        valueType: fieldItem.type,
                        valueOptions: fieldItem.options || fieldItem.option,
                      };
                      
                      const isSelected = formData[subIndicator.id] && formData[subIndicator.id].length > 0;
                      
                      return (
                        <Box key={subIndicator.id}>
                          <Box sx={{ pl: item.label ? 2 : 0 }}>
                            <FormIndicator indicator={subIndicator} formData={formData} onInputChange={onInputChange} />
                          </Box>
                          {fieldItem.requiredFields && isSelected && (
                            <Box sx={{ pl: item.label ? 4 : 2, mt: 1 }}>
                              {fieldItem.requiredFields.map((rf, rfIndex) => {
                                const conditionalIndicator = { id: `${subIndicator.id}-cond-${rfIndex}`, name: rf.description, valueType: rf.type, valueOptions: rf.options };
                                return <FormIndicator key={conditionalIndicator.id} indicator={conditionalIndicator} formData={formData} onInputChange={onInputChange} />;
                              })}
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                );
                const subIndicator = { 
                  id: item.id || `${id}-${index}-${item.label}`, 
                  name: item.label, 
                  valueType: item.type, 
                  valueOptions: item.options || item.option 
                };
                return <FormIndicator key={subIndicator.id} indicator={subIndicator} formData={formData} onInputChange={onInputChange} />;
              }
              return null;
            })}
          </Stack>
        </Box>
      );
    }

    case 'full_date':
      return <TextField fullWidth type="date" label={name} value={formData[id] || ''} onChange={(e) => handleInputChange(id, e.target.value)} InputLabelProps={{ shrink: true }} />;
    case 'number':
      return <TextField fullWidth type="number" label={name} value={formData[id] || ''} onChange={(e) => handleInputChange(id, e.target.value)} />;
    case 'text':
      return <TextField fullWidth label={name} value={formData[id] || ''} onChange={(e) => handleInputChange(id, e.target.value)} />;
    case 'selection':
    case 'select':
      return (
        <FormControl fullWidth>
          <InputLabel>{name}</InputLabel>
          <Select value={formData[id] || ''} label={name} onChange={(e) => handleInputChange(id, e.target.value)}>
            {(valueOptions || []).map(option => <MenuItem key={option} value={option}>{option}</MenuItem>)}
          </Select>
        </FormControl>
      );
    case 'multi_selection': {
      if (code === 'QUES17CTN') {
        const mainOptions = ["Một cách ngẫu nhiên", "Khi có các yếu tố kích thích"];
        const subOptions = (valueOptions || []).filter(opt => !mainOptions.includes(opt));
        return (
          <FormControl component="fieldset" fullWidth>
            <Typography variant="body1">{name}</Typography>
            <FormGroup>
              {mainOptions.map(option => (
                <FormControlLabel key={option} control={<Checkbox checked={(formData[id] || []).includes(option)} onChange={(e) => handleMultiSelectionChange(option, e.target.checked)} />} label={option} />
              ))}
            </FormGroup>
            {showSubOptions && (
              <FormGroup sx={{ pl: 4, mt: 1, borderLeft: '2px solid #e0e0e0' }}>
                <Typography variant="body2" sx={{ mb: 1 }}>Chi tiết yếu tố kích thích:</Typography>
                {subOptions.map(option => (
                  <FormControlLabel key={option} control={<Checkbox checked={(formData[id] || []).includes(option)} onChange={(e) => handleMultiSelectionChange(option, e.target.checked)}/>} label={option} />
                ))}
              </FormGroup>
            )}
          </FormControl>
        );
      }
      return (
        <FormControl component="fieldset" fullWidth>
          <Typography variant="body1">{name || "Vui lòng chọn"}</Typography>
          <FormGroup>
            {(valueOptions || []).map(option => (
              <FormControlLabel key={option} control={<Checkbox checked={(formData[id] || []).includes(option)} onChange={(e) => handleMultiSelectionChange(option, e.target.checked)} />} label={option} />
            ))}
          </FormGroup>
        </FormControl>
      );
    }
    case 'image': {
      const selectedFile = formData[id];
      return (
        <Button
          variant="outlined"
          component="label"
          fullWidth
          startIcon={selectedFile ? <CheckCircleIcon color="success" /> : <UploadFileIcon />}
        >
          {selectedFile instanceof File ? selectedFile.name : name}
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={(e) => handleInputChange(id, e.target.files[0])}
          />
        </Button>
      );
    }
    default:
      return <Typography color="error">Loại câu hỏi không xác định: {valueType}</Typography>;
  }
}