'use client';
import React from 'react';
import {
  Box, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  CircularProgress, Button, IconButton, Pagination, Stack, Typography, FormControl, Select, MenuItem
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { statusChip } from '../utils/statusChip'

export function MedicalRecordTable({ 
  rows, 
  loading, 
  page, 
  limit, 
  total, 
  onPaginate, 
  onLimitChange, 
  onOpenMenu, 
  onOpenPatient, 
  onOpenRecord 
}) {
  return (
    <Paper variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Bệnh nhân</TableCell>
            <TableCell>Số điện thoại</TableCell>
            <TableCell>Mẫu bệnh án</TableCell>
            <TableCell>Lý do khám</TableCell>
            <TableCell>Trạng thái</TableCell>
            <TableCell>Chức năng</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={7} align="center"><CircularProgress size={22} /></TableCell></TableRow>
          ) : rows.length === 0 ? (
            <TableRow><TableCell colSpan={7} align="center">Không có dữ liệu</TableCell></TableRow>
          ) : (
            rows.map((row) => {
              const p = row.patient || {}; const t = row.template || {}; const a = row.appointment;
              return (
                <TableRow key={row.id} hover>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>
                    <Button variant="text" sx={{ color: 'green', fontWeight: 'bold' }} onClick={() => onOpenPatient(p)}>
                      {p.fullname || '—'}
                    </Button>
                  </TableCell>
                  <TableCell >{p.phone || '—'}</TableCell>
                  <TableCell>
                    <Button variant="text" sx={{ color: 'green', fontWeight: 'bold' }} onClick={() => onOpenRecord(row)}>
                      {t.name || '—'}
                    </Button>
                  </TableCell>
                  <TableCell>{a?.reason || ''}</TableCell>
                  <TableCell>{statusChip(a)}</TableCell>
                  <TableCell>
                    <IconButton onClick={(e) => onOpenMenu(e, row)} size="small">
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2">Hiển thị:</Typography>
          <FormControl size="small" sx={{ minWidth: 80 }}>
            <Select value={limit} onChange={(e) => onLimitChange(e.target.value)}>
              {[5, 10, 15, 20].map((num) => <MenuItem key={num} value={num}>{num}</MenuItem>)}
            </Select>
          </FormControl>
          <Typography variant="body2">/ trang</Typography>
        </Stack>
        <Pagination count={Math.ceil(total / limit)} page={page} onChange={(_e, newPage) => onPaginate(newPage)} size="small" />
      </Box>
    </Paper>
  );
}
