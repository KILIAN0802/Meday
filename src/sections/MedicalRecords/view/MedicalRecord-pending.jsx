'use client';

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
import { TableHeadCustom } from 'src/components/table';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomPopover } from 'src/components/custom-popover';

// ----------------------------------------------------------------------

export function MedicalRecordsPending() {
  const TABLE_HEAD = [
    { id: 'code', label: 'Mã HS', width: 140 },
    { id: 'type', label: 'Loại bệnh án' },
    { id: 'patient', label: 'Bệnh nhân', width: 220 },
    { id: 'viewedAt', label: 'Ngày xem', width: 140, align: 'right' },
  ];

  const rows = [
    { code: 'HS2025001', type: 'Bệnh án Mạn tính mày đay da vẽ nổi', patient: 'Nguyễn Thị Mận', viewedAt: '10/07/2025' },
    { code: 'HS2025002', type: 'Bệnh án mạn tính tái khám', patient: 'Hoàng Thị Hoa', viewedAt: '08/06/2025' },
    { code: 'HS2025003', type: 'Bệnh án cấp tính', patient: 'Phạm Văn Nam', viewedAt: '' },
    { code: 'HS2025004', type: 'Bệnh án mạn tính lần 1', patient: '', viewedAt: '' },
  ];

  return (
    <Card>
      <CardHeader title="Danh sách bệnh án chờ xử lý" />
      <Divider />
      <Scrollbar>
        <Table sx={{ minWidth: 880 }}>
          <TableHeadCustom headCells={TABLE_HEAD} />
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.code} hover>
                <TableCell sx={{ fontWeight: 600 }}>{r.code}</TableCell>
                <TableCell>
                  <Box component="a" href="#" sx={{ color: 'primary.main', textDecoration: 'underline' }}>
                    {r.type}
                  </Box>
                </TableCell>
                <TableCell>{r.patient || '-'}</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  {r.viewedAt || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Scrollbar>
    </Card>
  );
}
