'use client';

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Card, TableBody, Typography, Snackbar, Alert } from '@mui/material';

import { useMedicalRecords } from '../hooks/useMedicalRecords';
import { updateAppointmentStatusID } from 'src/api/appointments-staff';
import { getMedicalRecordTemplateById } from 'src/api/medical-record-templates-staff';
import { getVitalGroupById } from 'src/api/vitals';
import { getVitalValuesMedicalRecord, updateVitalMedicalRecordeById } from 'src/api/medical-record-staff';

import { ReusableTablePagination } from 'src/components/pagination';
import { MedicalRecordTableLayout } from './layouts/MedicalRecordTableLayout';
import { RecordsTableView } from './RecordsTableView';

import {
  VitalsFormModal,
  MedicalRecordViewerModal,
  ImageViewerModal,
  PersonDetailsModal
} from './modals';


export function MedicalRecordClientView({ status }) {
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
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);

  const [isLoadingVitals, setIsLoadingVitals] = useState(false);
  const [vitalQuestionGroups, setVitalQuestionGroups] = useState([]);
  const [activeMedicalRecordId, setActiveMedicalRecordId] = useState(null);
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
    status === 'CONFIRMED' ? setIsVitalsModalOpen(true) : setIsViewerModalOpen(true);
    setIsLoadingVitals(true);
    setVitalQuestionGroups([]);
    setActiveMedicalRecordId(medicalRecordId);

    try {
      const [templateResponse, savedValuesResponse] = await Promise.all([
        getMedicalRecordTemplateById(templateId),
        getVitalValuesMedicalRecord(medicalRecordId)
      ]);
      const savedValues = savedValuesResponse?.data || [];
      const valuesMap = new Map(savedValues.map(val => [val.vitalIndicatorId, val.value]));
      const vitalGroupIds = templateResponse?.data?.vitalGroupIds || [];

      if (vitalGroupIds.length === 0) {
        setIsLoadingVitals(false);
        return;
      }

      const vitalGroupResponses = await Promise.all(vitalGroupIds.map(id => getVitalGroupById(id)));
      const groupsWithValues = vitalGroupResponses.map(response => response?.data && {
        ...response.data,
        indicators: response.data.indicators.map(indicator => ({
          ...indicator,
          savedValue: valuesMap.get(indicator.id),
        })),
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
      // Lấy toàn bộ indicatorId từ vitalQuestionGroups (đã có sẵn khi mở modal)
      const allIndicators = vitalQuestionGroups.flatMap((g) => g.indicators || []);
      const indicatorMap = new Map(allIndicators.map((i) => [String(i.id), i]));

      // Chuẩn hóa dữ liệu trước khi gửi
      const formattedValues = [];
      for (const [indicatorId, value] of Object.entries(updatedValues)) {
        const indicator = indicatorMap.get(String(indicatorId));
        if (!indicator) continue; // bỏ qua nếu không tồn tại

        // Bỏ qua giá trị rỗng
        const isEmpty =
          value == null ||
          (Array.isArray(value) && value.length === 0) ||
          (typeof value === 'object' && Object.keys(value).length === 0) ||
          (typeof value === 'string' && !value.trim());

        if (isEmpty) continue;

        formattedValues.push({
          vitalIndicatorId: Number(indicator.id),
          value: { value },
          note: "", // có thể thêm note nếu form có
        });
      }

      if (formattedValues.length === 0) {
        setNotification({
          open: true,
          message: 'Không có thay đổi nào để lưu.',
          severity: 'info',
        });
        setIsActionLoadingId(null);
        setIsVitalsModalOpen(false);
        return;
      }

      // Gửi API update
      await updateVitalMedicalRecordeById(medicalRecordId, {
        vitalValues: formattedValues,
      });

      setNotification({
        open: true,
        message: 'Cập nhật bệnh án thành công!',
        severity: 'success',
      });
      refetch();
    } catch (err) {
      console.error('Lỗi khi cập nhật chỉ số:', err);
      setNotification({
        open: true,
        message: 'Cập nhật thất bại. Vui lòng thử lại.',
        severity: 'error',
      });
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
    } catch (err) {
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

  const handleCloseNotification = () => setNotification({ ...notification, open: false });
  return (
    <>
      <Card>
        {error && <Typography color="error" sx={{ p: 2 }}>Lỗi: {error.message}</Typography>}
        <MedicalRecordTableLayout status={status}>
          <TableBody>
            <RecordsTableView
              records={medicalRecords}
              loading={loading}
              status={status}
              isActionLoadingId={isActionLoadingId}
              templateMap={templateMap}
              onSelectPerson={setSelectedPerson}
              onViewDetails={handleViewDetails}
              onUpdateStatus={handleUpdateStatus}
            />
          </TableBody>
        </MedicalRecordTableLayout>

        <ReusableTablePagination
          count={totalRecords}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>
      <PersonDetailsModal
        person={selectedPerson}
        open={!!selectedPerson}
        onClose={() => setSelectedPerson(null)}
      />

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
        onClose={() => {
          setIsImageViewerOpen(false);
          setSelectedImages([]);
        }}
        images={selectedImages}
      />

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
}

MedicalRecordClientView.propTypes = {
  status: PropTypes.oneOf(['PENDING', 'CONFIRMED', 'COMPLETED', 'ALL']).isRequired,
};