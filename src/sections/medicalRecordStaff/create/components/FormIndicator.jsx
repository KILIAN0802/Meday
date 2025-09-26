import React from 'react';
import {
  Box, Typography, TextField, FormControl,
  InputLabel, Select, MenuItem, FormGroup, FormControlLabel, Checkbox, Stack, Button
} from '@mui/material';

export function FormIndicator({ indicator, formData, onInputChange }) {
  const { id, name, valueType, valueOptions } = indicator;

  const handleInputChange = (indicatorId, value) => {
    onInputChange(indicatorId, value);
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
                    {fields.map((fieldItem) => {
                      const subIndicator = { id: fieldItem.id, name: fieldItem.label, valueType: fieldItem.type, valueOptions: fieldItem.options || fieldItem.option };
                      const isSelected = formData[subIndicator.id] && formData[subIndicator.id].length > 0;
                      return (
                        <Box key={subIndicator.id}>
                          <Box sx={{ pl: item.label ? 2 : 0 }}>
                            <FormIndicator indicator={subIndicator} formData={formData} onInputChange={onInputChange} />
                          </Box>
                          {fieldItem.requiredFields && isSelected && (
                            <Box sx={{ pl: item.label ? 4 : 2, mt: 1 }}>
                              {fieldItem.requiredFields.map((rf, rfIndex) => {
                                if (rf.condition !== 'hasSelection') return null;
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
              } else if (item.label && item.type) {
                const subIndicator = { id: `${id}-${index}-${item.label}`, name: item.label, valueType: item.type, valueOptions: item.options || item.option };
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
    case 'multi_selection':
      return (
        <FormControl component="fieldset" fullWidth>
          <Typography variant="body1">{name || "Vui lòng chọn"}</Typography>
          <FormGroup>
            {(valueOptions || []).map(option => (
              <FormControlLabel key={option} control={
                <Checkbox
                  checked={(formData[id] || []).includes(option)}
                  onChange={(e) => {
                    const currentSelection = formData[id] || [];
                    const newSelection = e.target.checked ? [...currentSelection, option] : currentSelection.filter(item => item !== option);
                    handleInputChange(id, newSelection);
                  }}
                />
              } label={option} />
            ))}
          </FormGroup>
        </FormControl>
      );
    case 'image':
      return <Button variant="outlined" component="label">{name}<input type="file" hidden accept="image/*" onChange={(e) => handleInputChange(id, e.target.files[0])} /></Button>;
    default:
      return <Typography color="error">Loại câu hỏi không xác định: {valueType}</Typography>;
  }
}