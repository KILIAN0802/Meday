'use client';
import React from 'react';
import { Chip } from '@mui/material';

/**
 * Danh sách nhãn trạng thái
 */
export const STATUS_LABEL = {
  PENDING: 'Chờ xử lý',
  CONFIRMED: 'Đang xử lý',
  CANCELLED: 'Đã hủy',
  COMPLETED: 'Xử lý xong',
};

/**
 * Màu hiển thị tương ứng với trạng thái
 */
const STATUS_COLOR = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  CANCELLED: 'default',
  COMPLETED: 'success',
};

export const statusChip = (appointment) => {
  if (!appointment || !appointment.status) {
    return <Chip label="Chưa có" size="small" />;
  }

  const status = appointment.status.toUpperCase();
  const label = STATUS_LABEL[status] || status;
  const color = STATUS_COLOR[status] || 'default';

  return <Chip label={label} color={color} size="small" />;
};
