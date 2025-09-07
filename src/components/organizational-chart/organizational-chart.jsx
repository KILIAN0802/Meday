// src/components/ReusableTablePagination.jsx

import React from 'react';
import PropTypes from 'prop-types';
import { Box, IconButton, Tooltip } from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';

// Đã chuyển sang dạng `export function`
export function ReusableTablePagination({ count, rowsPerPage, page, onPageChange }) {
  const totalPages = Math.ceil(count / rowsPerPage);

  const handleBackButtonClick = () => {
    onPageChange(null, page - 1);
  };

  const handleNextButtonClick = () => {
    onPageChange(null, page + 1);
  };

  const handlePageNumberClick = (pageNumber) => {
    onPageChange(null, pageNumber);
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    for (let i = 0; i < totalPages; i++) {
      pageNumbers.push(
        <IconButton
          key={i}
          onClick={() => handlePageNumberClick(i)}
          disabled={page === i}
          sx={{
            width: 32,
            height: 32,
            margin: '0 4px',
            color: page === i ? 'primary.main' : 'text.secondary',
            backgroundColor: page === i ? 'primary.lighter' : 'transparent',
            '&:hover': {
                backgroundColor: 'action.hover'
            }
          }}
        >
          {i + 1}
        </IconButton>
      );
    }
    return pageNumbers;
  };
  
  if (totalPages <= 1) return null;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
      <Tooltip title="Trang trước">
        <IconButton
          onClick={handleBackButtonClick}
          disabled={page === 0}
          aria-label="previous page"
        >
          <KeyboardArrowLeft />
        </IconButton>
      </Tooltip>
      
      {renderPageNumbers()}

      <Tooltip title="Trang sau">
        <IconButton
          onClick={handleNextButtonClick}
          disabled={page >= totalPages - 1}
          aria-label="next page"
        >
          <KeyboardArrowRight />
        </IconButton>
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