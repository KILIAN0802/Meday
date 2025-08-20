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

import { signUp } from '../../context/jwt';
import { useAuthContext } from '../../hooks';
import { getErrorMessage } from '../../utils';
import { FormHead } from '../../components/form-head';
import { SignUpTerms } from '../../components/sign-up-terms';

// ----------------------------------------------------------------------

export const SignUpSchema = zod.object({
  firstName: zod.string().min(1, { message: 'Hãy nhập họ!' }),
  lastName: zod.string().min(1, { message: 'Hãy nhập tên!' }),
  email: zod
    .string()
    .min(1, { message: 'Hãy nhập email!' })
    .email({ message: 'Định dạng email không đúng!' }),
  password: zod
    .string()
    .min(1, { message: 'Hãy nhập mật khâir!' })
    .min(6, { message: 'Mật khẩu chứa ít nhất 6 kí tự!' }),
});

// ----------------------------------------------------------------------

export function JwtSignUpView() {
  const router = useRouter();

  const showPassword = useBoolean();

  const { checkUserSession } = useAuthContext();

  const [errorMessage, setErrorMessage] = useState('');

  const defaultValues = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  };

  const methods = useForm({
    resolver: zodResolver(SignUpSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await signUp({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });
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
      <Box
        sx={{ display: 'flex', gap: { xs: 3, sm: 2 }, flexDirection: { xs: 'column', sm: 'row' } }}
      >
        <Field.Text
          name="firstName"
          label="Họ"
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Field.Text
          name="lastName"
          label="Tên"
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Box>

      <Field.Text name="email" label="Địa chỉ email" slotProps={{ inputLabel: { shrink: true } }} />

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

      <Button
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Create account..."
      >
        Tạo tài khoản
      </Button>
    </Box>
  );

  return (
    <>
      <FormHead
        title="Tạo tài khoản hoàn toàn miễn phí!"
        description={
          <>
            {`Bạn đã có tài khoản? `}
            <Link component={RouterLink} href={paths.auth.jwt.signIn} variant="subtitle2">
              Đăng nhập ngay
            </Link>
          </>
        }
        sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm()}
      </Form>

      <SignUpTerms />
    </>
  );
}
