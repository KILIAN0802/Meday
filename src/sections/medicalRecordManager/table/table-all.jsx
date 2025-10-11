'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import debounce from 'lodash.debounce';
import {
  Box, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Typography, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, Divider, CircularProgress, Pagination, Card, CardMedia,
  IconButton, Menu, MenuItem, TextField, FormControl, InputLabel, Select, InputAdornment
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

import { getMedicalRecord, getVitalValuesMedicalRecord, updateMedicalRecordById } from 'src/api/medical-record-staff';
import { getMedicalRecordTemplateById } from 'src/api/medical-record-templates-staff';
import { getVitalGroupById } from 'src/api/vitals';
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

function RenderAnswerGroup({ data, level = 0 }) {
  const [previewImg, setPreviewImg] = useState(null);
  const indent = level * 1.5;

  const isImageUrl = (val) => {
    if (typeof val !== 'string') return false;
    const lower = val.toLowerCase();
    return (
      lower.startsWith('http') &&
      (lower.endsWith('.jpg') ||
        lower.endsWith('.jpeg') ||
        lower.endsWith('.png') ||
        lower.endsWith('.gif') ||
        lower.endsWith('.webp') ||
        lower.endsWith('.bmp') ||
        lower.includes('data:image/'))
    );
  };

  // Nếu là primitive
  if (typeof data !== 'object') {
    if (isImageUrl(data)) {
      return (
        <>
          <Box
            sx={{
              ml: indent,
              my: 1,
              cursor: 'pointer',
              display: 'inline-block',
              '&:hover': { opacity: 0.85, transform: 'scale(1.03)' },
              transition: '0.2s',
            }}
            onClick={() => setPreviewImg(data)}
          >
            <img
              src={data}
              alt="medical-img"
              style={{
                width: 120,
                height: 120,
                objectFit: 'cover',
                borderRadius: 8,
                border: '1px solid #ccc',
              }}
            />
          </Box>

          {/* Dialog xem ảnh lớn */}
          <Dialog
            open={!!previewImg}
            onClose={() => setPreviewImg(null)}
            maxWidth="lg"
          >
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <img
                src={previewImg}
                alt="preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  borderRadius: 8,
                  display: 'inline-block',
                }}
              />
            </Box>
          </Dialog>
        </>
      );
    }

    return (
      <Typography variant="body2" sx={{ ml: indent, whiteSpace: 'pre-wrap' }}>
        {String(data)}
      </Typography>
    );
  }

  // Nếu là mảng
  if (Array.isArray(data)) {
    return (
      <Stack sx={{ ml: indent }} spacing={0.5}>
        {data.map((item, idx) => (
          <RenderAnswerGroup key={idx} data={item} level={level + 1} />
        ))}
      </Stack>
    );
  }

  // Nếu là object
  const keys = Object.keys(data).filter((k) => data[k] != null);
  if (keys.length === 0) return null;

  return (
    <Stack sx={{ ml: indent }} spacing={0.5}>
      {keys.map((k) => (
        <Box key={k}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {k}:
          </Typography>
          <RenderAnswerGroup data={data[k]} level={level + 1} />
        </Box>
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
  const [doctor, setDoctor] = useState(null);

  // Dialogs & menus
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [recordStep, setRecordStep] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loadingVitals, setLoadingVitals] = useState(false);
  const [vitalGroups, setVitalGroups] = useState([]);
  const [savedValuesMap, setSavedValuesMap] = useState(new Map());
  const [patientDialogOpen, setPatientDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createPayload, setCreatePayload] = useState({
    patientId: '', doctorId: '', reason: '', appointmentDate: new Date(),
    status: 'PENDING', notes: '', fullName: '', phone: '',
    customInfo: { emergencyContact: '', insurance: '' },
  });
  const [submitting, setSubmitting] = useState(false);

  /* ===================== SEARCH ===================== */
  const [searchText, setSearchText] = useState('');
  const [allFiltered, setAllFiltered] = useState([]);
  const reqIdRef = useRef(0);

  const applyPaginate = (list, pg, lim) => {
    const start = (pg - 1) * lim;
    const end = start + lim;
    setRows(list.slice(start, end));
    setTotal(list.length);
    setPage(pg);
    setLimit(lim);
  };

  const fetchOnce = async (paramsObj = {}) => {
    const res = await getMedicalRecord({ page: 1, limit: 1000, ...paramsObj });
    return res?.data || [];
  };

  const searchSequential = async (query, pg = 1, lim = limit) => {
    const thisReq = ++reqIdRef.current;
    const q = (query || '').trim();

    if (!q) {
      try {
        const list = await fetchOnce({});
        if (thisReq !== reqIdRef.current) return;
        setAllFiltered(list);
        applyPaginate(list, pg, lim);
      } catch (e) {
        console.error('Lỗi tải dữ liệu:', e);
        setAllFiltered([]); applyPaginate([], pg, lim);
      }
      return;
    }

    const looksNumeric = /^\+?\d+$/.test(q);
    const attempts = looksNumeric
      ? [{ appointmentId: q }, { phone: q }, { fullName: q }]
      : [{ fullName: q }, { phone: q }, { appointmentId: q }];

    try {
      let found = [];
      for (const p of attempts) {
        const list = await fetchOnce(p);
        if (thisReq !== reqIdRef.current) return;
        if (list.length > 0) { found = list; break; }
      }
      if (!found.length) { setAllFiltered([]); applyPaginate([], pg, lim); return; }
      setAllFiltered(found);
      applyPaginate(found, pg, lim);
    } catch (e) {
      console.error('Lỗi tìm kiếm:', e);
      setAllFiltered([]); applyPaginate([], pg, lim);
    }
  };

  const debouncedSearch = useMemo(() => debounce((text) => searchSequential(text, 1, limit), 500), [limit]);

  const handleSearchInput = (e) => {
    const val = e.target.value;
    setSearchText(val);
    debouncedSearch(val);
  };

  const handleEnterSearch = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      debouncedSearch.cancel();
      searchSequential(searchText, 1, limit);
    }
  };

  const handlePageChange = (_e, newPage) => applyPaginate(allFiltered, newPage, limit);
  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    applyPaginate(allFiltered, 1, newLimit);
  };

  /* ===================== FETCH INIT ===================== */
  useEffect(() => {
    searchSequential('', 1, limit);
    (async () => {
      try {
        const prof = await getStaffProfile();
        setDoctor(prof?.data || null);
      } catch {}
    })();
  }, []);

  /* ===================== DIALOG & MENU ===================== */
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
    setVitalGroups([]); setSavedValuesMap(new Map());
    try {
      const tpl = await getMedicalRecordTemplateById(selectedRecord.templateId);
      const ids = tpl?.data?.vitalGroupIds || [];
      const groups = [];
      for (const gid of ids) {
        const gr = await getVitalGroupById(gid);
        if (gr?.data) groups.push(gr.data);
      }
      setVitalGroups(groups);
      const saved = await getVitalValuesMedicalRecord(selectedRecord.id);
      const arr = saved?.data || [];
      const map = new Map();
      arr.forEach((i) => map.set(i.vitalIndicatorId, i.value));
      setSavedValuesMap(map);
    } catch (e) { console.error(e); } finally { setLoadingVitals(false); }
  };

  const openMenu = (e, row) => { setMenuAnchorEl(e.currentTarget); setMenuRow(row); };
  const closeMenu = () => { setMenuAnchorEl(null); setMenuRow(null); };

  const refreshAfterAction = async () => { closeMenu(); await searchSequential(searchText, page, limit); };

  const onChangeStatus = async (newStatus) => {
    try { if (!menuRow?.appointment) return;
      await updateAppointmentStatusID(menuRow.appointment.id, { status: newStatus });
    } catch (e) { console.error(e); alert('Cập nhật trạng thái thất bại'); }
    finally { await refreshAfterAction(); }
  };

  const openCreateModal = (row) => {
    setSelectedRecordId(row.id);
    setCreatePayload({
      patientId: row.patientId, doctorId: doctor?.id || '',
      reason: '', appointmentDate: new Date(), status: 'PENDING', notes: '',
      fullName: row?.patient?.fullname || '', phone: row?.patient?.phone || '',
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
      const avail = await check_Availability({ doctorId: createPayload.doctorId, appointmentDate: iso });
      const available = avail?.available ?? avail?.data ?? false;
      if (!available) { alert('Bác sĩ đã có lịch vào thời điểm này!'); setSubmitting(false); return; }
      const res = await createAppointment({ ...createPayload, appointmentDate: iso });
      const appointmentId = res?.data?.id || res?.id;
      if (appointmentId && selectedRecordId)
        await updateMedicalRecordById(selectedRecordId, { appointmentId });
      alert('Tạo lịch hẹn và cập nhật bệnh án thành công!');
      setCreateOpen(false);
      await searchSequential(searchText, page, limit);
    } catch (e) { console.error(e); alert('Tạo lịch hẹn thất bại'); }
    finally { setSubmitting(false); }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Header + Search */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Quản lý bệnh án</Typography>
          <TextField
            size="small"
            placeholder="Tìm theo tên, SĐT hoặc ID lịch hẹn..."
            value={searchText}
            onChange={handleSearchInput}
            onKeyDown={handleEnterSearch}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => searchSequential(searchText, 1, limit)}>
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ width: 350 }}
          />
        </Box>

        {/* Table */}
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
                <TableRow><TableCell colSpan={7} align="center"><CircularProgress size={22} /></TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center">Không có dữ liệu</TableCell></TableRow>
              ) : (
                rows.map((row) => {
                  const p = row.patient || {}; const t = row.template || {}; const a = row.appointment;
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.id}</TableCell>
                      <TableCell><Button variant="text" sx={{ color: 'green', fontWeight: 'bold' }} onClick={() => openPatientDialog(p)}>{p.fullname || '—'}</Button></TableCell>
                      <TableCell>{p.phone || '—'}</TableCell>
                      <TableCell><Button variant="text" sx={{ color: 'green', fontWeight: 'bold' }} onClick={() => openRecordDialog(row)}>{t.name || '—'}</Button></TableCell>
                      <TableCell>{a?.reason || ''}</TableCell>
                      <TableCell>{statusChip(a)}</TableCell>
                      <TableCell><IconButton onClick={(e) => openMenu(e, row)} size="small"><MoreVertIcon fontSize="small" /></IconButton></TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2">Hiển thị:</Typography>
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <Select value={limit} onChange={handleLimitChange}>
                  {[5, 10, 15, 20].map((num) => <MenuItem key={num} value={num}>{num}</MenuItem>)}
                </Select>
              </FormControl>
              <Typography variant="body2">/ trang</Typography>
            </Stack>
            <Pagination count={Math.max(1, Math.ceil(total / (limit || 10)))} page={page} onChange={handlePageChange} color="primary" size="small" />
          </Box>
        </Paper>

        {/* Menu chức năng */}
        <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={closeMenu}>
          {!menuRow?.appointment
            ? [
                <MenuItem key="add" onClick={() => openCreateModal(menuRow)}>
                  Thêm lịch hẹn
                </MenuItem>,
              ]
            : [
                <MenuItem key="label" disabled>
                  Chuyển trạng thái
                </MenuItem>,
                ...ALL_STATUSES.map((st) => (
                  <MenuItem key={st} onClick={() => onChangeStatus(st)}>
                    {STATUS_LABEL[st]}
                  </MenuItem>
                )),
              ]}
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
            ) : <Typography>Không có dữ liệu</Typography>}
          </DialogContent>
          <DialogActions><Button onClick={() => setPatientDialogOpen(false)}>Đóng</Button></DialogActions>
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
                {selectedRecord.createdAt && (
                  <Row
                    label="Ngày tạo"
                    value={new Date(selectedRecord.createdAt).toLocaleString('vi-VN')}
                  />)}
              </Stack>
            ) : (
              <Box>
                {loadingVitals ? (
                  <Box sx={{ py: 3, textAlign: 'center' }}><CircularProgress size={22} /></Box>
                ) : vitalGroups.length === 0 ? (
                  <Typography>Không có nhóm chỉ số.</Typography>
                ) : (
                  <Stack spacing={2}>
                    {vitalGroups.map((g) => {
                      const indicators = (g.indicators || []).filter((ind) => savedValuesMap.has(ind.id));
                      if (!indicators.length) return null;
                      return (
                        <Box key={g.id} sx={{ p: 1.5, border: '1px solid #eee', borderRadius: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>{g.name || `Nhóm ${g.id}`}</Typography>
                          <Stack spacing={1}>
                            {indicators.map((ind) => {
                              const val = unwrapValue(savedValuesMap.get(ind.id));
                              return (
                                <Box key={ind.id}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{ind.name}</Typography>
                                  {val && typeof val === 'object' ? <RenderAnswerGroup data={val} /> : (
                                    <Typography variant="body2" sx={{ ml: 1, mt: 0.25 }}>{toDisplayText(val) || '—'}</Typography>
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
            <Button startIcon={<ArrowBackIcon />} onClick={() => setRecordStep(1)} disabled={recordStep === 1}>Quay lại</Button>
            {recordStep === 1 ? (
              <Button variant="contained" endIcon={<ArrowForwardIcon />} onClick={toStep2LoadVitals}>Tiếp theo</Button>
            ) : (
              <Button variant="contained" onClick={() => setRecordDialogOpen(false)}>Đóng</Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Modal tạo lịch hẹn */}
        <Dialog open={createOpen} onClose={closeCreateModal} maxWidth="sm" fullWidth>
          <DialogTitle>Thêm lịch hẹn</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              <TextField label="Bệnh nhân (ID)" value={createPayload.patientId} InputProps={{ readOnly: true }} />
              <TextField label="Bác sĩ phụ trách" value={doctor?.fullname || '(chưa có)'} InputProps={{ readOnly: true }} helperText={doctor ? `ID: ${doctor.id}` : 'Không lấy được thông tin bác sĩ'} />
              <TextField label="Họ tên bệnh nhân" value={createPayload.fullName} onChange={(e) => setCreatePayload((p) => ({ ...p, fullName: e.target.value }))} />
              <TextField label="Số điện thoại" value={createPayload.phone} onChange={(e) => setCreatePayload((p) => ({ ...p, phone: e.target.value }))} />
              <TextField label="Lý do khám" value={createPayload.reason} onChange={(e) => setCreatePayload((p) => ({ ...p, reason: e.target.value }))} />
              <DateTimePicker label="Thời gian hẹn" value={createPayload.appointmentDate} onChange={(newVal) => setCreatePayload((p) => ({ ...p, appointmentDate: newVal || new Date() }))} />
              <FormControl><InputLabel>Trạng thái</InputLabel><Select label="Trạng thái" value={createPayload.status} onChange={(e) => setCreatePayload((p) => ({ ...p, status: e.target.value }))}>{ALL_STATUSES.map((st) => <MenuItem key={st} value={st}>{STATUS_LABEL[st]}</MenuItem>)}</Select></FormControl>
              <TextField label="Ghi chú" value={createPayload.notes} onChange={(e) => setCreatePayload((p) => ({ ...p, notes: e.target.value }))} multiline rows={2} />
              <Typography variant="subtitle2" sx={{ mt: 1 }}>Thông tin bổ sung</Typography>
              <TextField label="Người liên hệ khẩn cấp" value={createPayload.customInfo.emergencyContact} onChange={(e) => setCreatePayload((p) => ({ ...p, customInfo: { ...p.customInfo, emergencyContact: e.target.value } }))} />
              <TextField label="Bảo hiểm" value={createPayload.customInfo.insurance} onChange={(e) => setCreatePayload((p) => ({ ...p, customInfo: { ...p.customInfo, insurance: e.target.value } }))} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeCreateModal} disabled={submitting}>Hủy</Button>
            <Button variant="contained" onClick={submitCreateAppointment} disabled={submitting || !doctor?.id}>{submitting ? 'Đang tạo...' : 'Tạo lịch hẹn'}</Button>
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
