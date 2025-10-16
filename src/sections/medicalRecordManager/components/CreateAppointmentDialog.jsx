'use client';
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Stack, TextField, FormControl, InputLabel, Select, MenuItem, Typography, Button } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

export function CreateAppointmentDialog({ open, doctor, payload, submitting, onClose, onChange, onSubmit, statuses, statusLabels }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Thêm lịch hẹn</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField label="Bệnh nhân (ID)" value={payload.patientId} InputProps={{ readOnly: true }} />
          <TextField label="Bác sĩ phụ trách" value={doctor?.fullname || '(chưa có)'} InputProps={{ readOnly: true }} helperText={doctor ? `ID: ${doctor.id}` : 'Không lấy được thông tin bác sĩ'} />
          <TextField label="Họ tên bệnh nhân" value={payload.fullName} onChange={(e) => onChange('fullName', e.target.value)} />
          <TextField label="Số điện thoại" value={payload.phone} onChange={(e) => onChange('phone', e.target.value)} />
          <TextField label="Lý do khám" value={payload.reason} onChange={(e) => onChange('reason', e.target.value)} />
          <DateTimePicker label="Thời gian hẹn" value={payload.appointmentDate} onChange={(v) => onChange('appointmentDate', v)} />
          <FormControl><InputLabel>Trạng thái</InputLabel><Select label="Trạng thái" value={payload.status} onChange={(e) => onChange('status', e.target.value)}>{statuses.map((st) => <MenuItem key={st} value={st}>{statusLabels[st]}</MenuItem>)}</Select></FormControl>
          <TextField label="Ghi chú" value={payload.notes} onChange={(e) => onChange('notes', e.target.value)} multiline rows={2} />
          <Typography variant="subtitle2" sx={{ mt: 1 }}>Thông tin bổ sung</Typography>
          <TextField label="Người liên hệ khẩn cấp" value={payload.customInfo.emergencyContact} onChange={(e) => onChange('customInfo.emergencyContact', e.target.value)} />
          <TextField label="Bảo hiểm" value={payload.customInfo.insurance} onChange={(e) => onChange('customInfo.insurance', e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Hủy</Button>
        <Button variant="contained" onClick={onSubmit} disabled={submitting || !doctor?.id}>
          {submitting ? 'Đang tạo...' : 'Tạo lịch hẹn'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
