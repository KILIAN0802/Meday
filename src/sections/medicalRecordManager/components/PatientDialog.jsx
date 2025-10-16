'use client';
import React from 'react';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Typography } from '@mui/material';

export function PatientDialog({ open, patient, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Thông tin bệnh nhân</DialogTitle>
      <DialogContent dividers>
        {patient ? (
          <Stack spacing={1.2}>
            <Row label="ID" value={patient.id} />
            <Row label="Họ tên" value={patient.fullname} />
            <Row label="Số điện thoại" value={patient.phone} />
            <Row label="Email" value={patient.email} />
          </Stack>
        ) : (
          <Typography>Không có dữ liệu</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
}

function Row({ label, value }) {
  return (
    <Box>
      <Typography variant="subtitle2">{label}</Typography>
      <Typography variant="body2">{value ?? '—'}</Typography>
    </Box>
  );
}
