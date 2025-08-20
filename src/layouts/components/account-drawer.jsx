'use client';

import { varAlpha } from 'minimal-shared/utils';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Avatar from '@mui/material/Avatar';
import Drawer from '@mui/material/Drawer';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { usePathname } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { _mock } from 'src/_mock';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { AnimateBorder } from 'src/components/animate';

import { useMockedUser } from 'src/auth/hooks';

import { UpgradeBlock } from './nav-upgrade';
import { AccountButton } from './account-button';
import { SignOutButton } from './sign-out-button';

// ----------------------------------------------------------------------

export function AccountDrawer({ data = [], onEditProfile, sx, ...other }) {
  const pathname = usePathname();
  const { user } = useMockedUser();
  const { value: open, onFalse: onClose, onTrue: onOpen } = useBoolean();

  // Hỗ trợ cả 2 dạng dữ liệu:
  // - Cách cũ: data là mảng menu items
  // - Cách mới: data là object { me, menu }
  const items = Array.isArray(data) ? data : (data?.menu || []);
  const me = Array.isArray(data) ? null : (data?.me || null);

  const renderAvatar = () => {
    const initial =
      (user?.username || user?.displayName || 'U').charAt(0).toUpperCase();

    return (
      <AnimateBorder
        sx={{ mb: 2, p: '6px', width: 96, height: 96, borderRadius: '50%' }}
        slotProps={{ primaryBorder: { size: 120, sx: { color: 'primary.main' } } }}
      >
        <Avatar src={user?.photoURL || me?.photoURL} alt={user?.username || user?.displayName} sx={{ width: 1, height: 1 }}>
          {initial}
        </Avatar>
      </AnimateBorder>
    );
  };

  const renderList = () => (
    <MenuList
      disablePadding
      sx={[
        (theme) => ({
          py: 3,
          px: 2.5,
          borderTop: `dashed 1px ${theme.vars.palette.divider}`,
          borderBottom: `dashed 1px ${theme.vars.palette.divider}`,
          '& li': { p: 0 },
        }),
      ]}
    >
      {(Array.isArray(items) ? items : []).map((option) => {
        const rootLabel = pathname.includes('/dashboard') ? 'Home' : 'Dashboard';
        const rootHref = pathname.includes('/dashboard') ? '/' : paths.dashboard.root;

        return (
          <MenuItem key={option.label}>
            <Link
              component={RouterLink}
              href={option.label === 'Home' ? rootHref : option.href}
              color="inherit"
              underline="none"
              onClick={onClose}
              sx={{
                p: 1,
                width: 1,
                display: 'flex',
                typography: 'body2',
                alignItems: 'center',
                color: 'text.secondary',
                '& svg': { width: 24, height: 24 },
                '&:hover': { color: 'text.primary' },
              }}
            >
              {option.icon}

              <Box component="span" sx={{ ml: 2 }}>
                {option.label === 'Home' ? rootLabel : option.label}
              </Box>

              {option.info && (
                <Label color="error" sx={{ ml: 1 }}>
                  {option.info}
                </Label>
              )}
            </Link>
          </MenuItem>
        );
      })}
    </MenuList>
  );

  // Dòng tiêu đề + dòng phụ
  const title = user?.username || user?.displayName || me?.displayName || '—';
  const subtitle =
    [user?.roleLabel, user?.fullname].filter(Boolean).join(' • ') ||
    me?.caption ||
    '';

  return (
    <>
      <AccountButton
        onClick={onOpen}
        photoURL={user?.photoURL || me?.photoURL}
        // Ưu tiên username để đồng bộ với yêu cầu hiển thị
        displayName={user?.username || user?.displayName || me?.displayName}
        sx={sx}
        {...other}
      />

      <Drawer
        open={open}
        onClose={onClose}
        anchor="right"
        slotProps={{
          backdrop: { invisible: true },
          paper: { sx: { width: 320 } },
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{ top: 12, left: 12, zIndex: 9, position: 'absolute' }}
        >
          <Iconify icon="mingcute:close-line" />
        </IconButton>

        <Scrollbar>
          <Box sx={{ pt: 8, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
            {renderAvatar()}

            <Typography variant="subtitle1" noWrap sx={{ mt: 2 }}>
              {title}
            </Typography>

            {!!subtitle && (
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }} noWrap>
                {subtitle}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              p: 3,
              gap: 1,
              flexWrap: 'wrap',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            {Array.from({ length: 3 }, (_, index) => (
              <Tooltip
                key={_mock.fullName(index + 1)}
                title={`Switch to: ${_mock.fullName(index + 1)}`}
              >
                <Avatar
                  alt={_mock.fullName(index + 1)}
                  src={_mock.image.avatar(index + 1)}
                  onClick={() => {}}
                />
              </Tooltip>
            ))}

            <Tooltip title="Add account">
              <IconButton
                sx={[
                  (theme) => ({
                    bgcolor: varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
                    border: `dashed 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.32)}`,
                  }),
                ]}
              >
                <Iconify icon="mingcute:add-line" />
              </IconButton>
            </Tooltip>
          </Box>

          {renderList()}

          <Box sx={{ px: 2.5, py: 3 }}>
            <UpgradeBlock />
          </Box>
        </Scrollbar>
                  
        <Box sx={{ p: 2.5 }}>
          <SignOutButton onClose={onClose} />
        </Box>
      </Drawer>
    </>
  );
}
