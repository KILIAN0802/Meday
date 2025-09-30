'use client';

import React from 'react';
import PropTypes from 'prop-types';
import {
  TableRow,
  TableCell,
  CircularProgress,
  Button,
  Typography,
} from '@mui/material';
import { StatusChip } from './SharedComponents'; // Đường dẫn tới file SharedComponents

/**
 * RecordsTableView (Presentational Component)
 * - Chỉ chịu trách nhiệm render các hàng (rows) trong TableBody.
 * - Nhận dữ liệu và các hàm xử lý từ component cha qua props.
 * - Không chứa state hay logic phức tạp.
 */
export function RecordsTableView({
  records,
  loading,
  status,
  isActionLoadingId,
  templateMap,
  onSelectPerson,
  onViewDetails,
  onUpdateStatus,
}) {
  // Hiển thị vòng xoay loading khi đang tải dữ liệu
  if (loading) {
    return (
      <TableRow>
        <TableCell colSpan={6} align="center">
          <CircularProgress sx={{ my: 4 }} />
        </TableCell>
      </TableRow>
    );
  }

  // Hiển thị thông báo khi không có dữ liệu
  if (records.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={6} align="center">
          <Typography variant="body1" sx={{ my: 4, color: 'text.secondary' }}>
            Không tìm thấy bệnh án nào.
          </Typography>
        </TableCell>
      </TableRow>
    );
  }

  // Render danh sách các bệnh án
  return (
    <>
      {records.map((row) => (
        <TableRow key={row.id} hover>
          <TableCell>{row.id}</TableCell>
          <TableCell>
            <Typography
              onClick={() => onSelectPerson(row.patient)}
              variant="body2"
              sx={{
                color: 'primary.main',
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              {row.patient?.fullname || 'N/A'}
            </Typography>
          </TableCell>
          <TableCell
            onClick={() => onViewDetails(row.templateId, row.id)}
            sx={{
              cursor: 'pointer',
              color: 'primary.main',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            {templateMap[row.templateId] || `Mẫu ${row.templateId}`}
          </TableCell>
          <TableCell>{row.appointment?.reason || 'N/A'}</TableCell>
          <TableCell align="center">
            <StatusChip status={row.appointment?.status} />
          </TableCell>

          {/* Cột chức năng chỉ hiển thị với một số status nhất định */}
          {status !== 'ALL' && status !== 'COMPLETED' && (
            <TableCell align="right">
              <Button
                disabled={isActionLoadingId === row.appointment?.id}
                onClick={() =>
                  onUpdateStatus(
                    row.appointment?.id,
                    status === 'PENDING' ? 'CONFIRMED' : 'COMPLETED'
                  )
                }
              >
                {isActionLoadingId === row.appointment?.id ? (
                  <CircularProgress size={20} color="inherit" />
                ) : status === 'PENDING' ? (
                  'Tiếp nhận'
                ) : (
                  'Hoàn thành'
                )}
              </Button>
            </TableCell>
          )}
        </TableRow>
      ))}
    </>
  );
}

RecordsTableView.propTypes = {
  records: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  status: PropTypes.string.isRequired,
  isActionLoadingId: PropTypes.number,
  templateMap: PropTypes.object.isRequired,
  onSelectPerson: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
  onUpdateStatus: PropTypes.func.isRequired,
};