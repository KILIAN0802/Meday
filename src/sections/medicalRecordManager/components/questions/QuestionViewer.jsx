'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { findImageUrls, extractFinalValue } from '../../utils/dataUtils';

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