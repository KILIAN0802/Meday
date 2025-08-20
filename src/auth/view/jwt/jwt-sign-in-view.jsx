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
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { LoadingButton } from '@mui/lab';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { useAuthContext } from '../../hooks';
import { getErrorMessage } from '../../utils';
import { FormHead } from '../../components/form-head';
import { signInWithPassword, signInStaffWithPassword } from '../../context/jwt/action';

// ----------------------------------------------------------------------

export const SignInSchema = zod.object({
  username: zod.string().min(1, { message: 'Hãy nhập tên!' }),
  password: zod.string().min(1, { message: 'Hãy nhập mật khẩu!' }).min(6, { message: '+6 kí tự!' }),
});

// ----------------------------------------------------------------------

export function JwtSignInView() {
  const router = useRouter();
  const showPassword = useBoolean();
  const { checkUserSession } = useAuthContext();

  const [errorMessage, setErrorMessage] = useState('');
  const [loginAsStaff, setLoginAsStaff] = useState(true);

  const defaultValues = {
    username: '',
    password: '',
  };

  const methods = useForm({
    resolver: zodResolver(SignInSchema),
    defaultValues,
  });

  const { handleSubmit, formState: { isSubmitting } } = methods;

  const onSubmit = handleSubmit(async ({ username, password }) => {
    try {
      if (loginAsStaff) {
        await signInStaffWithPassword({ username, password });
        await checkUserSession?.();
        router.replace(paths.dashboard.root);
      } else {
        await signInWithPassword({ username, password }); // admin
        await checkUserSession?.();
        router.replace(paths.dashboard.root);
      }
    } catch (error) {
      console.error(error);
      const feedbackMessage = getErrorMessage(error);
      setErrorMessage(feedbackMessage);
    }
  });

  const renderForm = () => (
    <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
      <FormControlLabel
        control={
          <Switch
            checked={loginAsStaff}
            onChange={(e) => setLoginAsStaff(e.target.checked)}
          />
        }
        label={loginAsStaff ? 'Đăng nhập với tài khoản STAFF' : 'Đăng nhập với tài khoản ADMIN'}
        sx={{ alignSelf: 'flex-start' }}
      />

      <Field.Text name="username" label="Tên tài khoản" slotProps={{ inputLabel: { shrink: true } }} />

      <Box sx={{ gap: 1.5, display: 'flex', flexDirection: 'column' }}>
        <Link component={RouterLink} href="#" variant="body2" color="inherit" sx={{ alignSelf: 'flex-end' }}>
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
                    <Iconify icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
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
            Chưa có tài khoản?
            <Link component={RouterLink} href={paths.auth.jwt.signUp} variant="subtitle2">
              Đăng ký ngay
            </Link>
          </>
        }
        sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      <Alert severity="info" sx={{ mb: 3 }}>
        Sử dụng <strong>{defaultValues.username}</strong> với mật khẩu <strong>{defaultValues.password}</strong>
        {' — chuyển công tắc để thử đăng nhập ADMIN/STAFF' }
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
  );
}