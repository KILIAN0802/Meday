// src/components/ReusableTablePagination.jsx

import React from 'react';
import PropTypes from 'prop-types';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';

// Đã cập nhật để chỉ hiển thị nút Next/Previous
export function ReusableTablePagination({ count, rowsPerPage, page, onPageChange }) {
  const totalPages = Math.ceil(count / rowsPerPage);

  const handleBackButtonClick = () => {
    onPageChange(null, page - 1);
  };

  const handleNextButtonClick = () => {
    onPageChange(null, page + 1);
  };

  if (totalPages <= 1) return null;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', p: 2 }}>
      <Typography variant="body2" sx={{ mr: 2 }}>
        Trang {page + 1}
      </Typography>

      <Tooltip title="Trang trước">
        {/* Vô hiệu hóa nút khi ở trang đầu tiên */}
        <span>
          <IconButton onClick={handleBackButtonClick} disabled={page === 0}>
            <KeyboardArrowLeft />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Trang sau">
        {/* Vô hiệu hóa nút khi không còn dữ liệu ở trang sau */}
        {/* Giả định rằng nếu số lượng bản ghi trả về < rowsPerPage thì đó là trang cuối */}
        <span>
          <IconButton onClick={handleNextButtonClick} disabled={page >= totalPages - 1}>
            <KeyboardArrowRight />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
};

ReusableTablePagination.propTypes = {
  count: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};