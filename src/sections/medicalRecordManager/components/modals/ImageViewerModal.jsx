'use client';

import React from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export function ImageViewerModal({ images, open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Hình ảnh chi tiết
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
          {(images || []).map((url, index) => (
            <Box
              key={index}
              component="img"
              src={url}
              alt={`Hình ảnh chi tiết ${index + 1}`}
              sx={{
                maxWidth: '100%',
                maxHeight: '80vh',
                height: 'auto',
                borderRadius: 2,
                boxShadow: 3,
              }}
            />
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
}