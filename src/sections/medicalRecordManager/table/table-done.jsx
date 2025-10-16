'use client';

import React from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { useMedicalRecordManager } from '../hooks/composites/shareHooks';

import {MedicalRecordTable, PatientDialog, RecordDialog, CreateAppointmentDialog} from '../components';
const STATUS_LABEL = {
  PENDING: 'Chờ xử lý',
  CONFIRMED: 'Đang xử lý',
  CANCELLED: 'Đã hủy',
  COMPLETED: 'Xử lý xong',
};
const ALL_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
export function CompletedMedicalRecords() {
  const manager = useMedicalRecordManager();
  const {
    filtered,
    loading,
    handleSearchInput,
    openMenu, closeMenu, onChangeStatus,
    openPatientDialog, openRecordDialog,
    nextRecordStep,
    patientDialogOpen, selectedPatient, setPatientDialogOpen,
    recordDialogOpen, recordStep, selectedRecord, setRecordDialogOpen, setRecordStep,
    createOpen, createPayload, submitting, doctor,
    changeCreatePayload, submitCreateAppointment, openCreateModal, closeCreateModal,
    menuAnchorEl, menuRow,
    searchText,
    vitalValues,
  } = manager;

  const completedFiltered = React.useMemo(
    () => (filtered || []).filter(
      r => r?.appointment?.status?.toUpperCase() === 'COMPLETED'
    ),
    [filtered]
  );

  const [page, setPage]   = React.useState(1);
  const [limit, setLimit] = React.useState(10);

  React.useEffect(() => { setPage(1); }, [completedFiltered]);
  const displayRows = React.useMemo(() => {
    const start = (page - 1) * limit;
    return completedFiltered.slice(start, start + limit);
  }, [completedFiltered, page, limit]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Danh sách bệnh án đã xử lý
          </Typography>
          <TextField
            size="small"
            placeholder="Tìm theo tên, SĐT hoặc ID..."
            value={searchText}
            onChange={handleSearchInput}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ width: 350 }}
          />
        </Box>

        <MedicalRecordTable
          rows={displayRows}
          loading={loading}
          page={page}
          limit={limit}
          total={completedFiltered.length}
          onPaginate={(p) => setPage(p)}
          onLimitChange={(l) => { setLimit(parseInt(l, 10)); setPage(1); }}
          onOpenMenu={openMenu}
          onOpenPatient={openPatientDialog}
          onOpenRecord={openRecordDialog}
        />

        <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={closeMenu}>
          {!menuRow?.appointment
            ? [<MenuItem key="add" onClick={() => openCreateModal(menuRow)}>Thêm lịch hẹn</MenuItem>]
            : [
                <MenuItem key="label" disabled>Chuyển trạng thái</MenuItem>,
                ...ALL_STATUSES.map((st) => (
                  <MenuItem key={st} onClick={() => onChangeStatus(st)}>
                    {STATUS_LABEL[st]}
                  </MenuItem>
                )),
              ]}
        </Menu>

        <PatientDialog
          open={patientDialogOpen}
          patient={selectedPatient}
          onClose={() => setPatientDialogOpen(false)}
        />

        <RecordDialog
          open={recordDialogOpen}
          step={recordStep}
          loading={loading}
          record={selectedRecord}
          vitalValues={vitalValues}
          onBack={() => setRecordStep(1)}
          onNext={nextRecordStep}
          onClose={() => setRecordDialogOpen(false)}
        />

        <CreateAppointmentDialog
          open={createOpen}
          doctor={doctor}
          payload={createPayload}
          submitting={submitting}
          onClose={closeCreateModal}
          onChange={changeCreatePayload}
          onSubmit={submitCreateAppointment}
          statuses={['PENDING','CONFIRMED','CANCELLED','COMPLETED']}
          statusLabels={{ PENDING:'Chờ xử lý', CONFIRMED:'Đang xử lý', CANCELLED:'Đã hủy', COMPLETED:'Xử lý xong' }}
        />
      </Box>
    </LocalizationProvider>
  );
}