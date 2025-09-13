'use client';

import React, { useState, useEffect } from 'react';

// --- Import các API cần thiết ---
import {
  getAppointment,
  updateAppointmentStatusID,
} from 'src/api/appointments-staff';
import { getMedicalRecordTemplateById } from 'src/api/medical-record-templates-staff';
import { getVitalGroupById } from 'src/api/vitals';
import { getVitalValuesMedicalRecord } from 'src/api/medical-record-staff';
import { ReusableTablePagination } from 'src/components/pagination';

// --- Material-UI Imports ---
import {
  Snackbar,
  Alert,
  Box,
  Card,
  Table,
  Container,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  TableContainer,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

// ----------------------------------------------------------------------
// ### COMPONENT PHỤ 1: MODAL CHI TIẾT NGƯỜI DÙNG ###
// ----------------------------------------------------------------------
function PersonDetailsModal({ person, open, onClose }) {
  if (!person) return null;
  const KEY_LABELS = { id: 'Mã số', fullname: 'Họ và tên', phone: 'Số điện thoại', email: 'Email', role: 'Vai trò' };
  const roleMap = { 1: 'Bác sĩ', 2: 'Y tá' };
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Thông tin chi tiết</DialogTitle>
      <DialogContent dividers>
        {Object.keys(KEY_LABELS).map((key) => {
          if (person?.[key]) {
            const displayValue = key === 'role' ? roleMap[person[key]] || 'Không xác định' : person[key];
            return (
              <Box key={key} sx={{ display: 'flex', mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', minWidth: '120px' }}>{`${KEY_LABELS[key]}:`}</Typography>
                <Typography variant="body2">{displayValue}</Typography>
              </Box>
            );
          }
          return null;
        })}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Đóng</Button></DialogActions>
    </Dialog>
  );
}

// ----------------------------------------------------------------------
// ### COMPONENT PHỤ 2: MODAL XEM ẢNH ###
// ----------------------------------------------------------------------
function ImageViewerModal({ images, open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Hình ảnh chi tiết
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
          {(images || []).map((url, index) => (
            <Box
              key={index}
              component="img"
              src={url}
              alt={`Hình ảnh chi tiết ${index + 1}`}
              sx={{
                maxWidth: '100%',
                maxHeight: '80vh',
                height: 'auto',
                borderRadius: 2,
                boxShadow: 3,
              }}
            />
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// ----------------------------------------------------------------------
// ### COMPONENT PHỤ 3: CHIP TRẠNG THÁI ###
// ----------------------------------------------------------------------
function StatusChip({ status }) {
  const statusMap = {
    PENDING: { color: 'warning', text: 'CHỜ TIẾP NHẬN' },
    CONFIRMED: { color: 'primary', text: 'ĐÃ TIẾP NHẬN' },
    COMPLETED: { color: 'success', text: 'HOÀN THÀNH' },
  };
  const { color, text } = statusMap[status] || { color: 'default', text: 'KHÔNG RÕ' };
  return <Chip label={text} color={color} size="small" sx={{ fontWeight: 'bold' }} />;
}

// --- CÁC HÀM TRỢ GIÚP ---
function extractFinalValue(data) {
  if (Array.isArray(data)) {
    return data.join(', ');
  }
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  const values = Object.values(data);
  if (values.length === 0) {
    return null;
  }
  return extractFinalValue(values[0]);
}

function findImageUrls(data) {
  let urls = [];
  if (typeof data === 'string' && data.startsWith('http')) {
    return [data];
  }
  if (Array.isArray(data)) {
    for (const item of data) {
      urls = urls.concat(findImageUrls(item));
    }
  } else if (typeof data === 'object' && data !== null) {
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        urls = urls.concat(findImageUrls(data[key]));
      }
    }
  }
  return urls;
}

// ----------------------------------------------------------------------
// ### COMPONENT PHỤ 4: HIỂN THỊ TỪNG CÂU HỎI ###
// ----------------------------------------------------------------------
function QuestionViewer({ indicator, value, onImageClick }) {
  if (indicator.valueType === 'image' || indicator.valueType === 'custom') {
    const imageUrls = findImageUrls(value);
    if (imageUrls.length > 0) {
      return (
        <Box sx={{ py: 1.5, borderBottom: '1px solid #f0f0f0' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{indicator.name}:</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {imageUrls.map((url, index) => (
              <Box
                key={index}
                component="img"
                src={url}
                alt={`${indicator.name} ${index + 1}`}
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: 1.5,
                  objectFit: 'cover',
                  cursor: 'pointer',
                  border: '1px solid #ddd',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.05)' },
                }}
                onClick={() => onImageClick(imageUrls)}
              />
            ))}
          </Box>
        </Box>
      );
    }
  }

  const dataObject = (typeof value === 'object' && value !== null && value.value) ? value.value : value;

  if (Array.isArray(dataObject)) {
    const displayString = dataObject.join(', ');
    return (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: '1px solid #f0f0f0' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{indicator.name}:</Typography>
        <Typography variant="body2" sx={{ textAlign: 'right', pl: 2 }}>
          {displayString || <span style={{ color: '#999' }}>Chưa có dữ liệu</span>}
        </Typography>
      </Box>
    );
  }

  if (typeof dataObject === 'object' && dataObject !== null) {
    const finalValue = extractFinalValue(dataObject);
    return (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: '1px solid #f0f0f0' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{indicator.name}:</Typography>
        <Typography variant="body2" sx={{ textAlign: 'right', pl: 2 }}>
          {String(finalValue) || <span style={{ color: '#999' }}>Chưa có dữ liệu</span>}
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: '1px solid #f0f0f0' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{indicator.name}:</Typography>
      <Typography variant="body2" sx={{ textAlign: 'right', pl: 2 }}>
        {dataObject || <span style={{ color: '#999' }}>Chưa có dữ liệu</span>}
      </Typography>
    </Box>
  );
}

// ----------------------------------------------------------------------
// ### COMPONENT PHỤ 5: MODAL XEM CHI TIẾT BỆNH ÁN ###
// ----------------------------------------------------------------------
function MedicalRecordViewerModal({ open, onClose, questionGroups, loading, onImageClick }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Chi tiết Bệnh án</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>
        ) : questionGroups.length > 0 ? (
          questionGroups.map((group) => (
            <Box key={group.id} sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, borderBottom: '2px solid #007bff', pb: 1, color: '#005bab' }}>
                {group.name}
              </Typography>
              {group.indicators.map((indicator) => (
                <QuestionViewer
                  key={indicator.id}
                  indicator={indicator}
                  value={indicator.savedValue}
                  onImageClick={onImageClick}
                />
              ))}
            </Box>
          ))
        ) : (
          <Typography sx={{ my: 5, textAlign: 'center' }}>Không tìm thấy chỉ số sinh tồn nào cho mẫu bệnh án này.</Typography>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Đóng</Button></DialogActions>
    </Dialog>
  );
}


// ----------------------------------------------------------------------
// ### COMPONENT CHÍNH: BẢNG BỆNH ÁN ĐÃ HOÀN THÀNH ###
// ----------------------------------------------------------------------
export function CompletedMedicalRecords() {
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10); // Thêm state rowsPerPage

  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [isLoadingVitals, setIsLoadingVitals] = useState(false);
  const [vitalQuestionGroups, setVitalQuestionGroups] = useState([]);

  // ### SỬA LỖI: Thêm state và hàm xử lý cho modal xem ảnh ###
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);

  const handleOpenImageViewer = (images) => {
    setSelectedImages(images);
    setIsImageViewerOpen(true);
  };

  const handleCloseImageViewer = () => {
    setIsImageViewerOpen(false);
    setSelectedImages([]);
  };

  const templateMap = {
    16: 'Bệnh án cấp tính',
    17: 'Bệnh án mãn tính lần 1',
    18: 'Bệnh án mãn tính tái khám',
  };
  
  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => { // Thêm hàm handleChangeRowsPerPage
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewVitalsForm = async (templateId, medicalRecordId) => {
    if (!templateId) {
      setNotification({ open: true, message: 'Mẫu bệnh án không có ID hợp lệ.', severity: 'error' });
      return;
    }
    setIsViewerModalOpen(true);
    setIsLoadingVitals(true);
    setVitalQuestionGroups([]);
    try {
      const [templateResponse, savedValuesResponse] = await Promise.all([
        getMedicalRecordTemplateById(templateId),
        getVitalValuesMedicalRecord(medicalRecordId)
      ]);

      const savedValues = savedValuesResponse?.data || [];
      const valuesMap = new Map();
      savedValues.forEach(val => {
        valuesMap.set(val.vitalIndicatorId, val.value);
      });

      const vitalGroupIds = templateResponse?.data?.vitalGroupIds || [];
      if (vitalGroupIds.length === 0) {
        setIsLoadingVitals(false);
        return;
      }
      const vitalGroupPromises = vitalGroupIds.map((id) => getVitalGroupById(id));
      const vitalGroupResponses = await Promise.all(vitalGroupPromises);
      
      const groupsWithValues = vitalGroupResponses
        .map((response) => {
          if (!response?.data?.indicators) return null;
          return {
            id: response.data.id,
            name: response.data.name,
            indicators: response.data.indicators.map((indicator) => ({
              ...indicator,
              savedValue: valuesMap.get(indicator.id),
            })),
          };
        })
        .filter(Boolean);

      setVitalQuestionGroups(groupsWithValues);
    } catch (err) {
      console.error('Lỗi khi lấy dữ liệu form:', err);
      setNotification({ open: true, message: 'Không thể tải dữ liệu form.', severity: 'error' });
    } finally {
      setIsLoadingVitals(false);
    }
  };

useEffect(() => {
    const fetchCompletedData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let aggregatedRecords = [];
        let currentApiPage = 1; 
        let lastKnownTotal = 0;
        let continueFetching = true;

        const recordsNeeded = (page + 1) * rowsPerPage;

        while (aggregatedRecords.length < recordsNeeded && continueFetching) {
          const params = { status: 'COMPLETED', page: currentApiPage, limit: rowsPerPage };
          const response = await getAppointment(params);

          const rawAppointments = response?.data || [];
          if (response?.total) {
            lastKnownTotal = response.total;
          }

          if (rawAppointments.length === 0) {
            continueFetching = false;
            break;
          }
          
          const newRecords = rawAppointments.flatMap(app => {
            if (app && Array.isArray(app.medicalRecords)) {
              return app.medicalRecords.map(record => ({
                ...record,
                appointment: { id: app.id, status: app.status, reason: app.reason }
              }));
            }
            return [];
          });
            
          aggregatedRecords.push(...newRecords);
          currentApiPage++;
        }
        
        const startIndex = page * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const finalRecordsForPage = aggregatedRecords.slice(startIndex, endIndex);

        setMedicalRecords(finalRecordsForPage);
        setTotalRecords(lastKnownTotal);

      } catch (err) {
        setError('Không thể tải danh sách bệnh án. Vui lòng thử lại.');
        console.error('Lỗi khi fetch bệnh án đã hoàn thành:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedData();
  }, [page, rowsPerPage, refetchTrigger]);

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 5 }}>Danh sách Bệnh án Đã hoàn thành</Typography>
      <Card>
        {error && <Typography color="error" sx={{ p: 2 }}>Lỗi: {error}</Typography>}
        
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Mã HS</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Bệnh nhân</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Mẫu bệnh án</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Lý do khám</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Trạng thái</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} align="center"><CircularProgress sx={{ my: 4 }}/></TableCell></TableRow>
              ) : (Array.isArray(medicalRecords) && medicalRecords.length > 0) ? (
                medicalRecords.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>
                      <Typography onClick={() => setSelectedPerson(row.patient)} variant="body2" sx={{ color: 'primary.main', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                        {row.patient?.fullname || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell 
                      onClick={() => handleViewVitalsForm(row.templateId, row.id)}
                      sx={{ cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                    >
                      {templateMap[row.templateId] || `Mẫu ${row.templateId}`}
                    </TableCell>
                    <TableCell>{row.appointment?.reason || 'N/A'}</TableCell>
                    <TableCell align="center"><StatusChip status={row.appointment?.status || 'UNKNOWN'} /></TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body1" sx={{ my: 4, color: 'text.secondary' }}>Chưa có bệnh án nào hoàn thành.</Typography>
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
          onRowsPerPageChange={handleChangeRowsPerPage} // Thêm prop onRowsPerPageChange
        />
      </Card>

      <PersonDetailsModal
        person={selectedPerson}
        open={Boolean(selectedPerson)}
        onClose={() => setSelectedPerson(null)}
      />

      {/* ### SỬA LỖI: Truyền prop onImageClick ### */}
      <MedicalRecordViewerModal
        open={isViewerModalOpen}
        onClose={() => setIsViewerModalOpen(false)}
        loading={isLoadingVitals}
        questionGroups={vitalQuestionGroups}
        onImageClick={handleOpenImageViewer}
      />
      
      {/* Thêm ImageViewerModal vào cây render */}
      <ImageViewerModal
        open={isImageViewerOpen}
        onClose={handleCloseImageViewer}
        images={selectedImages}
      />
      
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
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

