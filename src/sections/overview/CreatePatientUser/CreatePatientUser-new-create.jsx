'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Controller } from 'react-hook-form';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';
import { FormHead } from '../../../auth/components/form-head';
import { getErrorMessage } from '../../../auth/utils';

export function CreatePatientUserNewCreate() {
  // 1. Khởi tạo form
  const methods = useForm({
    mode: 'onChange',
    defaultValues: {
      Account: '',
      Password: '',
      PatientId: '',
      PatientUserName: '',
      PhoneNumber: '',
      Email: '',
      Date: '',
      Sex: '',
      Nationality: '',
      Nation: '',
      Address: '',
      Work: ''
    }
  });

  const { handleSubmit, reset, formState: { isSubmitting } } = methods;
  const showPassword = useBoolean();
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 2. Hàm submit giữ trên trang hiện tại
  const onSubmit = handleSubmit(async (data) => {
    try {
      // TODO: gọi API tạo tài khoản
      console.log('Submit data:', data);

      // Hiện thông báo thành công
      setSuccessMessage('Tạo tài khoản thành công 🎉');

      // Nếu muốn reset form, bỏ comment dòng này
      // reset();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  });

  // 3. Form layout với 2 cột
  const renderForm = () => (
    <Box sx={{ mt: -3 }}>
      <Grid container spacing={3} direction="column" >
        <Grid item xs={12} sm={6}>
          <Field.Text name="Account" label="Tài khoản" placeholder="abc@gmail.com" slotProps={{ inputLabel: { shrink: true } }} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Field.Text
            name="Password"
            label="Mật khẩu"
            placeholder="6+ kí tự"
            type={showPassword.value ? 'text' : 'password'}
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={showPassword.onToggle} edge="end">
                      <Iconify icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Field.Text name="PatientId" label="Mã bệnh nhân" placeholder="2020xxx" slotProps={{ inputLabel: { shrink: true } }} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Field.Text name="PatientUserName" label="Tên bệnh nhân" placeholder="Nguyễn Văn A" slotProps={{ inputLabel: { shrink: true } }} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Field.Text name="PhoneNumber" label="Số điện thoại" placeholder="0399xxxxxx" slotProps={{ inputLabel: { shrink: true } }} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Field.Text name="Email" label="Email" placeholder="abc@gmail.com" slotProps={{ inputLabel: { shrink: true } }} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Field.Text name="Date" label="Ngày sinh" placeholder="dd/mm/yyyy" slotProps={{ inputLabel: { shrink: true } }} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Controller
            name="Sex"
            control={methods.control}
            defaultValue=""
            render={({ field }) => (
            <FormControl fullWidth variant="outlined" margin="normal">
            <InputLabel id="sex-label">Giới tính</InputLabel>
            <Select
              {...field}
              labelId="sex-label"
              label="Giới tính"
            >
              <MenuItem value=""><em>Chọn một</em></MenuItem>
              <MenuItem value="Nam">Nam</MenuItem>
              <MenuItem value="Nữ">Nữ</MenuItem>
              <MenuItem value="Khác">Khác</MenuItem>
            </Select>
          </FormControl>
          )}
        />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Field.Text name="Nationality" label="Quốc tịch" placeholder="Việt Nam" slotProps={{ inputLabel: { shrink: true } }} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Field.Text name="Nation" label="Dân tộc" placeholder= "Kinh" slotProps={{ inputLabel: { shrink: true } }} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Field.Text name="Address" label="Địa chỉ" slotProps={{ inputLabel: { shrink: true } }} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Field.Text name="Work" label="Công việc" slotProps={{ inputLabel: { shrink: true } }} fullWidth />
        </Grid>
        <Grid item xs={12}>
          <Button fullWidth size="large" type="submit" variant="contained" disabled={isSubmitting}>
            Tạo tài khoản
          </Button>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <>
      <FormHead
        title="Tạo tài khoản bệnh nhân"
        sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      {!!successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm()}
      </Form>
    </>
  );
}
