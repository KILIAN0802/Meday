'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import debounce from 'lodash.debounce';
import {
  Box, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Typography, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, Divider, CircularProgress, Pagination, Card, CardMedia,
  IconButton, Menu, MenuItem, TextField, FormControl, Select, InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { getMedicalRecord, getVitalValuesMedicalRecord } from 'src/api/medical-record-staff';
import { getMedicalRecordTemplateById } from 'src/api/medical-record-templates-staff';
import { getVitalGroupById } from 'src/api/vitals';
import { updateAppointmentStatusID } from 'src/api/appointments-staff';
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

/* ===================== Component ===================== */
export function CompletedMedicalRecords() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [doctor, setDoctor] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [allFiltered, setAllFiltered] = useState([]);
  const reqIdRef = useRef(0);

  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);

  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [recordStep, setRecordStep] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loadingVitals, setLoadingVitals] = useState(false);
  const [vitalGroups, setVitalGroups] = useState([]);
  const [savedValuesMap, setSavedValuesMap] = useState(new Map());

  const [patientDialogOpen, setPatientDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  /* ===================== Utils ===================== */
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
    const data = res?.data || [];
    return data.filter((it) => it?.appointment?.status?.toUpperCase() === 'COMPLETED');
  };

  const searchSequential = async (query, pg = 1, lim = limit) => {
    const thisReq = ++reqIdRef.current;
    const q = (query || '').trim();

    // Nếu không có gì trong ô tìm kiếm → load tất cả COMPLETED
    if (!q) {
      try {
        const list = await fetchOnce({});
        if (thisReq !== reqIdRef.current) return;
        setAllFiltered(list);
        applyPaginate(list, pg, lim);
      } catch (e) {
        console.error('Lỗi tải dữ liệu:', e);
        // ✅ Nếu BE lỗi, clear bảng
        setAllFiltered([]);
        applyPaginate([], pg, lim);
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
        if (list.length > 0) {
          found = list;
          break;
        }
      }

      // ✅ Nếu tất cả đều rỗng → reset bảng ngay
      if (!found || found.length === 0) {
        console.warn('Không tìm thấy dữ liệu, clear bảng');
        setAllFiltered([]);
        applyPaginate([], pg, lim);
        return;
      }

      setAllFiltered(found);
      applyPaginate(found, pg, lim);
    } catch (e) {
      console.error('Lỗi khi tìm kiếm:', e);
      // ✅ Nếu lỗi (401, 500, v.v.) → reset bảng
      setAllFiltered([]);
      applyPaginate([], pg, lim);
    }
  };

  const debouncedSearch = useMemo(
    () => debounce((text) => searchSequential(text, 1, limit), 500),
    [limit]
  );

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

  /* ===================== Dialogs & Menus ===================== */
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

  const openMenu = (e, row) => {
    setMenuAnchorEl(e.currentTarget);
    setMenuRow(row);
  };
  const closeMenu = () => setMenuAnchorEl(null);

  const refreshAfterAction = async () => {
    closeMenu();
    await searchSequential(searchText, page, limit);
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

  /* ===================== useEffect ===================== */
  useEffect(() => {
    searchSequential('', 1, limit);
    (async () => {
      try {
        const prof = await getStaffProfile();
        setDoctor(prof?.data || null);
      } catch {}
    })();
  }, []);

  /* ===================== UI ===================== */
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        {/* Header + Search */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Danh sách bệnh án đã xử lý
          </Typography>
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
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress size={22} />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const p = row.patient || {};
                  const t = row.template || {};
                  const a = row.appointment;
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>
                        <Button
                          variant="text"
                          sx={{ color: 'green', fontWeight: 'bold' }}
                          onClick={() => openPatientDialog(p)}
                        >
                          {p.fullname || '—'}
                        </Button>
                      </TableCell>
                      <TableCell>{p.phone || '—'}</TableCell>
                      <TableCell>
                        <Button
                          variant="text"
                          sx={{ color: 'green', fontWeight: 'bold' }}
                          onClick={() => openRecordDialog(row)}
                        >
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

          {/* Pagination */}
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2">Hiển thị:</Typography>
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <Select value={limit} onChange={handleLimitChange}>
                  {[5, 10, 15, 20].map((num) => (
                    <MenuItem key={num} value={num}>{num}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="body2">/ trang</Typography>
            </Stack>
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
