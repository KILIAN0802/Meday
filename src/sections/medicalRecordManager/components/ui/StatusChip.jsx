'use client';

import React from 'react';
import { Chip } from '@mui/material';

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