'use client';

import React from 'react';
import {Box, Typography, TextField, InputAdornment, Menu, MenuItem} from '@mui/material';
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

export function PendingMedicalRecords() {
  const manager = useMedicalRecordManager();

  const {
    rows,
    filtered,
    page,
    limit,
    loading,
    recordDialogOpen,
    recordStep,
    selectedRecord,
    patientDialogOpen,
    selectedPatient,
    createOpen,
    createPayload,
    submitting,
    doctor,
    vitalValues,
    applyPaginate,
    handleSearchInput,
    openMenu,
    closeMenu,
    onChangeStatus,
    openPatientDialog,
    openRecordDialog,
    nextRecordStep,
    openCreateModal,
    closeCreateModal,
    changeCreatePayload,
    submitCreateAppointment,
    menuAnchorEl,
    menuRow,
    searchText,
    setRecordDialogOpen,
    setPatientDialogOpen,
    setRecordStep,
  } = manager;

  const pendingFiltered = React.useMemo(() => {
    return (filtered || []).filter((r) => {
      const status = r?.appointment?.status?.toUpperCase?.() || null;
      return !r.appointment || status === 'PENDING';
    });
  }, [filtered]);

  const startIndex = (page - 1) * limit;
  const displayRows = pendingFiltered.slice(startIndex, startIndex + limit);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box
          sx={{
            mb: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Danh sách bệnh án chờ xử lý
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
          total={pendingFiltered.length}
          onPaginate={(p) => applyPaginate(pendingFiltered, p, limit)}
          onLimitChange={(l) => applyPaginate(pendingFiltered, 1, parseInt(l, 10))}
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
          statuses={ALL_STATUSES}
          statusLabels={STATUS_LABEL}
        />
      </Box>
    </LocalizationProvider>
  );
}
