'use client';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';

import { DashboardContent } from 'src/layouts/dashboard';
import { SeoIllustration } from 'src/assets/illustrations';
import { _EmployeeUser } from 'src/_mock';

import { svgColorClasses } from 'src/components/svg-color';

import { useMockedUser } from 'src/auth/hooks';

import { CreateEmployeeUserNewCreate }  from '../CreateEmployeeUser-new-create';


// ----------------------------------------------------------------------

export function CreateEmployeeUser() {
  const { user } = useMockedUser();
  const theme = useTheme();

  return (
    <DashboardContent maxWidth="xl">
      <CreateEmployeeUserNewCreate 
      />
    </DashboardContent>
  );
}