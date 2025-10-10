'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Typography, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, Divider, CircularProgress, Pagination, Card, CardMedia,
  IconButton, Menu, MenuItem, TextField, FormControl, InputLabel, Select
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import { getMedicalRecord } from 'src/api/medical-record-staff';
import { getMedicalRecordTemplateById } from 'src/api/medical-record-templates-staff';
import { getVitalGroupById } from 'src/api/vitals';
import { getVitalValuesMedicalRecord } from 'src/api/medical-record-staff';

import { createAppointment, check_Availability, updateAppointmentStatusID } from 'src/api/appointments-staff';
import { getStaffProfile } from 'src/api/auth/owner';

/* ===================== Helpers ===================== */
const STATUS_LABEL = {
  PENDING: 'Chờ xử lý',
  CONFIRMED: 'Đang xử lý',
  CANCELLED: 'Đã hủy',
  COMPLETED: 'Xử lý xong',
};
const ALL_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];

const statusChip = (appointment) => {
  if (!appointment) return <Chip label="Chưa có" size="small" />;
  const map = {
    PENDING: { label: STATUS_LABEL.PENDING, color: 'warning' },
    CONFIRMED: { label: STATUS_LABEL.CONFIRMED, color: 'info' },
    CANCELLED: { label: STATUS_LABEL.CANCELLED, color: 'default' },
    COMPLETED: { label: STATUS_LABEL.COMPLETED, color: 'success' },
  }[appointment.status] || { label: appointment.status, color: 'default' };
  return <Chip label={map.label} color={map.color} size="small" />;
};

const unwrapValue = (v) => {
  let cur = v;
  while (cur && typeof cur === 'object' && 'value' in cur && Object.keys(cur).length === 1) {
    cur = cur.value;
  }
  return cur;
};

const toDisplayText = (val) => {
  const v = unwrapValue(val);
  if (v == null) return '';
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'object') {
    try { return JSON.stringify(v); } catch { return String(v); }
  }
  return String(v);
};

/* ===================== Render JSON (deep recursive) ===================== */
function RenderAnswerGroup({ data, level = 0 }) {
  if (!data || typeof data !== 'object') return null;

  const renderNode = (key, value) => {
    if (value == null || value === '') return null;

    if (typeof value === 'string' && value.startsWith('http')) {
      return (
        <Card key={key} sx={{ width: 100, height: 100, borderRadius: 1 }}>
          <CardMedia
            component="img"
            image={value}
            alt={key}
            sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 1, border: '1px solid #ccc' }}
          />
        </Card>
      );
    }

    if (Array.isArray(value)) {
      return value.map((item, i) => (
        <Box key={`${key}-${i}`} sx={{ pl: level * 2 }}>
          {renderNode(`${key}-${i}`, item)}
        </Box>
      ));
    }

    if (typeof value === 'object') {
      return (
        <Box key={key} sx={{ pl: level * 2, mt: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>{key}</Typography>
          <RenderAnswerGroup data={value} level={level + 1} />
        </Box>
      );
    }

    return (
      <Typography key={key} variant="body2" sx={{ ml: 1 }}>
        {key}: {String(value)}
      </Typography>
    );
  };

  return (
    <Stack spacing={1}>
      {Object.entries(data).map(([key, value]) => (
        <Box key={key}>{renderNode(key, value)}</Box>
      ))}
    </Stack>
  );
}

/* ===================== Component chính ===================== */
export function AllMedicalRecords() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);

  // profile bác sĩ
  const [doctor, setDoctor] = useState(null);

  // dialog bệnh án
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [recordStep, setRecordStep] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loadingVitals, setLoadingVitals] = useState(false);
  const [vitalGroups, setVitalGroups] = useState([]);
  const [savedValuesMap, setSavedValuesMap] = useState(new Map());

  // dialog bệnh nhân
  const [patientDialogOpen, setPatientDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // menu chức năng
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);

  // modal tạo lịch hẹn
  const [createOpen, setCreateOpen] = useState(false);
  const [createPayload, setCreatePayload] = useState({
    patientId: '',
    doctorId: '',
    reason: '',
    appointmentDate: new Date(),
    status: 'PENDING',
    notes: '',
    fullName: '',
    phone: '',
    customInfo: { emergencyContact: '', insurance: '' },
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchTable = async (pg = page, lim = limit) => {
    setLoading(true);
    try {
      const res = await getMedicalRecord({ page: pg, limit: lim });
      const data = res?.data || [];
      setRows(data);
      setTotal(res?.data?.total || 0);
      setPage(res?.data?.page || pg);
      setLimit(res?.data?.limit || lim);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTable();
    (async () => {
      try {
        const prof = await getStaffProfile();
        setDoctor(prof?.data || null);
      } catch {}
    })();
  }, []);

  const handlePageChange = (_e, newPage) => fetchTable(newPage, limit);

  const openPatientDialog = (p) => {
    setSelectedPatient(p);
    setPatientDialogOpen(true);
  };

  const openRecordDialog = (r) => {
    setSelectedRecord(r);
    setRecordStep(1);
    setRecordDialogOpen(true);
  };

  const toStep2LoadVitals = async () => {
    if (!selectedRecord) return;
    setRecordStep(2);
    setLoadingVitals(true);
    setVitalGroups([]);
    setSavedValuesMap(new Map());
    try {
      const tpl = await getMedicalRecordTemplateById(selectedRecord.templateId);
      const vitalGroupIds = tpl?.data?.vitalGroupIds || [];
      const groups = [];
      for (const gid of vitalGroupIds) {
        const gr = await getVitalGroupById(gid);
        if (gr?.data) groups.push(gr.data);
      }
      setVitalGroups(groups);

      const saved = await getVitalValuesMedicalRecord(selectedRecord.id);
      const arr = saved?.data || [];
      const map = new Map();
      arr.forEach((item) => map.set(item.vitalIndicatorId, item.value));
      setSavedValuesMap(map);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingVitals(false);
    }
  };

  /* ===== Menu Chức năng ===== */
  const openMenu = (e, row) => {
    setMenuAnchorEl(e.currentTarget);
    setMenuRow(row);
  };
  const closeMenu = () => {
    setMenuAnchorEl(null);
    setMenuRow(null);
  };

  const refreshAfterAction = async () => {
    closeMenu();
    await fetchTable(page, limit);
  };

  const onChangeStatus = async (newStatus) => {
    try {
      if (!menuRow?.appointment) return;
      await updateAppointmentStatusID(menuRow.appointment.id, { status: newStatus });
    } catch (e) {
      console.error(e);
      alert('Cập nhật trạng thái thất bại');
    } finally {
      await refreshAfterAction();
    }
  };

  const onQuickAction = async () => {
    try {
      const ap = menuRow?.appointment;
      if (!ap) return;
      if (ap.status === 'PENDING') {
        await updateAppointmentStatusID(ap.id, { status: 'CONFIRMED' });
      } else if (ap.status === 'CONFIRMED') {
        await updateAppointmentStatusID(ap.id, { status: 'COMPLETED' });
      }
    } catch (e) {
      console.error(e);
      alert('Thao tác nhanh thất bại');
    } finally {
      await refreshAfterAction();
    }
  };

  const onCancelQuick = async () => {
    try {
      const ap = menuRow?.appointment;
      if (!ap) return;
      await updateAppointmentStatusID(ap.id, { status: 'CANCELLED' });
    } catch (e) {
      console.error(e);
      alert('Hủy nhanh thất bại');
    } finally {
      await refreshAfterAction();
    }
  };

  /* ===== Modal Thêm lịch hẹn ===== */
  const openCreateModal = (row) => {
    setCreatePayload({
      patientId: row.patientId,
      doctorId: doctor?.id || '',
      reason: '',
      appointmentDate: new Date(),
      status: 'PENDING',
      notes: '',
      fullName: row?.patient?.fullname || '',
      phone: row?.patient?.phone || '',
      customInfo: { emergencyContact: '', insurance: '' },
    });
    setCreateOpen(true);
    closeMenu();
  };
  const closeCreateModal = () => setCreateOpen(false);

  const submitCreateAppointment = async () => {
    try {
      if (!createPayload.doctorId || !createPayload.patientId) {
        alert('Thiếu thông tin bác sĩ hoặc bệnh nhân');
        return;
      }
      setSubmitting(true);
      const iso = new Date(createPayload.appointmentDate).toISOString();

      // Check availability
      const avail = await check_Availability({
        doctorId: createPayload.doctorId,
        appointmentDate: iso,
      });
      const available = avail?.data?.available ?? avail?.data ?? false;
      if (!available) {
        alert('Bác sĩ đã có lịch vào thời điểm này!');
        return;
      }

      // Create appointment
      const payload = {
        ...createPayload,
        appointmentDate: iso,
      };
      await createAppointment(payload);
      alert('Tạo lịch hẹn thành công!');
      setCreateOpen(false);
      await fetchTable(page, limit);
    } catch (e) {
      console.error(e);
      alert('Tạo lịch hẹn thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
          Quản lý bệnh án
        </Typography>

        <Paper variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Bệnh nhân</TableCell>
                <TableCell>Số điện thoại</TableCell>
                <TableCell>Mẫu bệnh án</TableCell>
                <TableCell>Lý do khám</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Chức năng</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center"><CircularProgress size={22} /></TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">Không có dữ liệu</TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const p = row.patient || {};
                  const t = row.template || {};
                  const a = row.appointment;

                  const hasAppointment = !!a;
                  const quickLabel =
                    a?.status === 'PENDING' ? 'Tiếp nhận (→ Đang xử lý)' :
                    a?.status === 'CONFIRMED' ? 'Xác nhận hoàn thành (→ Hoàn tất)' :
                    null;

                  return (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>
                        <Button variant="text" sx={{ color: 'green', fontWeight: 'bold' }} onClick={() => setSelectedPatient(p) || setPatientDialogOpen(true)}>
                          {p.fullname || '—'}
                        </Button>
                      </TableCell>
                      <TableCell>{p.phone || '—'}</TableCell>
                      <TableCell>
                        <Button variant="text" sx={{ color: 'green', fontWeight: 'bold' }} onClick={() => openRecordDialog(row)}>
                          {t.name || '—'}
                        </Button>
                      </TableCell>
                      <TableCell>{a?.reason || ''}</TableCell>
                      <TableCell>{statusChip(a)}</TableCell>
                      <TableCell>
                        <IconButton aria-label="actions" onClick={(e) => openMenu(e, row)} size="small">
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={Math.max(1, Math.ceil(total / (limit || 10)))}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size="small"
            />
          </Box>
        </Paper>

        {/* Menu chức năng */}
        <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={closeMenu}>
          {!menuRow?.appointment ? (
            <MenuItem onClick={() => openCreateModal(menuRow)}>Thêm lịch hẹn</MenuItem>
          ) : (
            <>
              <MenuItem disabled>Chuyển trạng thái</MenuItem>
              {ALL_STATUSES.map((st) => (
                <MenuItem key={st} onClick={() => onChangeStatus(st)}>
                  {STATUS_LABEL[st] || st}
                </MenuItem>
              ))}
              <Divider />
              {menuRow?.appointment?.status === 'PENDING' && (
                <MenuItem onClick={onQuickAction}>Tiếp nhận (→ Đang xử lý)</MenuItem>
              )}
              {menuRow?.appointment?.status === 'CONFIRMED' && (
                <MenuItem onClick={onQuickAction}>Xác nhận hoàn thành (→ Hoàn tất)</MenuItem>
              )}
              {menuRow?.appointment?.status !== 'CANCELLED' && (
                <MenuItem onClick={onCancelQuick}>Hủy nhanh</MenuItem>
              )}
            </>
          )}
        </Menu>

        {/* Dialog bệnh nhân */}
        <Dialog open={patientDialogOpen} onClose={() => setPatientDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Thông tin bệnh nhân</DialogTitle>
          <DialogContent dividers>
            {selectedPatient ? (
              <Stack spacing={1.2}>
                <Row label="ID" value={selectedPatient.id} />
                <Row label="Họ tên" value={selectedPatient.fullname} />
                <Row label="Số điện thoại" value={selectedPatient.phone} />
                <Row label="Email" value={selectedPatient.email} />
              </Stack>
            ) : (
              <Typography>Không có dữ liệu</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPatientDialogOpen(false)}>Đóng</Button>
          </DialogActions>
        </Dialog>

        {/* Dialog bệnh án */}
        <Dialog open={recordDialogOpen} onClose={() => setRecordDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>{recordStep === 1 ? 'Thông tin bệnh án' : 'Chỉ số đã ghi nhận'}</DialogTitle>
          <DialogContent dividers>
            {!selectedRecord ? (
              <Typography>Không có dữ liệu</Typography>
            ) : recordStep === 1 ? (
              <Stack spacing={1.2}>
                <Row label="ID bệnh án" value={selectedRecord.id} />
                {selectedRecord.diagnosis && <Row label="Chẩn đoán" value={selectedRecord.diagnosis} />}
                {selectedRecord.symptoms && <Row label="Triệu chứng" value={selectedRecord.symptoms} />}
                {selectedRecord.notes && <Row label="Ghi chú" value={selectedRecord.notes} />}
              </Stack>
            ) : (
              <Box>
                {loadingVitals ? (
                  <Box sx={{ py: 3, textAlign: 'center' }}>
                    <CircularProgress size={22} />
                  </Box>
                ) : vitalGroups.length === 0 ? (
                  <Typography>Không có nhóm chỉ số.</Typography>
                ) : (
                  <Stack spacing={2}>
                    {vitalGroups.map((g) => {
                      const indicators = (g.indicators || []).filter((ind) => savedValuesMap.has(ind.id));
                      if (!indicators.length) return null;
                      return (
                        <Box key={g.id} sx={{ p: 1.5, border: '1px solid #eee', borderRadius: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {g.name || `Nhóm ${g.id}`}
                          </Typography>
                          <Stack spacing={1}>
                            {indicators.map((ind) => {
                              const val = unwrapValue(savedValuesMap.get(ind.id));
                              return (
                                <Box key={ind.id}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    {ind.name}
                                  </Typography>
                                  {val && typeof val === 'object' ? (
                                    <RenderAnswerGroup data={val} />
                                  ) : (
                                    <Typography variant="body2" sx={{ ml: 1, mt: 0.25 }}>
                                      {toDisplayText(val) || '—'}
                                    </Typography>
                                  )}
                                  <Divider sx={{ mt: 1 }} />
                                </Box>
                              );
                            })}
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'space-between' }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => setRecordStep(1)} disabled={recordStep === 1}>
              Quay lại
            </Button>
            {recordStep === 1 ? (
              <Button variant="contained" endIcon={<ArrowForwardIcon />} onClick={toStep2LoadVitals}>
                Tiếp theo
              </Button>
            ) : (
              <Button variant="contained" onClick={() => setRecordDialogOpen(false)}>
                Đóng
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Modal tạo lịch hẹn */}
        <Dialog open={createOpen} onClose={closeCreateModal} maxWidth="sm" fullWidth>
          <DialogTitle>Thêm lịch hẹn</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              <TextField label="Bệnh nhân (ID)" value={createPayload.patientId} InputProps={{ readOnly: true }} />
              <TextField
                label="Bác sĩ phụ trách"
                value={doctor?.fullname || '(chưa có)'}
                InputProps={{ readOnly: true }}
                helperText={doctor ? `ID: ${doctor.id}` : 'Không lấy được thông tin bác sĩ'}
              />

              <TextField label="Họ tên bệnh nhân" value={createPayload.fullName} onChange={(e) => setCreatePayload((p) => ({ ...p, fullName: e.target.value }))} />
              <TextField label="Số điện thoại" value={createPayload.phone} onChange={(e) => setCreatePayload((p) => ({ ...p, phone: e.target.value }))} />
              <TextField label="Lý do khám" value={createPayload.reason} onChange={(e) => setCreatePayload((p) => ({ ...p, reason: e.target.value }))} />
              <DateTimePicker
                label="Thời gian hẹn"
                value={createPayload.appointmentDate}
                onChange={(newVal) => setCreatePayload((p) => ({ ...p, appointmentDate: newVal || new Date() }))}
              />
              <FormControl>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  label="Trạng thái"
                  value={createPayload.status}
                  onChange={(e) => setCreatePayload((p) => ({ ...p, status: e.target.value }))}
                >
                  {ALL_STATUSES.map((st) => (
                    <MenuItem key={st} value={st}>{STATUS_LABEL[st]}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label="Ghi chú" value={createPayload.notes} onChange={(e) => setCreatePayload((p) => ({ ...p, notes: e.target.value }))} multiline rows={2} />

              <Typography variant="subtitle2" sx={{ mt: 1 }}>Thông tin bổ sung</Typography>
              <TextField
                label="Người liên hệ khẩn cấp"
                value={createPayload.customInfo.emergencyContact}
                onChange={(e) => setCreatePayload((p) => ({ ...p, customInfo: { ...p.customInfo, emergencyContact: e.target.value } }))}
              />
              <TextField
                label="Bảo hiểm"
                value={createPayload.customInfo.insurance}
                onChange={(e) => setCreatePayload((p) => ({ ...p, customInfo: { ...p.customInfo, insurance: e.target.value } }))}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeCreateModal} disabled={submitting}>Hủy</Button>
            <Button variant="contained" onClick={submitCreateAppointment} disabled={submitting || !doctor?.id}>
              {submitting ? 'Đang tạo...' : 'Tạo lịch hẹn'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}

/* Helper hiển thị từng dòng */
function Row({ label, value }) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 0.25 }}>{label}</Typography>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{value ?? '—'}</Typography>
    </Box>
  );
}
