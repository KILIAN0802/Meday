'use client';

import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { useAuthContext } from '../../hooks';
import { getErrorMessage } from '../../utils';
import { FormHead } from '../../components/form-head';
import { signInWithPassword } from '../../context/jwt';
// ----------------------------------------------------------------------

/* export const SignInSchema = zod.object({
  email: zod
    .string()
    .min(1, { message: 'Hãy nhập email!' })
    .email({ message: 'Định dạng email không đúng!' }),
  password: zod
    .string()
    .min(1, { message: 'Hãy nhập mật khẩu!' })
    .min(6, { message: 'Mật khẩu chứa ít nhất 6 kí tự!' }),
}); */

// ----------------------------------------------------------------------

export const SignInSchema = zod.object({
  username: zod
    .string()
    .min(1, { message: 'Hãy nhập teen!' }),
  password: zod
    .string()
    .min(1, { message: 'Hãy nhập mật khẩu!' })
    .min(6, { message: 'Mật khẩu chứa ít nhất 6 kí tự!' }),
});

// ----------------------------------------------------------------------


export function JwtSignInView() {
  const router = useRouter();

  const showPassword = useBoolean();

  const { checkUserSession } = useAuthContext();

  const [errorMessage, setErrorMessage] = useState('');

  const defaultValues = {
    username: 'supper_admin',
    password: 'password',
  };

  const methods = useForm({
    resolver: zodResolver(SignInSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await signInWithPassword({ username: data.username, password: data.password });
      await checkUserSession?.();

      router.refresh();
    } catch (error) {
      console.error(error);
      const feedbackMessage = getErrorMessage(error);
      setErrorMessage(feedbackMessage);
    }
  });

  const renderForm = () => (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      <Field.Text name="username" label="Tên tài khoản"  slotProps={{ inputLabel: { shrink: true } }} />

      <Box sx={{ gap: 1.5, display: 'flex', flexDirection: 'column' }}>
        <Link
          component={RouterLink}
          href="#"
          variant="body2"
          color="inherit"
          sx={{ alignSelf: 'flex-end' }}
        >
          Quên mật khẩu?
        </Link>

        <Field.Text
          name="password"
          label="Mật khẩu"
          placeholder="6+ kí tự"
          type={showPassword.value ? 'text' : 'password'}
          slotProps={{
            inputLabel: { shrink: true },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={showPassword.onToggle} edge="end">
                    <Iconify
                      icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                    />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Button
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Đang đăng nhập..."
      >
        Đăng nhập
      </Button>
    </Box>
  );

  return (
    <>
      <FormHead
        title="Đăng nhập tài khoản của bạn"
        description={
          <>
            Không có tài khoản ư? 
            <Link component={RouterLink} href={paths.auth.jwt.signUp} variant="subtitle2">
              Đăng ký ngay
            </Link>
          </>
        }
        sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      <Alert severity="info" sx={{ mb: 3 }}>
        Sử dụng <strong>{defaultValues.username}</strong>
        {' với mật khẩu '}
        <strong>{defaultValues.password}</strong>
      </Alert>

      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm()}
      </Form>
    </>
  );}
