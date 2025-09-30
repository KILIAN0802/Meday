'use client';

import React from 'react';
import {
  Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress
} from '@mui/material';
import { QuestionViewer } from '../questions/QuestionViewer';

export function MedicalRecordViewerModal({ open, onClose, questionGroups, loading, onImageClick }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Chi tiết Bệnh án</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>
        ) : questionGroups.length > 0 ? (
          questionGroups.map((group) => (
            <Box key={group.id} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, borderBottom: '2px solid #007bff', pb: 1, color: '#005bab' }}>
                {group.name}
              </Typography>
              {group.indicators.map((indicator) => (
                <QuestionViewer
                  key={indicator.id}
                  indicator={indicator}
                  value={indicator.savedValue}
                  onImageClick={onImageClick}
                />
              ))}
            </Box>
          ))
        ) : (
          <Typography sx={{ my: 5, textAlign: 'center' }}>Không có dữ liệu chi tiết cho bệnh án này.</Typography>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Đóng</Button></DialogActions>
    </Dialog>
  );
}