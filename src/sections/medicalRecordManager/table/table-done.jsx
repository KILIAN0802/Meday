'use client';

import React, { useState, useEffect } from 'react';

// --- Import các API cần thiết ---
import { getAppointment } from 'src/api/appointments-staff';
import { getMedicalRecordTemplateById } from 'src/api/medical-record-templates-staff';
import { getVitalGroupById } from 'src/api/vitals';
import { getVitalValuesMedicalRecord } from 'src/api/medical-record-staff'; // <-- Đảm bảo import đúng
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
} from '@mui/material';

// ----------------------------------------------------------------------
// ### COMPONENT PHỤ 1: HIỂN THỊ CHI TIẾT NGƯỜI DÙNG ###
// (Không thay đổi)
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
// ### COMPONENT PHỤ 2: HIỂN THỊ CHIP TRẠNG THÁI ###
// (Không thay đổi)
function StatusChip({ status }) {
  const statusMap = {
    PENDING: { color: 'warning', text: 'CHỜ XỬ LÝ' },
    CONFIRMED: { color: 'primary', text: 'ĐANG XỬ LÝ' },
    COMPLETED: { color: 'success', text: 'HOÀN THÀNH' },
  };
  const { color, text } = statusMap[status] || { color: 'default', text: 'KHÔNG RÕ' };
  return <Chip label={text} color={color} size="small" sx={{ fontWeight: 'bold' }} />;
}


// ----------------------------------------------------------------------
// ### COMPONENT PHỤ 3: COMPONENT CHỈ XEM CÂU HỎI ###
// (Không thay đổi)
function QuestionViewer({ indicator, value }) {
  let displayValue = value;
  if (indicator.valueType === 'selection' && value) {
    const options = (indicator.valueOptions || [])
      .filter(Boolean)
      .map(optStr => {
        let optValue = optStr, optLabel = optStr;
        if (optStr.includes('.')) {
          const parts = optStr.split('.');
          optValue = parts[0];
          optLabel = parts.slice(1).join('.');
        }
        return { value: optValue, label: optLabel };
      });
    const selectedOption = options.find(opt => opt.value === String(value));
    displayValue = selectedOption ? selectedOption.label : value;
  }
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, borderBottom: '1px solid #f0f0f0' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{indicator.name}:</Typography>
      <Typography variant="body2">{displayValue || <span style={{ color: '#999' }}>Chưa có dữ liệu</span>}</Typography>
    </Box>
  );
}

// ----------------------------------------------------------------------
// ### COMPONENT PHỤ 4: MODAL CHỈ XEM THEO NHÓM ###
// (Không thay đổi)
function MedicalRecordViewerModal({ open, onClose, questionGroups, loading }) {
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
                <QuestionViewer key={indicator.id} indicator={indicator} value={indicator.savedValue} />
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

  const rowsPerPage = 10;

  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [isLoadingVitals, setIsLoadingVitals] = useState(false);
  const [vitalQuestionGroups, setVitalQuestionGroups] = useState([]);

  const templateMap = {
    16: 'Bệnh án cấp tính',
    17: 'Bệnh án mãn tính lần 1',
    18: 'Bệnh án mãn tính tái khám',
  };
  
  const handleChangePage = (event, newPage) => setPage(newPage);

  // ### THAY ĐỔI 1: Sửa lại hàm handleViewVitalsForm để hiển thị đúng giá trị ###
  const handleViewVitalsForm = async (templateId, medicalRecordId) => {
    if (!templateId) {
      setNotification({ open: true, message: 'Mẫu bệnh án không có ID hợp lệ.', severity: 'error' });
      return;
    }
    setIsViewerModalOpen(true);
    setIsLoadingVitals(true);
    setVitalQuestionGroups([]);
    try {
      // Gọi cả 2 API: 1 lấy cấu trúc template, 1 lấy giá trị đã lưu
      const [templateResponse, savedValuesResponse] = await Promise.all([
        getMedicalRecordTemplateById(templateId),
        getVitalValuesMedicalRecord(medicalRecordId)
      ]);

      // Xử lý giá trị đã lưu
      const savedValues = savedValuesResponse?.data || [];
      const valuesMap = new Map();
      savedValues.forEach(val => {
        let actualValue = val.value;
        if (typeof actualValue === 'object' && actualValue !== null && 'value' in actualValue) {
          actualValue = actualValue.value;
        }
        valuesMap.set(val.vitalIndicatorId, actualValue);
      });

      // Xử lý cấu trúc template
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
            // Gắn giá trị đã lưu vào từng câu hỏi
            indicators: response.data.indicators.map((indicator) => ({
              ...indicator,
              savedValue: valuesMap.get(indicator.id) ?? '',
            })),
          };
        })
        .filter(Boolean);

      setVitalQuestionGroups(groupsWithValues);
    } catch (err)
 {
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
        const params = { status: 'COMPLETED', page: page + 1, limit: rowsPerPage };
        const response = await getAppointment(params);
        
        const recordsWithAppointmentInfo = (response?.data || [])
          .flatMap(app => {
            if (app && Array.isArray(app.medicalRecords)) {
              return app.medicalRecords.map(record => ({
                ...record,
                appointment: { id: app.id, status: app.status, reason: app.reason }
              }));
            }
            return [];
          });
          // ### THAY ĐỔI 2: Tạm thời xóa bỏ dòng filter ###
          // .filter(record => record.hasVitalValues === true); 
          // Khi nào backend cập nhật, bạn có thể mở lại dòng này.

        setMedicalRecords(recordsWithAppointmentInfo);
        setTotalRecords(response?.total || 0);

      } catch (err) {
        setError('Không thể tải danh sách bệnh án. Vui lòng thử lại.');
        console.error('Lỗi khi fetch bệnh án đã hoàn thành:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedData();
  }, [page]); // Bỏ rowsPerPage khỏi dependency array vì nó là hằng số

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
                      // ### THAY ĐỔI 3: Truyền thêm medicalRecordId (row.id) ###
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
                    <Typography variant="body1" sx={{ my: 4, color: 'text.secondary' }}>Không tìm thấy bệnh án nào đã hoàn thành.</Typography>
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
        />
      </Card>

      <PersonDetailsModal
        person={selectedPerson}
        open={Boolean(selectedPerson)}
        onClose={() => setSelectedPerson(null)}
      />

      <MedicalRecordViewerModal
        open={isViewerModalOpen}
        onClose={() => setIsViewerModalOpen(false)}
        loading={isLoadingVitals}
        questionGroups={vitalQuestionGroups}
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