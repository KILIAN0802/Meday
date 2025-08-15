'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Add as AddIcon, WidthFull } from '@mui/icons-material';
import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';
// ----------------------------------------------------------------------

export function MedicalRecordsCreate() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
      <h1 >Tạo bệnh án 📜</h1>
        <Box sx={{ display: 'flex', gap: 2, maxWidth: 420, border:'2px solid black', padding: '10px', borderRadius: '20px'}}>
        <Button component={RouterLink} href = {paths.dashboard.MedicalRecords.chronic } variant="contained" startIcon={<AddIcon />}  fullWidth sx={{ transition: 'transform 0.2s ease-in-out', '&:hover': {transform: 'scale(1.05)',  }, }}>
          Tạo bệnh án mạn tính lần 1
        </Button>

        <Button omponent={RouterLink} href = {paths.dashboard.MedicalRecords.rechronic } variant="contained"  startIcon={<AddIcon />}  color='secondary' fullWidth sx={{ transition: 'transform 0.2s ease-in-out', '&:hover': {transform: 'scale(1.05)',  }, }}>
          Tạo bệnh án mạn tính tái khám
        </Button>

        <Button omponent={RouterLink} href = {paths.dashboard.MedicalRecords.acute } variant="contained"  startIcon={<AddIcon />}  color='warning' fullWidth sx={{ transition: 'transform 0.2s ease-in-out', '&:hover': {transform: 'scale(1.05)',  }, }}>
          Tạo bệnh án cấp tính
        </Button>
      </Box>
    </Box>
  );
}
