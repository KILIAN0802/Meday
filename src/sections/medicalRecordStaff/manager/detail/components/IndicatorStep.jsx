// components/IndicatorStep.jsx
'use client';

import { useState, forwardRef, useImperativeHandle } from 'react';
import { Stack, Typography } from '@mui/material';
import { FormIndicator } from './FormIndicator';


export const IndicatorStep = forwardRef(function IndicatorStep({ group, initialValues }, ref) {
  const [localData, setLocalData] = useState(initialValues || {});

  useImperativeHandle(ref, () => ({
    getValues: () => {
      return localData;
    }
  }), [localData]);

  if (!group) {
    return <Typography>Nhóm chỉ số không hợp lệ.</Typography>;
  }
  const handleDataChange = (indicatorId, value) => {
    console.log(`[IndicatorStep] Dữ liệu thay đổi: ID=${indicatorId}, Value=`, value);
    // ------------------------------------
    setLocalData(prev => ({
      ...prev,
      [indicatorId]: value,
    }));
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h6">{group.name}</Typography>
      {group.indicators.map((indicator) => (
        <FormIndicator
          key={indicator.id}
          indicator={indicator}
          formData={localData}
          onInputChange={handleDataChange}
        />
      ))}
    </Stack>
  );
});