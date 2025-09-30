'use client';

import React from 'react';
import {
  TextField, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, Checkbox, FormGroup
} from '@mui/material';

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
      return (
        <FormControl component="fieldset" margin="normal" fullWidth>
          <FormLabel component="legend">{indicator.name}</FormLabel>
          <RadioGroup row value={value || ''} onChange={(e) => onChange(indicator.id, e.target.value)}>
            {options.map(optionObj => (
              <FormControlLabel key={`${optionObj.value}-${optionObj.label}`} value={optionObj.value} control={<Radio />} label={optionObj.label} />
            ))}
          </RadioGroup>
        </FormControl>
      );
    }
    default: {
      return (
        <TextField
          key={indicator.id} fullWidth margin="normal"
          type={indicator.valueType === 'number' ? 'number' : indicator.valueType === 'full_date' ? 'date' : 'text'}
          label={indicator.name || `Chỉ số ${indicator.id}`}
          variant="outlined" helperText={indicator.unit || ''} value={value || ''}
          onChange={(e) => onChange(indicator.id, e.target.value)}
          InputLabelProps={indicator.valueType === 'full_date' ? { shrink: true } : {}}
        />
      );
    }
  }
}