'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { findImageUrls, extractFinalValue } from '../../utils/dataUtils';

const hasValue = (value) => {
  if (value === null || typeof value === 'undefined') return false;
  if (Array.isArray(value)) {
    return value.some(item => hasValue(item));
  }
  if (typeof value === 'object' && Object.keys(value).length > 0) {
    return Object.values(value).some(item => hasValue(item));
  }
  return String(value).trim() !== '';
};

const findFieldsArray = (valueOptions) => {
  if (!valueOptions) return [];
  if (Array.isArray(valueOptions.fields)) return valueOptions.fields;
  if (Array.isArray(valueOptions.field)) return valueOptions.field;
  const { group } = valueOptions;
  if (!group) return [];
  if (Array.isArray(group)) {
    return group.flatMap(g => g.field || g.fields || []);
  }
  if (typeof group === 'object') {
    return group.field || group.fields || [];
  }
  return [];
};

// Hàm đệ quy để "bóc tách" các object lồng nhau thừa thãi để lấy giá trị cuối cùng.
const getActualAnswer = (data) => {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        return data;
    }

    const keys = Object.keys(data);
    if (keys.length === 1) {
        return getActualAnswer(data[keys[0]]);
    }
    return data;
};



export function QuestionViewer({ indicator, value, onImageClick }) {
  // BƯỚC ĐỆ QUY: Xử lý các câu hỏi lồng nhau (loại 'custom')
  if (indicator.valueType === 'custom' && hasValue(value)) {
    const subFields = findFieldsArray(indicator.valueOptions);
    if (subFields.length === 0) return null;

    return (
      <Box sx={{ py: 1.5, borderBottom: '1px solid #f0f0f0' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{indicator.name}:</Typography>
        <Box sx={{ pl: 2, mt: 1 }}>
          {subFields.map((field, index) => {
            const subIndicator = {
              id: field.id || `${indicator.id}-${index}-${field.label}`,
              name: field.label,
              valueType: field.type,
              valueOptions: field.options || field.option,
            };

            const rawSubValue = value[subIndicator.name];
            const subIndicatorValue = getActualAnswer(rawSubValue);

            if (hasValue(subIndicatorValue)) {
              return (
                <QuestionViewer
                  key={subIndicator.id}
                  indicator={subIndicator}
                  value={subIndicatorValue}
                  onImageClick={onImageClick}
                />
              );
            }
            return null;
          })}
        </Box>
      </Box>
    );
  }

  const imageUrls = findImageUrls(value);
  if (imageUrls.length > 0) {
    return (
        <Box sx={{ py: 1.5, borderBottom: '1px solid #f0f0f0' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{indicator.name}:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {imageUrls.map((url, index) => (
                    <Box key={index} component="img" src={url} alt={`${indicator.name} ${index + 1}`} sx={{ width: 80, height: 80, borderRadius: 1.5, objectFit: 'cover', cursor: 'pointer', border: '1px solid #ddd' }} onClick={() => onImageClick(imageUrls)} />
                ))}
            </Box>
        </Box>
    );
  }
  
  const finalDisplayValue = extractFinalValue(value);
  if (!hasValue(finalDisplayValue)) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: '1px solid #f0f0f0' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', pr: 2 }}>{indicator.name || ':'}</Typography>
      <Typography variant="body2" sx={{ textAlign: 'right', color: 'text.primary' }}>
        {finalDisplayValue}
      </Typography>
    </Box>
  );
}