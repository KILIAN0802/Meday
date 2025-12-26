'use client';

import React from 'react';

// --- MUI Components ---
import Box from '@mui/material/Box';
import Button from '@mui/material/Button'; // Quay lại dùng Button
import AddIcon from '@mui/icons-material/Add'; 

// --- Custom Components ---
import { TableManager } from '../Record-create-tableManager';

// ----------------------------------------------------------------------

export function RecordCreateView() {
  const handleCreateAppointment = () => {
    // TODO: Thêm logic điều hướng tới trang tạo lịch hẹn ở đây
    console.log('Chuyển đến trang tạo lịch hẹn...');
  };

  return (
    <>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          my: 4 
        }}
      >
        <Button
          variant="contained"
          onClick={handleCreateAppointment}
          sx={{
            width: '70%',
            height: 120,
            fontSize: '1.25rem',
            flexDirection: 'column',
            borderRadius: 4,
            boxShadow: 3,
          }}
        >
          <AddIcon sx={{ fontSize: 40, mb: 1 }} />
          Tạo lịch hẹn
        </Button>
      </Box>
      
      <TableManager />
    </>
  );
}