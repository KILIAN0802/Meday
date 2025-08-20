import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

import { Add as AddIcon, Check, Close } from '@mui/icons-material';

import { paths } from 'src/routes/paths';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { usePopover } from 'minimal-shared/hooks';
import { TableHeadCustom } from 'src/components/table';
import { CustomPopover } from 'src/components/custom-popover';

export function EmployeeUserList_NewList({
  title,
  subheader,
  tableData,
  headCells,
  onDeleteRow,
  editingId,
  draftForm,
  onStartEdit,
  onChangeDraft,
  onCancelEdit,
  onSubmitEdit,
  sx,
  ...other
}) {
  return (
    <Card sx={sx} {...other}>
      <CardHeader title={title} subheader={subheader} sx={{ mb: 3 }} />

      <Scrollbar sx={{ minHeight: 402 }}>
        <Table sx={{ minWidth: 680 }}>
          <TableHeadCustom headCells={headCells} />
          <TableBody>
            {tableData.map((row) => (
              <RowItem
                key={row.id}
                row={row}
                onDeleteRow={onDeleteRow}
                editingId={editingId}
                draftForm={draftForm}
                onStartEdit={onStartEdit}
                onChangeDraft={onChangeDraft}
                onCancelEdit={onCancelEdit}
                onSubmitEdit={onSubmitEdit}
              />
            ))}
          </TableBody>
        </Table>
      </Scrollbar>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', textAlign: 'right', gap: 2, p: 2 }}>
        <Button
          size="small"
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          href={paths.dashboard.general.CreateEmployeeUser}
          sx={{
            borderRadius: 2, textTransform: 'none', boxShadow: 2, fontWeight: 'bold',
            px: 2, py: 1.5, minHeight: 48, transition: 'all .3s',
            '&:hover': { boxShadow: 4, transform: 'scale(1.03)' },
          }}
        >
          Tạo tài khoản mới
        </Button>

        <Button size="small" color="inherit" endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={18} sx={{ ml: -0.5 }} />}>
          Xem toàn bộ
        </Button>
      </Box>
    </Card>
  );
}

function RowItem({
  row,
  onDeleteRow,
  editingId,
  draftForm,
  onStartEdit,
  onChangeDraft,
  onCancelEdit,
  onSubmitEdit
}) {
  const menuActions = usePopover();
  const isEditing = editingId === row.id;

  const handleEnter = (e) => {
    if (e.key === 'Enter') onSubmitEdit && onSubmitEdit();
  };

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <MenuItem
          onClick={() => {
            menuActions.onClose();
            onStartEdit && onStartEdit(row);
          }}
        >
          <Iconify icon="solar:share-bold" />
          Chỉnh sửa
        </MenuItem>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <MenuItem
          onClick={() => {
            menuActions.onClose();
            onDeleteRow && onDeleteRow(row.id, row.fullname);
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          Xóa
        </MenuItem>
      </MenuList>
    </CustomPopover>
  );

  return (
    <>
      <TableRow>
        <TableCell>{row.id}</TableCell>

        {/* Username */}
        <TableCell>
          {isEditing ? (
            <TextField
              size="small"
              value={draftForm.username}
              onChange={(e) => onChangeDraft && onChangeDraft('username', e.target.value)}
              onKeyDown={handleEnter}
              autoFocus
            />
          ) : (
            row.username
          )}
        </TableCell>

        {/* Fullname */}
        <TableCell>
          {isEditing ? (
            <TextField
              size="small"
              value={draftForm.fullname}
              onChange={(e) => onChangeDraft && onChangeDraft('fullname', e.target.value)}
              onKeyDown={handleEnter}
            />
          ) : (
            row.fullname
          )}
        </TableCell>

        {/* Role */}
        <TableCell>
          {isEditing ? (
            <FormControlLabel
              control={
                <Switch
                  checked={draftForm.role === 1}
                  onChange={(e) => onChangeDraft && onChangeDraft('role', e.target.checked ? 1 : 2)}
                />
              }
              label={draftForm.role === 1 ? 'Bác sĩ (1)' : 'Y tá (2)'}
            />
          ) : (
            row.role
          )}
        </TableCell>

        <TableCell>{row.createdDate}</TableCell>
        <TableCell>{row.createdTime}</TableCell>
        <TableCell>{row.updatedDate}</TableCell>
        <TableCell>{row.updatedTime}</TableCell>
        <TableCell align="right" sx={{ pr: 1 }}>
          {isEditing ? (
            <>
              <IconButton color="primary" onClick={onSubmitEdit} title="Lưu (Enter)">
                <Check />
              </IconButton>
              <IconButton color="inherit" onClick={onCancelEdit} title="Hủy">
                <Close />
              </IconButton>
            </>
          ) : (
            <IconButton color={menuActions.open ? 'inherit' : 'default'} onClick={menuActions.onOpen}>
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          )}
        </TableCell>
      </TableRow>

      {!isEditing && renderMenuActions()}
    </>
  );
}
