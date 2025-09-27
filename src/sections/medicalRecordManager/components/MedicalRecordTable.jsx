'use client';

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Container, Typography, Card, TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
  CircularProgress, Button, Snackbar, Alert
} from '@mui/material';
import { useMedicalRecords } from '../hooks/useMedicalRecords';
import { ReusableTablePagination } from 'src/components/pagination';
import { 
    PersonDetailsModal, 
    StatusChip, 
    MedicalRecordViewerModal, 
    VitalsFormModal,
    ImageViewerModal
} from './SharedComponents';
import { 
    updateAppointmentStatusID 
} from 'src/api/appointments-staff';
import { 
    getMedicalRecordTemplateById 
} from 'src/api/medical-record-templates-staff';
import { getVitalGroupById } from 'src/api/vitals';
import { 
    getVitalValuesMedicalRecord, 
    updateVitalMedicalRecordeById 
} from 'src/api/medical-record-staff';

export function MedicalRecordTable({ status, title }) {
  const { 
    medicalRecords, 
    totalRecords, 
    loading, 
    error, 
    page, 
    setPage, 
    rowsPerPage, 
    setRowsPerPage, 
    refetch 
  } = useMedicalRecords(status);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [isLoadingVitals, setIsLoadingVitals] = useState(false);
  const [vitalQuestionGroups, setVitalQuestionGroups] = useState([]);
  const [activeMedicalRecordId, setActiveMedicalRecordId] = useState(null);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isActionLoadingId, setIsActionLoadingId] = useState(null);

  const templateMap = { 16: 'Bệnh án cấp tính', 17: 'Bệnh án mãn tính lần 1', 18: 'Bệnh án mãn tính tái khám' };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = async (templateId, medicalRecordId) => {
    if (!templateId) {
      setNotification({ open: true, message: 'Mẫu bệnh án không có ID hợp lệ.', severity: 'error' });
      return;
    }
    if (status === 'CONFIRMED') {
      setIsVitalsModalOpen(true);
    } else {
      setIsViewerModalOpen(true);
    }

    setIsLoadingVitals(true);
    setVitalQuestionGroups([]);
    setActiveMedicalRecordId(medicalRecordId);

    try {
      const [templateResponse, savedValuesResponse] = await Promise.all([
        getMedicalRecordTemplateById(templateId),
        getVitalValuesMedicalRecord(medicalRecordId)
      ]);

      const savedValues = savedValuesResponse?.data || [];
      const valuesMap = new Map();
      savedValues.forEach(val => valuesMap.set(val.vitalIndicatorId, val.value));

      const vitalGroupIds = templateResponse?.data?.vitalGroupIds || [];
      if (vitalGroupIds.length === 0) {
        setIsLoadingVitals(false);
        return;
      }
      
      const vitalGroupPromises = vitalGroupIds.map((id) => getVitalGroupById(id));
      const vitalGroupResponses = await Promise.all(vitalGroupPromises);
      
      const groupsWithValues = vitalGroupResponses.map((response) => {
        if (!response?.data?.indicators) return null;
        return {
          id: response.data.id,
          name: response.data.name,
          indicators: response.data.indicators.map((indicator) => ({
            ...indicator,
            savedValue: valuesMap.get(indicator.id),
          })),
        };
      }).filter(Boolean);

      setVitalQuestionGroups(groupsWithValues);
    } catch (err) {
      console.error('Lỗi khi lấy dữ liệu form:', err);
      setNotification({ open: true, message: 'Không thể tải dữ liệu chi tiết bệnh án.', severity: 'error' });
    } finally {
      setIsLoadingVitals(false);
    }
  };

  const handleSaveChanges = async (medicalRecordId, updatedValues) => {
    setIsActionLoadingId(medicalRecordId);
    try {
        const formattedValues = Object.entries(updatedValues)
            .filter(([, value]) => (Array.isArray(value) ? value.length > 0 : value !== '' && value !== null && value !== undefined))
            .map(([indicatorId, value]) => {
                const formattedValue = Array.isArray(value) ? value : { value };
                return { 
                    vitalIndicatorId: parseInt(indicatorId, 10), 
                    value: formattedValue, 
                    note: "" 
                };
            });
  
        if (formattedValues.length > 0) {
            await updateVitalMedicalRecordeById(medicalRecordId, { vitalValues: formattedValues });
            setNotification({ open: true, message: 'Cập nhật chỉ số thành công!', severity: 'success' });
            refetch();
        } else {
            setNotification({ open: true, message: 'Không có thay đổi nào để lưu.', severity: 'info' });
        }
    } catch (err) {
        console.error('Lỗi khi cập nhật chỉ số:', err);
        setNotification({ open: true, message: 'Cập nhật thất bại.', severity: 'error' });
    } finally {
        setIsActionLoadingId(null);
        setIsVitalsModalOpen(false);
    }
  };
  
  const handleUpdateStatus = async (appointmentId, newStatus) => {
    setIsActionLoadingId(appointmentId);
    try {
        await updateAppointmentStatusID(appointmentId, { status: newStatus });
        setNotification({ open: true, message: 'Cập nhật trạng thái thành công!', severity: 'success' });
        refetch();
    } catch(err) {
        console.error('Lỗi khi cập nhật trạng thái:', err);
        setNotification({ open: true, message: 'Cập nhật trạng thái thất bại.', severity: 'error' });
    } finally {
        setIsActionLoadingId(null);
    }
  };

  const handleOpenImageViewer = (images) => {
    setSelectedImages(images);
    setIsImageViewerOpen(true);
  };

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 5 }}>{title}</Typography>
      <Card>
        {error && <Typography color="error" sx={{ p: 2 }}>Lỗi: {error}</Typography>}
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Bệnh nhân</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Mẫu bệnh án</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Lý do khám</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
                {status !== 'ALL' && status !== 'COMPLETED' && <TableCell align="right" sx={{ fontWeight: 'bold' }}>Chức năng</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center"><CircularProgress sx={{ my: 4 }}/></TableCell></TableRow>
              ) : medicalRecords.length > 0 ? (
                medicalRecords.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>
                        <Typography onClick={() => setSelectedPerson(row.patient)} variant="body2" sx={{ color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                            {row.patient?.fullname || 'N/A'}
                        </Typography>
                    </TableCell>
                    <TableCell 
                        onClick={() => handleViewDetails(row.templateId, row.id)}
                        sx={{ cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                    >
                      {templateMap[row.templateId] || `Mẫu ${row.templateId}`}
                    </TableCell>
                    <TableCell>{row.appointment?.reason || 'N/A'}</TableCell>
                    <TableCell align="center"><StatusChip status={row.appointment?.status} /></TableCell>
                  
                    {status !== 'ALL' && status !== 'COMPLETED' && (
                        <TableCell align="right">
                            <Button 
                              disabled={isActionLoadingId === row.appointment?.id}
                              onClick={() => handleUpdateStatus(row.appointment?.id, status === 'PENDING' ? 'CONFIRMED' : 'COMPLETED')}
                            >
                              {isActionLoadingId === row.appointment?.id ? <CircularProgress size={20} color="inherit"/> : (status === 'PENDING' ? 'Tiếp nhận' : 'Hoàn thành')}
                            </Button>
                        </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body1" sx={{ my: 4, color: 'text.secondary' }}>Không tìm thấy bệnh án nào.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <ReusableTablePagination
          count={totalRecords}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>
      
      <PersonDetailsModal person={selectedPerson} open={!!selectedPerson} onClose={() => setSelectedPerson(null)} />
      
      <MedicalRecordViewerModal
        open={isViewerModalOpen}
        onClose={() => setIsViewerModalOpen(false)}
        loading={isLoadingVitals}
        questionGroups={vitalQuestionGroups}
        onImageClick={handleOpenImageViewer}
      />

      <VitalsFormModal
        open={isVitalsModalOpen}
        onClose={() => setIsVitalsModalOpen(false)}
        loading={isLoadingVitals}
        questionGroups={vitalQuestionGroups}
        onSave={handleSaveChanges}
        medicalRecordId={activeMedicalRecordId}
      />
      
      <ImageViewerModal
        open={isImageViewerOpen}
        onClose={() => setSelectedImages([]) & setIsImageViewerOpen(false)}
        images={selectedImages}
      />

      <Snackbar
        open={notification.open} autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity} sx={{ width: '100%' }}>
            {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

MedicalRecordTable.propTypes = {
    status: PropTypes.oneOf(['PENDING', 'CONFIRMED', 'COMPLETED', 'ALL']).isRequired,
    title: PropTypes.string.isRequired,
};