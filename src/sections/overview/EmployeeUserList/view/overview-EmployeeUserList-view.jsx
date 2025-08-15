'use client';

import { useState, useMemo } from 'react';

import { useTheme } from '@mui/material/styles';

import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';
import { _EmployeeUser } from 'src/_mock';


import { useMockedUser } from 'src/auth/hooks';

import { EmployeeUserList_NewList }  from '../EmployyeeUserList-new-list';

// ----------------------------------------------------------------------
export function EmployeeUserList() {
  const { user } = useMockedUser();

  const theme = useTheme();
  
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return _EmployeeUser.filter((p) => {
      const nameField = String(p.EmployeeName ?? '').toLowerCase();
      const idField   = String(p.EmployeeUserId   ?? '').toLowerCase();
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
          <EmployeeUserList_NewList
            tableData={filteredData}
            headCells={[
              { id: 'Id', label: 'ID người dùng' },
              { id: 'EmployeeUserId', label: 'Mã nhân viên' },
              { id: 'Name', label: 'Tên nhân viên' },
              { id: 'Account', label: 'Tài khoản' },
              { id: 'Password', label: 'Mật khẩu' },
              { id: 'PhoneNumber', label: 'Số điện thoại' },
              { id: 'Email', label: 'Email' },
              { id: 'Room', label: 'Phòng' },
              { id: 'Status', label: 'Trạng thái nhân viên' },
              { id: 'Unit', label: 'Đơn vị trực thuộc' },
              { id: 'Faculty', label: 'Khoa/ viện' },
              { id: 'Position', label: 'Chức vụ' },
              { id: 'WorkPosition', label: 'Vị trí công tác' },
              { id: '', label: '' },
            ]}
          />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
