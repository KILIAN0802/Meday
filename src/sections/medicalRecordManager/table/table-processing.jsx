'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import debounce from 'lodash.debounce';
import {
  Box, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  Typography, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, Divider, CircularProgress, Pagination,
  IconButton, Menu, MenuItem, TextField, FormControl, Select, InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  getMedicalRecord,
  getVitalValuesMedicalRecord,
  updateVitalMedicalRecordeById
} from 'src/api/medical-record-staff';
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

/* ===================== Render Answer Group ===================== */
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
          <Dialog open={!!previewImg} onClose={() => setPreviewImg(null)} maxWidth="lg">
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

  if (Array.isArray(data)) {
    return (
      <Stack sx={{ ml: indent }} spacing={0.5}>
        {data.map((item, idx) => (
          <RenderAnswerGroup key={idx} data={item} level={level + 1} />
        ))}
      </Stack>
    );
  }

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

/* ===================== Component ===================== */
export function ConfirmedMedicalRecords() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [doctor, setDoctor] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [allFiltered, setAllFiltered] = useState([]);
  const reqIdRef = useRef(0);

  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [recordStep, setRecordStep] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loadingVitals, setLoadingVitals] = useState(false);
  const [vitalGroups, setVitalGroups] = useState([]);
  const [savedValuesMap, setSavedValuesMap] = useState(new Map());

  const [editingIndicatorId, setEditingIndicatorId] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [saving, setSaving] = useState(false);

  /* ===================== Functions ===================== */
  const fetchOnce = async (paramsObj = {}) => {
    const res = await getMedicalRecord({ page: 1, limit: 1000, ...paramsObj });
    const data = res?.data || [];
    return data.filter((it) => it?.appointment?.status?.toUpperCase() === 'CONFIRMED');
  };

  const handleEditSave = async (indicatorId) => {
    try {
      setSaving(true);
      await updateVitalMedicalRecordeById(selectedRecord.id, {
        vitalValues: [
          {
            vitalIndicatorId: indicatorId,
            value: { value: editingValue },
            note: 'Quick update',
          },
        ],
      });
      const newMap = new Map(savedValuesMap);
      newMap.set(indicatorId, { value: editingValue });
      setSavedValuesMap(newMap);
      setEditingIndicatorId(null);
      setEditingValue('');
    } catch (e) {
      console.error('Update failed:', e);
    } finally {
      setSaving(false);
    }
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
      const groups = await Promise.all(
        vitalGroupIds.map(async (gid) => {
          const gr = await getVitalGroupById(gid);
          return gr?.data;
        })
      );
      setVitalGroups(groups.filter(Boolean));

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

  /* ===================== useEffect ===================== */
  useEffect(() => {
    (async () => {
      setLoading(true);
      const list = await fetchOnce({});
      setAllFiltered(list);
      setRows(list.slice(0, limit));
      setTotal(list.length);
      setLoading(false);
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
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
          Danh sách bệnh án đang xử lý
        </Typography>

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
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress size={22} />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{r.id}</TableCell>
                    <TableCell>{r.patient?.fullname || '—'}</TableCell>
                    <TableCell>{r.patient?.phone || '—'}</TableCell>
                    <TableCell>
                      <Button onClick={() => { setRecordDialogOpen(true); setSelectedRecord(r); }}>
                        {r.template?.name || '—'}
                      </Button>
                    </TableCell>
                    <TableCell>{r.appointment?.reason || '—'}</TableCell>
                    <TableCell>{statusChip(r.appointment)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>

        {/* Dialog chỉ số */}
        <Dialog open={recordDialogOpen} onClose={() => setRecordDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {recordStep === 1 ? 'Thông tin bệnh án' : 'Chỉ số đã ghi nhận'}
          </DialogTitle>

          <DialogContent dividers>
            {recordStep === 1 ? (
              !selectedRecord ? (
                <Typography>Không có dữ liệu</Typography>
              ) : (
                <Stack spacing={1.2}>
                  <Row label="ID bệnh án" value={selectedRecord.id} />
                  {selectedRecord.diagnosis && (
                    <Row label="Chẩn đoán" value={selectedRecord.diagnosis} />
                  )}
                  {selectedRecord.symptoms && (
                    <Row label="Triệu chứng" value={selectedRecord.symptoms} />
                  )}
                  {selectedRecord.createdAt && (
                    <Row
                      label="Ngày tạo"
                      value={new Date(selectedRecord.createdAt).toLocaleString('vi-VN')}
                    />
                  )}
                </Stack>
              )
            ) : loadingVitals ? (
              <Box sx={{ py: 3, textAlign: 'center' }}>
                <CircularProgress size={22} />
              </Box>
            ) : vitalGroups.length === 0 ? (
              <Typography>Không có nhóm chỉ số.</Typography>
            ) : (
              <Stack spacing={2}>
                {vitalGroups.map((g) => {
                  const indicators = (g.indicators || []).filter((ind) =>
                    savedValuesMap.has(ind.id)
                  );
                  if (!indicators.length) return null;
                  return (
                    <Box
                      key={g.id}
                      sx={{ p: 1.5, border: '1px solid #eee', borderRadius: 1 }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 'bold', mb: 1 }}
                      >
                        {g.name || `Nhóm ${g.id}`}
                      </Typography>

                      <Stack spacing={1}>
                        {indicators.map((ind) => {
                          const val = unwrapValue(savedValuesMap.get(ind.id));
                          const isEditing = editingIndicatorId === ind.id;
                          return (
                            <Box key={ind.id}>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {ind.name}
                                </Typography>
                                {!isEditing && (
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setEditingIndicatorId(ind.id);
                                      setEditingValue(toDisplayText(val));
                                    }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </Stack>

                              {isEditing ? (
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  alignItems="center"
                                  sx={{ ml: 1, mt: 0.5 }}
                                >
                                  <TextField
                                    size="small"
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    onKeyDown={(e) =>
                                      e.key === 'Enter' && handleEditSave(ind.id)
                                    }
                                    sx={{ flex: 1 }}
                                  />
                                  <IconButton
                                    color="success"
                                    disabled={saving}
                                    onClick={() => handleEditSave(ind.id)}
                                  >
                                    <SaveIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton onClick={() => setEditingIndicatorId(null)}>
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                </Stack>
                              ) : (
                                <Typography
                                  variant="body2"
                                  sx={{ ml: 1, mt: 0.25 }}
                                >
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
          </DialogContent>

          <DialogActions sx={{ justifyContent: 'space-between' }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => setRecordStep(1)}
              disabled={recordStep === 1}
            >
              Quay lại
            </Button>

            {recordStep === 1 ? (
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={toStep2LoadVitals}
              >
                Tiếp theo
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={() => setRecordDialogOpen(false)}
              >
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
