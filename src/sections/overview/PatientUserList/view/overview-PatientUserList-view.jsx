'use client';

import { useState, useMemo } from 'react';

import { useTheme } from '@mui/material/styles';

import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';
import { _PatientUser } from 'src/_mock';

import { useMockedUser } from 'src/auth/hooks';

import { PatientUserList_NewList }  from '../PatientUserList-new-list';


// ----------------------------------------------------------------------
export function PatientUserList() {
  const { user } = useMockedUser();

  const theme = useTheme();

  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return _PatientUser.filter((p) => {
      const nameField = String(p.PatientUserName ?? '').toLowerCase();
      const idField   = String(p.PatientUserId   ?? '').toLowerCase();
      const accField  = String(p.Account         ?? '').toLowerCase();

      return (
        nameField.includes(term) ||
        idField.includes(term) ||
        accField.includes(term)
      );
    });
  }, [searchTerm]);

  return (
    <DashboardContent maxWidth="xl">
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
            <Typography variant="h5">Danh sách bệnh nhân</Typography>
        </Grid>
        <Grid size={{ xs: 12, lg: 12 }}>
          <TextField
            fullWidth
            label="Tìm kiếm"
            placeholder="Nhập..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
            <InputAdornment position="start">
            </InputAdornment>
                ),
              }}
            />
        </Grid>
        <Grid size={{ xs: 12, lg: 12 }}>
          <PatientUserList_NewList
            tableData={filteredData}
            headCells={[
              { id: 'Id', label: 'ID người dùng' },
              { id: 'PatientUserId', label: 'Mã bệnh nhân' },
              { id: 'Name', label: 'Tên bệnh nhân' },
              { id: 'Account', label: 'Tài khoản' },
              { id: 'Password', label: 'Mật khẩu' },
              { id: 'PhoneNumber', label: 'Số điện thoại' },
              { id: 'Email', label: 'Email' },
              { id: 'Date', label: 'Ngày sinh' },
              { id: 'Sex', label: 'Giới tính' },
              { id: 'Nationality', label: 'Quốc tịch' },
              { id: 'Nation', label: 'Dân tộc' },
              { id: 'Address', label: 'Địa chỉ' },
              { id: 'Work', label: 'Nghề nghiệp' },
              { id: '', label: '' },
            ]}
          />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
