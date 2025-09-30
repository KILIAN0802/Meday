import React from 'react';
import PropTypes from 'prop-types';
import { TableContainer, Table, TableHead, TableRow, TableCell } from '@mui/material';

const tableHeaderStyles = { fontWeight: 'bold' };

export function MedicalRecordTableLayout({ status, children }) {
  return (
    <TableContainer>
      <Table>
        <TableHead sx={{ bgcolor: 'action.hover' }}>
          <TableRow>
            <TableCell sx={tableHeaderStyles}>ID</TableCell>
            <TableCell sx={tableHeaderStyles}>Bệnh nhân</TableCell>
            <TableCell sx={tableHeaderStyles}>Mẫu bệnh án</TableCell>
            <TableCell sx={tableHeaderStyles}>Lý do khám</TableCell>
            <TableCell align="center" sx={tableHeaderStyles}>Trạng thái</TableCell>
            {status !== 'ALL' && status !== 'COMPLETED' && (
              <TableCell align="right" sx={tableHeaderStyles}>Chức năng</TableCell>
            )}
          </TableRow>
        </TableHead>
        {children}
      </Table>
    </TableContainer>
  );
}

MedicalRecordTableLayout.propTypes = {
  status: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};