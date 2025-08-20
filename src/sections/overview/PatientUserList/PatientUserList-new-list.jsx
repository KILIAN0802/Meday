import { usePopover } from 'minimal-shared/hooks';

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
import Grid from '@mui/material';

import { paths } from 'src/routes/paths';
import { Iconify } from 'src/components/iconify';
import AddIcon from "@mui/icons-material/Add";
import { Scrollbar } from 'src/components/scrollbar';
import { TableHeadCustom } from 'src/components/table';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

export function PatientUserList_NewList({ title, subheader, tableData, headCells, sx, ...other }) {
  return (
    <Card sx={sx} {...other}>
      <CardHeader title={title} subheader={subheader} sx={{ mb: 3 }} />

      <Scrollbar sx={{ minHeight: 402 }}>
        <Table sx={{ minWidth: 680 }}>
          <TableHeadCustom headCells={headCells} />

          <TableBody>
            {tableData.map((row) => (
              <RowItem key={row.id} row={row} />
            ))}
          </TableBody>
        </Table>
      </Scrollbar>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', textAlign: 'right', gap: 2, padding: 2 }}>
        
        <Button
        size="small"
        variant="contained" // đổi từ "inherit" sang "contained" cho nổi
        color="primary"
        startIcon={<AddIcon />}
        href={paths.dashboard.general.CreatePatientUser}
        sx={{
          borderRadius: 2,
          textTransform: "none",
          boxShadow: 2,
          fontWeight: "bold",
          px: 2,
          py: 1.5, // tăng chiều cao
      minHeight: 48, // ép chiều cao tối thiểu
      
          transition: "all 0.3s ease",
          "&:hover": {
            boxShadow: 4,
            transform: "scale(1.03)"
          }
        }}
      >
        Tạo tài khoản mới
      </Button>

        <Button
          size="small"
          color="inherit"
          endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={18} sx={{ ml: -0.5 }} />}
        >
          Xem toàn bộ
        </Button>
      </Box>
    </Card>
  );
}

// ----------------------------------------------------------------------

function RowItem({ row }) {
  const menuActions = usePopover();

  const handleDownload = () => {
    menuActions.onClose();
    console.info('DOWNLOAD', row.id);
  };

  const handlePrint = () => {
    menuActions.onClose();
    console.info('PRINT', row.id);
  };

  const handleShare = () => {
    menuActions.onClose();
    console.info('SHARE', row.id);
  };

  const handleDelete = () => {
    menuActions.onClose();
    console.info('DELETE', row.id);
  };

  const renderMenuActions = () => (
    <CustomPopover
      open={menuActions.open}
      anchorEl={menuActions.anchorEl}
      onClose={menuActions.onClose}
      slotProps={{ arrow: { placement: 'right-top' } }}
    >
      <MenuList>
        <MenuItem onClick={handleDownload}>
          <Iconify icon="eva:cloud-download-fill" />
          Tải
        </MenuItem>

        <MenuItem onClick={handlePrint}>
          <Iconify icon="solar:printer-minimalistic-bold" />
          In
        </MenuItem>

        <MenuItem onClick={handleShare}>
          <Iconify icon="solar:share-bold" />
          Chỉnh sửa
        </MenuItem>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
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
        <TableCell>{row.PatientUserId}</TableCell>
        <TableCell>{row.PatientUserName}</TableCell>
        <TableCell>{row.account}</TableCell>
        <TableCell>{row.password}</TableCell>
        <TableCell>{row.phoneNumber}</TableCell>
        <TableCell>{row.email}</TableCell>
        <TableCell>{row.date}</TableCell>
        <TableCell>{row.sex}</TableCell>
        <TableCell>{row.nationality}</TableCell>
        <TableCell>{row.nation}</TableCell>
        <TableCell>{row.address}</TableCell>
        <TableCell>{row.work}</TableCell>
      </TableRow>

      {renderMenuActions()}
    </>
  );
}
