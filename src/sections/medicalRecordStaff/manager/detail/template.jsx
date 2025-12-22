'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Stack,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Snackbar,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  FormGroup,
  TableContainer,
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import SortIcon from '@mui/icons-material/Sort';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { getPatient } from 'src/api/staff/patient_manage';
import { getMedicalRecordTemplateById } from 'src/api/medical-record-templates-staff';
import { getVitalGroupById } from 'src/api/vitals';
import { createMedicalRecord, updateVitalMedicalRecordById } from 'src/api/medical-record-staff';
import { getStaffProfile } from 'src/api/auth/owner';
import { paths } from 'src/routes/paths';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

const EPISODE_CODES = new Set(['QUES4CTN', 'QUES4MT1']);
const EPISODE_IDS = new Set([175, 64]);

const PENDING_PREFIX = 'pendingUploads:';
const MAX_IMAGES_PER_FIELD = 10;
const UPLOAD_CONCURRENCY = 3;
const Q4_IDS = new Set([190, 65]);
const Q5_IDS = new Set([196, 66]);
const Q11_IDS = new Set([185, 71, 41, 81]);
const CONDITIONAL_TEXT_IDS = new Set([204, 209]);
const SHAPE_IDS = new Set([182, 69]); // 9. Hình dạng

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

export default function PatientSelectDialog({ open, onClose, onSelect }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [currentEpisode, setCurrentEpisode] = useState({
    range: { from: null, to: null },
    weeks: 0,
    treated: null,
    drugName: '',
    dosage: '',
    response: null,
    symptom: null,
    hadBefore: null,
    previousCount: null,
    previousEpisodes: []
  });

  // State cho bộ lọc
  const [filters, setFilters] = useState({
    id: '',
    fullname: '',
    gender: '', // Bạn có thể đổi thành Select nếu muốn, ở đây để Text theo ảnh
    birthday: '',
    phone: '',
    email: '',
    identityNumber: ''
  });
  const [sortDirection, setSortDirection] = useState(null); 
  const debouncedFilters = useDebounce(filters, 500); 
  useEffect(() => {
    setPage(0);
  }, [debouncedFilters]);

  const fetchPatients = useCallback(async () => {
  setLoading(true);
  try {
    const cleanFilters = { ...debouncedFilters };
    if (cleanFilters.phone && cleanFilters.phone.trim().startsWith('0')) {
      cleanFilters.phone = cleanFilters.phone.trim().substring(1);
    }
    const params = {
      page: page + 1,
      limit: rowsPerPage,
      ...cleanFilters, // Truyền bộ lọc đã được xử lý (đã bỏ số 0)
    };

    if (sortDirection) {
      params.sort = `fullname:${sortDirection}`;
    }

    const res = await getPatient(params);
    
    // Xử lý dữ liệu trả về (code fix lỗi mảng trước đó)
    if (res && res.data && Array.isArray(res.data.data)) {
      setPatients(res.data.data);
      setTotal(res.total || 0);
    } else if (res && Array.isArray(res.data)) {
      setPatients(res.data);
      setTotal(res.total || res.length || 0);
    } else {
      setPatients([]);
    }

  } catch (error) {
    console.error(error);
    setPatients([]);
  } finally {
    setLoading(false);
  }
}, [debouncedFilters, sortDirection, page, rowsPerPage]);

  useEffect(() => {
    if (open) {
      fetchPatients();
    }
  }, [open, fetchPatients]);

  // Xử lý thay đổi input filter
  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // Xử lý click nút sort fullname
  const handleSortClick = () => {
    if (sortDirection === null) setSortDirection('ASC');
    else if (sortDirection === 'ASC') setSortDirection('DESC');
    else setSortDirection(null);
  };
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset về trang đầu khi đổi limit
  };
  const formatGender = (gender) => {
    if (gender === 'MALE') return 'Nam';
    if (gender === 'FEMALE') return 'Nữ';
    return '';
  };

  // Xử lý hiển thị SĐT (thêm số 0)
  const formatPhone = (phone) => {
    if (!phone) return '';
    return phone.startsWith('0') ? phone : `0${phone}`;
  };

  // Style chung cho đường kẻ đen ngăn cách cột
  const borderStyle = { borderRight: '1px solid rgba(0,0,0,0.12)' };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        Chọn bệnh nhân
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}> 
        {/* p:0 để bảng sát lề, scrollbar sẽ là của DialogContent */}
        <TableContainer>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {/* 1. Cột ID */}
                <TableCell sx={{ ...borderStyle, width: 80, bgcolor: 'background.paper' }}>
                  <Typography variant="subtitle2">ID</Typography>
                  <TextField 
                    size="small" variant="standard" placeholder="Lọc..." 
                    value={filters.id} onChange={(e) => handleFilterChange('id', e.target.value)}
                  />
                </TableCell>

                {/* 2. Cột Họ và tên (Có Sort) */}
                <TableCell sx={{ ...borderStyle, minWidth: 200, bgcolor: 'background.paper' }}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography variant="subtitle2">Họ và Tên</Typography>
                    <IconButton size="small" onClick={handleSortClick}>
                       {!sortDirection && <SortIcon fontSize="inherit" />}
                       {sortDirection === 'ASC' && <ArrowUpwardIcon fontSize="inherit" color="primary" />}
                       {sortDirection === 'DESC' && <ArrowDownwardIcon fontSize="inherit" color="primary" />}
                    </IconButton>
                  </Stack>
                  <TextField 
                    size="small" variant="standard" placeholder="Lọc tên..." fullWidth
                    value={filters.fullname} onChange={(e) => handleFilterChange('fullname', e.target.value)}
                  />
                </TableCell>

                {/* 3. Cột Giới tính */}
                <TableCell sx={{ ...borderStyle, width: 100, bgcolor: 'background.paper' }}>
                  <Typography variant="subtitle2">Giới tính</Typography>
                   <TextField 
                    size="small" variant="standard" placeholder="Nam/Nữ" 
                    value={filters.gender} onChange={(e) => handleFilterChange('gender', e.target.value)}
                  />
                </TableCell>

                {/* 4. Cột Ngày sinh */}
                <TableCell sx={{ ...borderStyle, width: 120, bgcolor: 'background.paper' }}>
                  <Typography variant="subtitle2">Ngày sinh</Typography>
                   <TextField 
                    size="small" variant="standard" placeholder="yyyy-mm-dd" 
                    value={filters.birthday} onChange={(e) => handleFilterChange('birthday', e.target.value)}
                  />
                </TableCell>

                {/* 5. Cột SĐT */}
                <TableCell sx={{ ...borderStyle, width: 120, bgcolor: 'background.paper' }}>
                  <Typography variant="subtitle2">SĐT</Typography>
                  <TextField 
                    size="small" variant="standard" placeholder="Lọc SĐT..." 
                    value={filters.phone} onChange={(e) => handleFilterChange('phone', e.target.value)}
                  />
                </TableCell>

                {/* 6. Cột Email */}
                <TableCell sx={{ ...borderStyle, minWidth: 150, bgcolor: 'background.paper' }}>
                  <Typography variant="subtitle2">Email</Typography>
                   <TextField 
                    size="small" variant="standard" placeholder="Lọc email..." fullWidth
                    value={filters.email} onChange={(e) => handleFilterChange('email', e.target.value)}
                  />
                </TableCell>

                {/* 7. Cột CMND/CCCD */}
                <TableCell sx={{ bgcolor: 'background.paper' }}>
                  <Typography variant="subtitle2">CMND/CCCD</Typography>
                   <TextField 
                    size="small" variant="standard" placeholder="Lọc..." 
                    value={filters.identityNumber} onChange={(e) => handleFilterChange('identityNumber', e.target.value)}
                  />
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : patients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    Không tìm thấy bệnh nhân
                  </TableCell>
                </TableRow>
              ) : (
                patients.map((patient) => (
                  <TableRow 
                    key={patient.id} 
                    hover 
                    onClick={() => onSelect(patient)} // Tự động chọn khi click vào hàng
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell sx={borderStyle}>{patient.id}</TableCell>
                    <TableCell sx={borderStyle} style={{ fontWeight: 600 }}>{patient.fullname}</TableCell>
                    <TableCell sx={borderStyle}>{formatGender(patient.gender)}</TableCell>
                    <TableCell sx={borderStyle}>
                      {patient.birthday ? dayjs(patient.birthday).format('DD/MM/YYYY') : ''}
                    </TableCell>
                    <TableCell sx={borderStyle}>{formatPhone(patient._phone || patient.phone)}</TableCell>
                    <TableCell sx={borderStyle}>{patient.email}</TableCell>
                    <TableCell>{patient.identityNumber}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total} // Tổng số bản ghi (lấy từ API)
          page={page}   // Trang hiện tại (0-based)
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage} // Giới hạn số dòng
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]} // Các tùy chọn limit
          labelRowsPerPage="Số dòng:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}–${to} trong số ${count !== -1 ? count : `hơn ${to}`}`
          }
          sx={{ borderTop: '1px solid rgba(0,0,0,0.12)' }}
        />
      </DialogContent>
    </Dialog>
  );
}

const lsSafeParse = (s, fb) => {
  try { return JSON.parse(s); } catch { return fb; }
};

const calculateWeeks = (start, end) => {
  if (!start) return 0;
  const startDate = start.startOf('month');
  const endDate = end ? end.endOf('month') : dayjs().endOf('month'); 
  
  if (startDate.isAfter(endDate)) return 0;

  const daysDiff = endDate.diff(startDate, 'day') + 1;
  return Math.max(0, Math.ceil(daysDiff / 7));
};

const sanitizeName = (str) => str ? str.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '') : '';

const EpisodeSingleForm = ({ title, prefixKey, data, onChange, isMainEpisode = false }) => {
  const safePrefix = sanitizeName(prefixKey);

  // Helper set/get dữ liệu
  const setVal = (field, val) => onChange(`${prefixKey}_${field}`, val);
  const getVal = (field) => data[`${prefixKey}_${field}`] ?? ''; // Luôn trả về string rỗng nếu chưa có

  // --- Logic Date & Tuần ---
  const startDateStr = getVal('StartDate');
  const endDateStr = getVal('EndDate');
  
  // Effect giả lập: Tính toán số tuần ngay khi render nếu date thay đổi
  // (Hoặc có thể tính trong onChange như yêu cầu trước, ở đây tôi làm theo kiểu controlled)
  const startDate = startDateStr ? dayjs(startDateStr) : null;
  const endDate = endDateStr ? dayjs(endDateStr) : null;
  const weeksVal = getVal('Số tuần bị đợt này');

  const handleDateChange = (pos, newVal) => {
    const valStr = newVal ? newVal.toISOString() : '';
    // Cập nhật ngày trước
    if (pos === 'start') onChange(`${prefixKey}_StartDate`, valStr);
    else onChange(`${prefixKey}_EndDate`, valStr);

    // Tính toán tuần ngay lập tức để update state
    const s = pos === 'start' ? newVal : startDate;
    // Logic: Nếu chưa chọn End, mặc định là Today để tính
    const e = (pos === 'end' ? newVal : endDate) || dayjs(); 

    let w = 0;
    if (s) {
       const startM = s.startOf('month');
       const endM = e.startOf('month');
       if (!startM.isAfter(endM)) {
          const days = endM.diff(startM, 'day') + 1;
          w = Math.ceil(days / 7);
       }
    }
    setVal('Số tuần bị đợt này', w);
  };

  // --- Logic Điều Kiện (State derived) ---
  const treatmentVal = getVal('Có điều trị hay không?');
  const showMedicine = treatmentVal === 'Có';

  const statusVal = getVal('Tình trạng tổn thương khi đang uống thuốc');
  const showSymptoms = statusVal === 'Giảm xuống' || statusVal === 'Nặng lên';

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: isMainEpisode ? '#fff' : '#f9f9f9' }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main', textTransform: 'uppercase' }}>
        {title}
      </Typography>

      <Stack spacing={2}>
        {/* 1. Date Range */}
        <Stack spacing={1}>
            <Typography variant="body2">Thời gian (Từ tháng... đến tháng...)</Typography>
            <Stack direction="row" spacing={2}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker 
                        label="Từ tháng" views={['month', 'year']} format="MM/YYYY"
                        value={startDate} 
                        onChange={(v) => handleDateChange('start', v)}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                    <DatePicker 
                        label="Đến tháng" views={['month', 'year']} format="MM/YYYY"
                        value={endDate} 
                        onChange={(v) => handleDateChange('end', v)}
                        slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                </LocalizationProvider>
            </Stack>
        </Stack>

        {/* 2. Số tuần (Luôn hiện, Readonly) */}
        <TextField
            label="Số tuần bị đợt này" size="small" type="number"
            value={weeksVal}
            InputProps={{ readOnly: true }}
        />

        {/* 3. Câu hỏi điều trị */}
        <ClearableSelect
            name={`treat_${safePrefix}`} // Name Unique
            label={isMainEpisode 
                ? "Đợt bệnh này bạn đã điều trị hay chưa? (1 đợt bệnh liên tục có nghĩa là bị ít nhất 2 ngày/tuần)" 
                : "Có điều trị hay không?"}
            value={treatmentVal}
            options={['Có', 'Không', 'Không nhớ']}
            onChange={(v) => setVal('Có điều trị hay không?', v)}
        />

        {/* 4. Nhóm thuốc: Render nhưng ẨN (display: none) nếu không thỏa mãn */}
        <Box sx={{ pl: 2, borderLeft: '2px solid #eee', display: showMedicine ? 'block' : 'none' }}>
            <Stack spacing={2}>
                <TextField 
                    label="Tên thuốc" size="small" 
                    value={getVal('Tên thuốc')} 
                    onChange={(e) => setVal('Tên thuốc', e.target.value)} 
                />
                <TextField 
                    label="Liều thuốc (ghi thời gian nếu nhớ)" size="small" 
                    value={getVal('Liều thuốc (ghi thời gian nếu nhớ)')} 
                    onChange={(e) => setVal('Liều thuốc (ghi thời gian nếu nhớ)', e.target.value)} 
                />
                
                <ClearableSelect
                    name={`status_${safePrefix}`}
                    label="Tình trạng tổn thương khi đang uống thuốc"
                    value={statusVal}
                    options={['Hết hoàn toàn', 'Không hết', 'Giảm xuống', 'Nặng lên']}
                    onChange={(v) => setVal('Tình trạng tổn thương khi đang uống thuốc', v)}
                />

                {/* 5. Nhóm Triệu chứng: Render nhưng ẨN */}
                <ClearableSelect
                    name={`symptom_${safePrefix}`}
                    hidden={!showSymptoms} // Prop hidden tự chế dùng display: none
                    label="Triệu chứng Giảm xuống/ Nặng lên là gì?"
                    value={getVal('Triệu chứng Giảm xuống/ Nặng lên là gì?')}
                    options={['Nốt đỏ', 'Ngứa', 'Cả hai']}
                    onChange={(v) => setVal('Triệu chứng Giảm xuống/ Nặng lên là gì?', v)}
                />
            </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};

// --- Component Chính ---

const getPending = (key) => lsSafeParse(localStorage.getItem(PENDING_PREFIX + key) || '[]', []);
const setPending = (key, arr) => localStorage.setItem(PENDING_PREFIX + key, JSON.stringify(arr));
const clearPendingStartsWith = (prefix) => {
  Object.keys(localStorage).forEach((k) => { if (k.startsWith(prefix)) localStorage.removeItem(k); });
};

const makePreviewItem = (file) => ({
  name: file.name,
  size: file.size,
  type: file.type,
  src: URL.createObjectURL(file),
  file
});

const LAB_STANDARD_RANGES = {
  WBC: "4-10",
  EO: "0-0.8",
  BA: "0.0-0.12",
  CRP: "<1.0",
  "Máu lắng - 1h": "",
  "Máu lắng - 2h": "",
  FT3: "3.1-6.8",
  FT4: "11.9-21.6",
  TSH: "0.27-4.2",
  "IgE toàn phần": "<100",
  "Anti-TPO": "0-34",
};

function normalizeLabName(name) {
  return name
    .replace(/^Chỉ số\s*/i, "")   // bỏ chữ "Chỉ số"
    .trim();
}

function EpisodeRange({ value, onChange }) {
  const { from, to } = value;

  useEffect(() => {
    if (!from) return;

    const start = dayjs(from).startOf('month');
    const end = to
      ? dayjs(to).startOf('month')
      : dayjs().startOf('month');

    const weeks = Math.ceil(end.diff(start, 'day') / 7);

    onChange({
      ...value,
      weeks: weeks > 0 ? weeks : 0
    });
  }, [from, to]);

  return (
    <Stack direction="row" spacing={2}>
      <DatePicker
        views={['year', 'month']}
        label="Từ tháng / năm"
        value={from}
        onChange={(v) => onChange({ ...value, from: v })}
      />

      <DatePicker
        views={['year', 'month']}
        label="Đến tháng / năm"
        value={to}
        onChange={(v) => onChange({ ...value, to: v })}
      />
    </Stack>
  );
}

function LabResultTable({ title, indicators, values, onChange, extraQuestions }) {
  return (
    <Stack spacing={2}>

      <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {title}
        </Typography>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f5f5f5", borderBottom: "1px solid #ddd" }}>
              <th style={{ padding: 8 }}>Chỉ số</th>
              <th style={{ padding: 8 }}>Kết quả</th>
              <th style={{ padding: 8 }}>Tiêu chuẩn</th>
              <th style={{ padding: 8 }}>Đơn vị</th>
            </tr>
          </thead>

          <tbody>
            {indicators.map((ind) => {
              const val = values[ind.id]?.value ?? "";
              const standard = LAB_STANDARD_RANGES[ normalizeLabName(ind.name) ] || "—";

              return (
                <tr key={ind.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: 8 }}>{ind.name}</td>

                  <td style={{ padding: 8, width: 160 }}>
                    <TextField
                      size="small"
                      fullWidth
                      type="number"
                      value={val}
                      onChange={(e) =>
                        onChange(ind.id, { value: e.target.value, note: "" })
                      }
                    />
                  </td>

                  <td style={{ padding: 8 }}>{standard}</td>
                  <td style={{ padding: 8 }}>{ind.unit || ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Paper>

      {/* Nếu có extraQuestions thì render dưới bảng */}
      {extraQuestions && extraQuestions.length > 0 && (
        <Stack spacing={2}>
          {extraQuestions.map((ind) => (
            <QuestionRendererMUI
              key={ind.id}
              indicator={ind}
              value={values[ind.id]}
              onChange={(val) => onChange(ind.id, val)}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function uploadOneFileWithProgress(file, groupId, templateId, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const endpoint = `https://drmayday.ibme.edu.vn/urticaria-collector/api/v1/medical-records/upload?user_id=${groupId}&record_type=${templateId}`;
    xhr.open('POST', endpoint);
    xhr.onload = () => {
      const text = xhr.responseText || '';
      if (xhr.status >= 200 && xhr.status < 300) {
        if (text && text.startsWith('http')) return resolve(text.trim());
        try {
          const data = JSON.parse(text);
          const url = data.url || data.data?.url || data.path || data.file_url;
          if (url) return resolve(url);
        } catch {}
        return reject(new Error('Upload thành công nhưng phản hồi không có URL.'));
      }
      reject(new Error(`Upload thất bại (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('Lỗi mạng khi upload.'));
    if (xhr.upload && typeof onProgress === 'function') {
      xhr.upload.onprogress = (e) => {
        if (!e.lengthComputable) return;
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress(pct);
      };
    }
    const form = new FormData();
    form.append('file', file);
    xhr.send(form);
  });
}

async function resolveUploadsDeepConcurrent(value, groupId, templateId, updateProgress, path = [], pool) {
  const wrapJob = (job) => new Promise((res, rej) => {
    const run = async () => {
      pool.running++;
      try { const out = await job(); res(out); } catch (e) { rej(e); }
      finally { pool.running--; pool.next(); }
    };
    pool.queue.push(run);
    pool.next();
  });

  if (value && typeof value === 'object' && !(value instanceof File) && 'file' in value && value.file instanceof File) {
    const key = path.join('.');
    return wrapJob(() => uploadOneFileWithProgress(value.file, groupId, templateId, (p) => updateProgress(key, p)));
  }

  if (value instanceof File) {
    const key = path.join('.');
    return wrapJob(() => uploadOneFileWithProgress(value, groupId, templateId, (p) => updateProgress(key, p)));
  }

  if (Array.isArray(value)) {
    const results = [];
    for (let i = 0; i < value.length; i += 1) {
      const v = value[i];
      const out = await resolveUploadsDeepConcurrent(v, groupId, templateId, updateProgress, [...path, i], pool);
      results.push(out);
    }
    return results;
  }

  if (value && typeof value === 'object') {
    if (value.src && typeof value.src === 'string' && value.src.startsWith('blob:')) {
      const fileName = value.name || `image_${Date.now()}.jpg`;
      const res = await fetch(value.src);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
      const key = path.join('.');
      return await wrapJob(() => uploadOneFileWithProgress(file, groupId, templateId, (p) => updateProgress(key, p)));
    }

    const out = {};
    for (const k of Object.keys(value)) {
      out[k] = await resolveUploadsDeepConcurrent(value[k], groupId, templateId, updateProgress, [...path, k], pool);
    }
    return out;
  }

  return value;
}

function ClearableSelect({ label, value, options = [], onChange, name, hidden = false }) {
  // Nếu hidden = true, ta ẩn bằng CSS nhưng vẫn giữ trong DOM
  return (
    <Stack 
      direction="row" 
      alignItems="flex-start" 
      spacing={1} 
      sx={{ mt: 1, display: hidden ? 'none' : 'flex' }}
    >
      <Box sx={{ flexGrow: 1 }}>
        {label && <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{label}</Typography>}
        <RadioGroup
          name={name}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((opt, i) => (
            <FormControlLabel
              key={`${name}-${i}`}
              value={opt}
              control={<Radio size="small" />}
              label={opt}
            />
          ))}
        </RadioGroup>
      </Box>
      <IconButton
        size="small"
        onClick={(e) => { 
            e.preventDefault(); 
            e.stopPropagation(); 
            onChange(''); 
        }}
        disabled={!value}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
}

function ClearableMultiSelect({ label, value, options = [], onChange }) {
  const arr = Array.isArray(value) ? value : [];
  const normalize = (s) => String(s ?? '').trim();
  const arrIncludes = (a, opt) => Array.isArray(a) && a.some(x => normalize(x) === normalize(opt));
  const arrRemove = (a, opt) => (Array.isArray(a) ? a.filter(x => normalize(x) !== normalize(opt)) : []);

  const toggle = (opt) => {
    if (arrIncludes(arr, opt)) onChange(arrRemove(arr, opt));
    else onChange([...arr, opt]);
  };
  return (
    <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ mt: 1 }}>
      <Box sx={{ flexGrow: 1 }}>
        {label && <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{label}</Typography>}
        <FormGroup>
          {options.map((opt, i) => (
            <FormControlLabel
              key={`${label || 'no_label'}-${i}`}
              control={<Checkbox size="small" checked={arrIncludes(arr, opt)} onChange={() => toggle(opt)} />}
              label={opt}
            />
          ))}
        </FormGroup>
      </Box>
      {arr.length ? (
        <IconButton size="small" aria-label="Xóa tất cả" onClick={() => onChange([])}>
          <CloseIcon fontSize="small" />
        </IconButton>
      ) : null}
    </Stack>
  );
} 

const GenericCustomRenderer = React.memo(function GenericCustomRenderer({
  indicator,
  value,
  onChange,
  onOpenPreview,
  groupLabelMap
}) {
  
  const groups = (() => {
    const raw = indicator.valueOptions?.group || indicator.valueOptions?.groups;
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.fields) || Array.isArray(raw.field)) return [raw];
    return [];
  })();

  const setKV = (g, k, v) => {
    const current = value?.value || {};
    onChange({ value: { ...current, [g]: { ...(current[g] || {}), [k]: v } }, note: '' });
  };

  const isShapeThis = SHAPE_IDS.has(indicator.id);
  const isDurationThis = Q11_IDS.has(indicator.id);
  const isConditionalTextThis = CONDITIONAL_TEXT_IDS.has(indicator.id);

  // Helper to compare option values safely (trim and string compare)
  const normalize = (s) => String(s ?? '').trim();
  const arrIncludes = (arr, opt) => Array.isArray(arr) && arr.some(a => normalize(a) === normalize(opt));
  const arrRemove = (arr, opt) => (Array.isArray(arr) ? arr.filter(a => normalize(a) !== normalize(opt)) : []);

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
      <Box sx={{ borderLeft: 3, borderColor: 'divider', pl: 2 }}>
        {groups.map((group, gi) => {
          const gKeyFromApi = groupLabelMap?.[indicator.groupId] || '';
          const gKey = gKeyFromApi;
          let fields = group.field || group.fields || [];
          if (fields.length === 0 && (group.label || group.type)) {
              fields = [group];
          }
          const gVal = value?.value?.[gKey] || {};
          const renderedFieldLabels = new Set();

          return (
            <Box key={`${gKey || ''}_${gi}`} sx={{ '&:not(:first-of-type)': { mt: 2 } }}>
              {(gKey || '').trim() !== '' && <Typography variant="subtitle2" gutterBottom>{gKey}</Typography>}
              <Stack spacing={2}>
                {fields.map((field, fi) => {
                  const isConditionalQuestion = indicator.id === 204 || indicator.id === 209;
                  const fKeyRaw = field.label || ``;
                  const fKey = fKeyRaw === '' ? 'chọn 1 đáp án' : fKeyRaw;
                  if (renderedFieldLabels.has(fKey)) return null;
                  if (isConditionalQuestion && field.label === 'Số lần bị khó thở') {
                    return null;
                  }
                  const fVal = gVal[fKey];
                  const options = field.option || field.options || [];
                  const fieldId = field.id ?? fi;
                  const keyId = `${indicator.id}-${gKey || ''}-${fKey}-${fieldId}`;
                  const pendingKey = `${indicator.id}::${gKey}::${fKey}`;
                  const isQ5This = Q5_IDS.has(indicator.id);

                  const handleText = (e) => setKV(gKey, fKey, e.target.value);
                  const handleNumber = (e) => setKV(gKey, fKey, e.target.value === '' ? '' : Number(e.target.value));
                  const handleSelect = (v) => setKV(gKey, fKey, v);
                  if (isConditionalQuestion && field.type === 'selection') {
                    const selectKey = fKey;
                    const textKey = 'Số lần bị khó thở'; 
                    
                    const currentSelectValue = gVal[selectKey];

                    const handleSelectChange = (val) => {
                      const currentAllData = value?.value || {};
                      const currentGroupData = currentAllData[gKey] || {};
                      const nextGroupData = {
                          ...currentGroupData,
                          [selectKey]: val
                      };
                      if (val !== 'Có') {
                          nextGroupData[textKey] = '';
                      }
                      onChange({
                          value: {
                              ...currentAllData,
                              [gKey]: nextGroupData
                          },
                          note: ''
                      });
                  };

                return (
                    <Box key={keyId} sx={{ mt: 1 }}>
                          <ClearableSelect 
                              label={indicator.name || "Bạn đã bao giờ bị khó thở trong đợt bệnh mày đay hay chưa?"} 
                              value={currentSelectValue ?? ''} 
                              options={options} 
                              onChange={handleSelectChange}
                          />
                          
                          {/* ...phần render TextField giữ nguyên... */}
                          {currentSelectValue === 'Có' && (
                              <TextField
                                  key={`${keyId}-conditional-text`}
                                  size="small" fullWidth sx={{ mt: 2 }}
                                  label="Số lần bị khó thở"
                                  placeholder="Nhập số lần..."
                                  value={gVal[textKey] ?? ''}
                                  onChange={(e) => setKV(gKey, textKey, e.target.value)}
                              />
                          )}
                    </Box>
                );
                  }
                  if (isShapeThis && field.label && field.label.toLowerCase().includes('mô tả hình dạng khác')) return null;
                  if (isDurationThis && field.label === 'Nhập khoảng thời gian') return null;
                  if (isConditionalTextThis && field.label === 'Số lần bị khó thở' && field.type === 'text') return null;
                  if (isQ5This && field.label) {
                    const lower = field.label.toLowerCase();
                    if (lower.includes('chi tiết thức ăn') || lower.includes('chi tiết thuốc')) return null;
                  }

                  // --- XỬ LÝ TEXT ---
                  if (field.type === 'text') {
                    return (
                      <TextField key={keyId} size="small" fullWidth label={fKey} value={fVal ?? ''} onChange={handleText} />
                    );
                  }

                  // --- XỬ LÝ NUMBER ---
                  if (field.type === 'number') {
                    return (
                      <TextField key={keyId} size="small" fullWidth type="number" inputProps={{ step: 'any' }} label={fKey} value={fVal ?? ''} onChange={handleNumber} />
                    );
                  }

                  // --- XỬ LÝ FULL_DATE (MỚI THÊM) ---
                  if (field.type === 'full_date') {
                    return (
                      <Box key={keyId}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DatePicker
                            label={fKey}
                            format="DD/MM/YYYY"
                            value={fVal ? dayjs(fVal, 'DD/MM/YYYY') : null}
                            onChange={(date) => {
                              const formatted = date ? dayjs(date).format('DD/MM/YYYY') : '';
                              setKV(gKey, fKey, formatted);
                            }}
                            slotProps={{ textField: { size: 'small', fullWidth: true } }}
                          />
                        </LocalizationProvider>
                      </Box>
                    );
                  }

                  // --- XỬ LÝ SELECTION / SELECT (GỘP CHUNG) ---
                  if (field.type === 'selection' || field.type === 'select') {
                    const reqTextField = Array.isArray(field.requiredFields) 
                        ? field.requiredFields.find(r => r.type === 'text') 
                        : null;
                    const reqCondition = reqTextField ? (reqTextField.condition || reqTextField.condiction) : null;
                    const extraTextLabel = reqTextField ? reqTextField.description : `${fKey} - Chi tiết`;

                    const handleSelect = (v) => {
                        if (reqTextField && v !== reqCondition) {
                             setKV(gKey, extraTextLabel, '');
                        }
                        setKV(gKey, fKey, v);
                    };
                    if (isDurationThis && (fKey === '11.1 Khi dùng thuốc' || fKey === '11.2 Khi không dùng thuốc' || fKey.includes('4.1') || fKey.includes('4.2'))) {
                        const otherInputField = fields.find(f => f.label === 'Nhập khoảng thời gian' && f.type === 'text');
                        const otherInputKey = otherInputField ? 'Nhập khoảng thời gian' : `${fKey} - Khác (theo giờ)`;
                        
                        return (
                          <Box key={keyId}>
                            <ClearableSelect label={fKey} value={fVal ?? ''} options={options} onChange={handleSelect} />
                            {reqTextField && fVal === reqCondition && (
                                  <Box sx={{ mt: 1, ml: 2, p: 1, borderLeft: '2px solid #ccc' }}>
                                    <TextField
                                      key={`${keyId}-extra-text`}
                                      size="small" fullWidth
                                      label={extraTextLabel}
                                      placeholder={extraTextLabel}
                                      value={gVal[extraTextLabel] || ''}
                                      onChange={(e) => setKV(gKey, extraTextLabel, e.target.value)}
                                    />
                                  </Box>
                            )}
                            {fVal === 'Khác (theo giờ)' && (
                              <Box sx={{ mt: 1 }}>
                                <TextField
                                  key={`${keyId}-other-hours`}
                                  size="small" fullWidth
                                  label="Nhập khoảng thời gian"
                                  value={gVal[otherInputKey] || ''}
                                  onChange={(e) => setKV(gKey, otherInputKey, e.target.value)}
                                />
                              </Box>
                            )}
                          </Box>
                        );
                    }

                    // Logic riêng cho câu hỏi điều kiện (Conditional Text)
                    if (isConditionalTextThis && fKey === 'chọn 1 đáp án') {
                        const selectedOption = gVal[fKey];
                        const textControl = fields.find((f, index) => index > fi && f.label === 'Số lần bị khó thở' && f.type === 'text');
                        const textKey = textControl?.label;
                        if (textKey) renderedFieldLabels.add(textKey); 
                        
                        const handleConditionalSelect = (v) => {
                            setKV(gKey, fKey, v); 
                            if (safeNormalize(v) !== 'Có' && textKey) setKV(gKey, textKey, '');
                        };

                        return (
                            <Box key={keyId}>
                                <ClearableSelect 
                                    label="" name={keyId}
                                    value={selectedOption ?? ''} 
                                    options={options} 
                                    onChange={handleConditionalSelect}
                                />
                                {textKey && safeNormalize(selectedOption) === 'Có' && (
                                    <Box sx={{ mt: 1 }}>
                                        <TextField
                                            key={`${keyId}-conditional-text`}
                                            size="small" fullWidth
                                            label={textKey} type="number" 
                                            inputProps={{ step: '1', min: '0' }}
                                            value={gVal[textKey] ?? ''}
                                            onChange={(e) => setKV(gKey, textKey, e.target.value)}
                                        />
                                    </Box>
                                )}
                            </Box>
                        );
                    }

                    // Mặc định cho selection/select thông thường
                    return (
                      <Box key={keyId}>
                        <ClearableSelect label={fKey} value={fVal ?? ''} options={options} onChange={handleSelect} />
                      </Box>
                    );
                  }

                  // --- XỬ LÝ MULTI_SELECTION ---
                  if (field.type === 'multi_selection') {
                    const arr = Array.isArray(fVal) ? fVal : [];
                    if (isQ5This) {
                      const hasFood = arrIncludes(arr, 'Thức ăn');
                      const hasDrug = arrIncludes(arr, 'Chống viêm, giảm đau');
                      const toggle = (opt) => {
                        const updated = arrIncludes(arr, opt) ? arrRemove(arr, opt) : [...arr, opt];
                        setKV(gKey, fKey, updated);
                      };
                      const labelsRenderedLocal = new Set(); // Đổi tên biến để tránh conflict nếu có

                      return (
                        <Box key={keyId} sx={{ mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{fKey || 'Chọn yếu tố làm nặng bệnh'}</Typography>
                          <FormGroup>
                            {['Stress', 'Thức ăn', 'Chống viêm, giảm đau'].map((opt) => (
                              <FormControlLabel key={opt} control={<Checkbox size="small" checked={arrIncludes(arr, opt)} onChange={() => toggle(opt)} />} label={opt} />
                            ))}
                          </FormGroup>

                          {hasFood && fields.filter((fld) => fld.label && fld.label.toLowerCase().includes('chi tiết thức ăn') && !labelsRenderedLocal.has(fld.label)).map((fld) => {
                                labelsRenderedLocal.add(fld.label);
                                return (
                                  <TextField key={fld.label} size="small" fullWidth sx={{ mt: 1 }} label={fld.label} placeholder={fld.placeholder} value={gVal[fld.label] || ''} onChange={(e) => setKV(gKey, fld.label, e.target.value)} />
                                );
                              })}
                          {hasDrug && fields.filter((fld) => fld.label && fld.label.toLowerCase().includes('chi tiết thuốc') && !labelsRenderedLocal.has(fld.label)).map((fld) => {
                                labelsRenderedLocal.add(fld.label);
                                return (
                                  <TextField key={fld.label} size="small" fullWidth sx={{ mt: 1 }} label={fld.label} placeholder={fld.placeholder} value={gVal[fld.label] || ''} onChange={(e) => setKV(gKey, fld.label, e.target.value)} />
                                );
                              })}
                        </Box>
                      );
                    }
                    
                    // Logic cũ cho Shape
                    if (isShapeThis && fKey === 'Chọn hình dạng bạn gặp phải') {
                      const toggleShape = (opt) => {
                        const updated = arrIncludes(arr, opt) ? arrRemove(arr, opt) : [...arr, opt];
                        if (!arrIncludes(updated, 'Hình dạng khác')) setKV(gKey, 'Mô tả hình dạng khác', '');
                        setKV(gKey, fKey, updated);
                      };
                      const otherSelected = arrIncludes(arr, 'Hình dạng khác');
                      const otherValue = gVal['Mô tả hình dạng khác'] ?? '';
                      return (
                        <Box key={keyId}>
                           <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{fKey}</Typography>
                           <FormGroup>
                             {(options || []).map((opt, idx) => (
                               <FormControlLabel key={`${keyId}-opt-${idx}`} control={<Checkbox size="small" checked={arrIncludes(arr, opt)} onChange={() => toggleShape(opt)} />} label={opt} />
                             ))}
                           </FormGroup>
                           {otherSelected && (
                             <TextField key={`${keyId}-other-input`} size="small" fullWidth sx={{ mt: 1 }} label="Mô tả hình dạng khác" placeholder="Nhập mô tả" value={otherValue} onChange={(e) => setKV(gKey, 'Mô tả hình dạng khác', e.target.value)} />
                           )}
                        </Box>
                      );
                    }

                    // Mặc định multi_selection
                    const arrVal = arr;
                    const renderOptions = () => {
                      let list = options;
                      if (Q4_IDS.has(indicator.id) && (fKey.includes('4.') || indicator.id === 190 || indicator.id === 65)) {
                        const baseTwo = ['Một cách ngẫu nhiên', 'Khi có các yếu tố kích thích'];
                        const showExtra = arrIncludes(arrVal, 'Khi có các yếu tố kích thích');
                        list = showExtra ? options : options.filter((o) => baseTwo.includes(o));
                      }
                      return list;
                    };

                    return (
                      <Box key={keyId}>
                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{fKey || 'Chọn'}</Typography>
                        <FormGroup>
                          {renderOptions().map((opt, idx) => {
                            const checked = arrIncludes(arrVal, opt);
                            const toggle = () => { const updated = checked ? arrRemove(arrVal, opt) : [...arrVal, opt]; setKV(gKey, fKey, updated); };
                            
                            // Logic upload ảnh kèm checkbox
                            const reqField = Array.isArray(field.requiredFields) ? field.requiredFields.find((r) => r.type === 'image' && r.condition === 'hasSelection') : null;
                            const pendingKey2 = `${indicator.id}::${gKey}::${fKey}::${opt}`;
                            const previews = getPending(pendingKey2);
                            const handleFilesChange = (e) => {
                              const selected = Array.from(e.target.files || []);
                              if (!selected.length) return;
                              const newPreviews = selected.map(makePreviewItem);
                              const updated = [...previews, ...newPreviews];
                              setPending(pendingKey2, updated);
                              setKV(gKey, `${fKey}__${opt}__images`, updated);
                            };
                            const handleRemoveFile = (i) => {
                              const updated = previews.filter((_, j) => j !== i);
                              setPending(pendingKey2, updated);
                              setKV(gKey, `${fKey}__${opt}__images`, updated);
                            };

                            return (
                              <Box key={`${keyId}-opt-${idx}`} sx={{ mb: 1 }}>
                                <FormControlLabel control={<Checkbox size="small" checked={checked} onChange={toggle} />} label={opt} />
                                {checked && reqField && (
                                  <Stack spacing={1} sx={{ ml: 4, mt: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">{reqField.description || 'Tải ảnh'}</Typography>
                                    <Button variant="outlined" component="label" size="small" sx={{ width: 'fit-content' }}>
                                      Tải ảnh <input hidden multiple accept="image/*" type="file" onChange={handleFilesChange} />
                                    </Button>
                                    {previews.length > 0 && (
                                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
                                        {previews.map((item, i) => (
                                          <Box key={`${keyId}-prev-${idx}-${i}`} sx={{ position: 'relative' }}>
                                            <Box component="img" src={item.src} alt={item.name} onClick={() => onOpenPreview && onOpenPreview(item.src)} sx={{ width: 70, height: 70, borderRadius: 1, border: '1px solid #ccc', objectFit: 'cover', cursor: 'zoom-in' }} />
                                            <IconButton size="small" onClick={() => handleRemoveFile(i)} sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' } }}><CloseIcon fontSize="small" /></IconButton>
                                          </Box>
                                        ))}
                                      </Stack>
                                    )}
                                  </Stack>
                                )}
                              </Box>
                            );
                          })}
                        </FormGroup>
                      </Box>
                    );
                  }

                  // --- XỬ LÝ IMAGE ---
                  if (field.type === 'image') {
                    const previews = getPending(pendingKey);
                    const handleFilesChange = (e) => {
                      const selected = Array.from(e.target.files || []);
                      if (!selected.length) return;
                      const nextCount = previews.length + selected.length;
                      if (nextCount > MAX_IMAGES_PER_FIELD) { alert(`Tải ảnh ${MAX_IMAGES_PER_FIELD} ảnh cho trang này.`); return; }
                      const newPreviews = selected.map(makePreviewItem);
                      const updated = [...previews, ...newPreviews];
                      setPending(pendingKey, updated);
                      setKV(gKey, fKey, updated);
                    };
                    const handleRemoveFile = (index) => {
                      const updated = previews.filter((_, i) => i !== index);
                      setPending(pendingKey, updated);
                      setKV(gKey, fKey, updated);
                    };
                    // Use effect để sync lúc mount nếu cần thiết (đã có trong logic cũ)
                    
                    return (
                      <Stack key={keyId} spacing={1} alignItems="flex-start">
                        <Typography variant="subtitle2">{fKey}</Typography>
                        <Button variant="outlined" component="label" size="small">Tải ảnh <input hidden multiple accept="image/*" type="file" onChange={handleFilesChange} /></Button>
                        {previews.length > 0 && (
                          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                            {previews.map((item, i) => (
                              <Box key={`${keyId}-prev-${i}`} sx={{ position: 'relative' }}>
                                <Box component="img" src={item.src} alt={item.name} onClick={() => onOpenPreview && onOpenPreview(item.src)} sx={{ width: 80, height: 80, borderRadius: 1, border: '1px solid #ccc', objectFit: 'cover', cursor: 'zoom-in' }} />
                                <IconButton size="small" onClick={() => handleRemoveFile(i)} sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' } }}><CloseIcon fontSize="small" /></IconButton>
                              </Box>
                            ))}
                          </Stack>
                        )}
                        <Typography variant="caption" color="text.secondary">{previews.length}/{MAX_IMAGES_PER_FIELD} ảnh</Typography>
                      </Stack>
                    );
                  }

                  // Default Fallback
                  return <Typography key={keyId} color="error">Loại custom không được hỗ trợ: {field.type}</Typography>;
                })}
              </Stack>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}, (prev, next) => prev.indicator?.id === next.indicator?.id && prev.value === next.value);
function ControlLevelRenderer({ indicator, value, onChange }) {
  // 1. Lấy danh sách fields từ JSON cấu hình
  const groupConfig = indicator.valueOptions?.group?.[0] || {};
  const fields = groupConfig.fields || [];

  // 2. Lấy giá trị hiện tại từ state
  // Lưu ý: Dữ liệu câu hỏi này thường lưu dưới dạng { "Mức độ kiểm soát bệnh": { "Label câu hỏi": "Giá trị" } }
  // Hoặc nếu không có group name thì là { "": { ... } }
  const groupName = groupConfig.name || ""; 
  const currentValues = value?.value?.[groupName] || {};

  // Helper: Lấy điểm số từ chuỗi đáp án (VD: "3 - Tốt" -> lấy 3)
  const getScore = (valStr) => {
    if (!valStr) return 0;
    const numberPart = valStr.split(' ')[0]; // Lấy phần tử đầu tiên trước dấu cách
    return parseInt(numberPart, 10) || 0;
  };

  // Helper: Tính tổng điểm cho một nhóm câu hỏi
  const calculateTotal = (questionLabels, currentData) => {
    return questionLabels.reduce((sum, label) => {
      return sum + getScore(currentData[label]);
    }, 0);
  };

  // 3. Xử lý khi người dùng thay đổi 1 câu hỏi con
  const handleChange = (changedLabel, changedValue) => {
    // Tạo bản sao dữ liệu mới
    const nextValues = { ...currentValues, [changedLabel]: changedValue };

    // --- LOGIC TÍNH ĐIỂM TỰ ĐỘNG ---
    
    // A. Xác định các câu hỏi thuộc UCT (4 câu đầu tiên sau field UCT)
    // Dựa vào JSON: Index 0 là UCT, Index 1-4 là câu hỏi UCT
    const uctQuestionLabels = fields.slice(1, 5).map(f => f.label);
    const uctTotal = calculateTotal(uctQuestionLabels, nextValues);
    
    // B. Xác định các câu hỏi thuộc ACT (4 câu cuối sau field ACT)
    // Dựa vào JSON: Index 5 là ACT, Index 6-9 là câu hỏi ACT
    const actQuestionLabels = fields.slice(6, 10).map(f => f.label);
    const actTotal = calculateTotal(actQuestionLabels, nextValues);

    // C. Cập nhật giá trị tổng vào field UCT và ACT
    // (Chỉ cập nhật nếu field UCT/ACT tồn tại trong cấu hình)
    if (fields[0]?.label === "UCT") {
        nextValues["UCT"] = uctTotal; 
    }
    if (fields[5]?.label === "ACT") {
        nextValues["ACT"] = actTotal;
    }

    // 4. Gửi dữ liệu đã tính toán ra ngoài
    onChange({
      value: {
        ...value?.value,
        [groupName]: nextValues
      },
      note: ''
    });
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        {indicator.name}
      </Typography>

      <Stack spacing={2}>
        {fields.map((field, index) => {
          const isScoreField = field.label === "UCT" || field.label === "ACT";
          const val = currentValues[field.label] ?? "";

          // Render ô Tổng điểm (UCT / ACT) - Read Only
          if (isScoreField) {
            return (
              <TextField
                key={index}
                label={field.label}
                value={val} // Giá trị này được tính tự động
                variant="filled"
                size="small"
                InputProps={{ 
                    readOnly: true, 
                    sx: { fontWeight: 'bold', color: 'primary.main' } 
                }}
                helperText={field.description}
              />
            );
          }

          // Render các câu hỏi lựa chọn
          if (field.type === 'selection') {
            return (
              <Box key={index} sx={{ pl: 2, borderLeft: '2px solid #eee' }}>
                <ClearableSelect
                  label={field.label}
                  value={val}
                  options={field.options}
                  onChange={(newVal) => handleChange(field.label, newVal)}
                />
              </Box>
            );
          }

          return null;
        })}
      </Stack>
    </Paper>
  );
}

function CustomTableRenderer({ indicator, value, onChange }) {
  // 1. Parse cấu hình từ JSON (Indicator 99)
  // JSON của bạn: valueOptions -> group (Array) -> phần tử 0 -> fields
  const groups = indicator.valueOptions?.group || [];
  const fields = groups[0]?.fields || []; // Lấy danh sách field từ group đầu tiên

  // 2. Lấy giá trị hiện tại (Value đang lưu dạng Object: { "Chỉ số WBC": "5", ... })
  const currentValues = value?.value || {};

  // 3. Hàm update dữ liệu
  const handleChange = (fieldLabel, newVal) => {
    // Clone data cũ và cập nhật field đang sửa
    const nextValues = { ...currentValues, [fieldLabel]: newVal };
    
    onChange({
      value: nextValues,
      note: ''
    });
  };

  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      <Typography variant="subtitle1" fontWeight="bold">
        {indicator.name}
      </Typography>

      <Paper variant="outlined" sx={{ p: 0, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Chỉ số</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '120px' }}>Kết quả</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Đơn vị</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Tiêu chuẩn</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.map((field, index) => {
              // Lấy giá trị hiện tại
              const val = currentValues[field.label] ?? "";
              
              // Tạo chuỗi hiển thị min-max (Ví dụ: 4 - 10)
              let standard = "";
              if (field.minValue !== undefined && field.maxValue !== undefined) {
                standard = `${field.minValue} - ${field.maxValue}`;
              } else if (field.maxValue !== undefined) {
                standard = `< ${field.maxValue}`;
              } else if (field.minValue !== undefined) {
                standard = `> ${field.minValue}`;
              }

              return (
                <TableRow key={index} hover>
                  <TableCell>{field.label}</TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      variant="outlined"
                      fullWidth
                      type="number"
                      placeholder="..."
                      value={val}
                      onChange={(e) => handleChange(field.label, e.target.value)}
                      sx={{ 
                        '& .MuiInputBase-input': { py: 0.5, px: 1 } 
                      }}
                    />
                  </TableCell>
                  <TableCell>{field.unit || ""}</TableCell>
                  <TableCell>{standard}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}

function EpisodeInfoRenderer({ indicator, value, onChange }) {
  // Lấy toàn bộ data dạng phẳng { key: value }
  const currentData = value?.value || {};

  // Hàm update data chung
  const handleUpdate = (key, val) => {
    onChange({
        value: { ...currentData, [key]: val },
        note: ''
    });
  };

  // --- Logic Group 0 (Đợt này) ---
  const historyKey = "Đợt này_Trước đây bạn đã từng bị đợt nào tương tự như vậy chưa?";
  const historyVal = currentData[historyKey];
  const showHistoryCount = historyVal === 'Có';

  const countKey = "Đợt này_Số đợt bị tương tự như đợt này";
  const countVal = currentData[countKey]; // "1 đợt", "2 đợt"...
  
  // Tính số đợt cần render thêm
  let subCount = 0;
  if (showHistoryCount) {
      if (countVal === '1 đợt') subCount = 1;
      if (countVal === '2 đợt') subCount = 2;
      if (countVal === '3 đợt') subCount = 3;
  }

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom dangerouslySetInnerHTML={{ __html: indicator.name }} />
      
      {/* 1. Form Đợt chính (Luôn hiển thị) */}
      <EpisodeSingleForm 
        title="Đợt này" 
        prefixKey="Đợt này"
        data={currentData}
        onChange={handleUpdate}
        isMainEpisode={true}
      />

      {/* 2. Trigger Lịch sử (Luôn render trong DOM) */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderColor: 'primary.light', bgcolor: '#f0f7ff' }}>
        <Stack spacing={2}>
            <ClearableSelect
                name="main_history_trigger"
                label="Trước đây bạn đã từng bị đợt nào tương tự như vậy chưa?"
                value={historyVal}
                options={['Có', 'Không']}
                onChange={(v) => handleUpdate(historyKey, v)}
            />

            {/* Render nhưng ẩn nếu chưa chọn Có */}
            <ClearableSelect
                hidden={!showHistoryCount}
                name="main_count_trigger"
                label="Số đợt bị tương tự như đợt này"
                value={countVal}
                options={['1 đợt', '2 đợt', '3 đợt']}
                onChange={(v) => handleUpdate(countKey, v)}
            />
        </Stack>
      </Paper>

      {/* 3. Render các đợt phụ */}
      {/* Lưu ý: Với các đợt phụ này, ta có thể dùng điều kiện render mảng 
          vì việc thêm bớt số đợt là hành động lớn, render lại không sao. 
          Vấn đề chính nằm ở các radio button bên trong form. */}
      {Array.from({ length: subCount }).map((_, i) => (
        <EpisodeSingleForm
            key={i}
            title={`Thông tin đợt ${i + 1}`}
            prefixKey={`Đợt ${i + 1}`} 
            data={currentData}
            onChange={handleUpdate}
        />
      ))}
    </Box>
  );
}

function Q4MultiSelect({ indicator, value, onChange }) {
  const arr = Array.isArray(value?.value) ? value.value : [];
  const baseTwo = ['Một cách ngẫu nhiên', 'Khi có các yếu tố kích thích'];
  const showExtra = arr.includes('Khi có các yếu tố kích thích');
  const list = showExtra ? indicator.valueOptions : indicator.valueOptions.filter((o) => baseTwo.includes(o));
  const toggle = (opt) => {
    const current = Array.isArray(value?.value) ? value.value : [];
    const updated = current.includes(opt) ? current.filter((v) => v !== opt) : [...current, opt];
    onChange({ value: updated, note: '' });
  };
  return (
    <FormGroup>
      {list.map((opt, i) => {
        const checked = arr.includes(opt);
        return (
          <FormControlLabel key={`q4-${i}`} control={<Checkbox size="small" checked={checked} onChange={() => toggle(opt)} />} label={opt} />
        );
      })}
    </FormGroup>
  );
}

const QuestionRendererMUI = React.memo(function QuestionRendererMUI({
  indicator,
  value,
  onChange,
  onOpenPreview,
  groupLabelMap
}) {
  if (EPISODE_IDS.has(indicator.id) || EPISODE_CODES.has(indicator.code)) {
    return <EpisodeInfoRenderer indicator={indicator} value={value} onChange={onChange} groupLabelMap={groupLabelMap} />;
  }

  if (Q4_IDS.has(indicator.id) && indicator.valueType === 'multi_selection') {
    return (
      <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
        <Typography
          variant="subtitle1"
          gutterBottom
          fontWeight="bold"
          component="div"
          dangerouslySetInnerHTML={{ __html: indicator.name }}
        />
        <Q4MultiSelect indicator={indicator} value={value} onChange={onChange} />
      </Paper>
    );
  }

  const handleTextChange = (e) => onChange({ value: e.target.value, note: '' });
  const handleNumberChange = (e) => onChange({ value: e.target.value === '' ? '' : Number(e.target.value), note: '' });
  const pendingKey = `${indicator.id}`;

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
      <Typography
        variant="subtitle1"
        gutterBottom
        fontWeight="bold"
        component="div"
        dangerouslySetInnerHTML={{ __html: indicator.name }}
      />
      {(() => {
        switch (indicator.valueType) {
          case 'text':
            return <TextField fullWidth label="Câu trả lời" value={value?.value ?? ''} onChange={handleTextChange} />;
          case 'number':
            return <TextField fullWidth label="Câu trả lời" type="number" inputProps={{ step: 'any' }} value={value?.value ?? ''} onChange={handleNumberChange} />;
          case 'full_date':
            return (
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  format="DD/MM/YYYY"
                  value={value?.value ? dayjs(value.value, 'DD/MM/YYYY') : null}
                  onChange={(newVal) => {
                    const formatted = newVal ? dayjs(newVal).format('DD/MM/YYYY') : '';
                    onChange({ value: formatted, note: '' });
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'medium',
                    },
                  }}
                />
              </LocalizationProvider>
            );

          case 'selection':
            return <ClearableSelect label="Chọn một đáp án" value={value?.value ?? ''} options={indicator.valueOptions || []} onChange={(v) => onChange({ value: v, note: '' })} />;
          case 'multi_selection':
            return <ClearableMultiSelect label="Chọn nhiều đáp án" value={value?.value || []} options={indicator.valueOptions || []} onChange={(v) => onChange({ value: v, note: '' })} />;
          case 'image': {
            const previews = getPending(pendingKey);
            const handleFilesChange = (e) => {
              const selected = Array.from(e.target.files || []);
              if (!selected.length) return;
              const nextCount = previews.length + selected.length;
              if (nextCount > MAX_IMAGES_PER_FIELD) { alert(`Tải ảnh ${MAX_IMAGES_PER_FIELD} ảnh cho câu này`); return; }
              const newPreviews = selected.map(makePreviewItem);
              const updated = [...previews, ...newPreviews];
              setPending(pendingKey, updated);
              onChange({ value: updated, note: '' });
            };
            const handleRemoveFile = (index) => {
              const updated = previews.filter((_, i) => i !== index);
              setPending(pendingKey, updated);
              onChange({ value: updated, note: '' });
            };
            useEffect(() => {
              if (!Array.isArray(value?.value)) onChange({ value: previews, note: '' });
            }, []);
            return (
              <Stack spacing={1} alignItems="flex-start">
                <Button variant="outlined" component="label" size="small" aria-label="Tải ảnh">
                  Tải ảnh
                  <input hidden multiple accept="image/*" type="file" onChange={handleFilesChange} />
                </Button>
                {previews.length > 0 && (
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                    {previews.map((item, i) => (
                      <Box key={`img-prev-${i}`} sx={{ position: 'relative' }}>
                        <Box component="img" src={item.src} alt={item.name} onClick={() => onOpenPreview && onOpenPreview(item.src)} sx={{ width: 80, height: 80, borderRadius: 1, border: '1px solid #ccc', objectFit: 'cover', cursor: 'zoom-in' }} />
                        <IconButton size="small" onClick={() => handleRemoveFile(i)} aria-label={`Xóa ảnh ${item.name}`} sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' } }}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>
                )}
                <Typography variant="caption" color="text.secondary">{previews.length}/{MAX_IMAGES_PER_FIELD} ảnh</Typography>
              </Stack>
            );
          }
          case 'custom':
            return <GenericCustomRenderer indicator={indicator} value={value} onChange={onChange} onOpenPreview={onOpenPreview} groupLabelMap={groupLabelMap} />;
          default:
            return <Typography color="error">Loại câu hỏi không được hỗ trợ {indicator.valueType}</Typography>;
        }
      })()}
    </Paper>
  );
}, (prev, next) => prev.indicator?.id === next.indicator?.id && prev.value === next.value);

export function RecordDetailView() {
  const router = useRouter();
  const params = useParams();
  const templateIdFromUrl = params.templateID;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [vitalGroups, setVitalGroups] = useState([]);
  const [staffProfile, setStaffProfile] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [initialErrors, setInitialErrors] = useState({ patientId: '', diagnosis: '', symptoms: '' });
  const [snackMsg, setSnackMsg] = useState('');
  const [openPatientDialog, setOpenPatientDialog] = useState(false);
  const [patientNameDisplay, setPatientNameDisplay] = useState('');
  const [previewSrc, setPreviewSrc] = useState(null);
  const [uploadProgressMap, setUploadProgressMap] = useState({});
  const updateProgress = (key, pct) => setUploadProgressMap((m) => ({ ...m, [key]: pct }));

  const [selectedQ192, setSelectedQ192] = useState(null);
  const [selectedQ62, setSelectedQ62] = useState(null);
  const isAcuteTemplate = parseInt(templateIdFromUrl, 10) === 16;
  const isChronic1Template = parseInt(templateIdFromUrl, 10) === 17;

  const [groupLabelMap, setGroupLabelMap] = useState({});

  const [formData, setFormData] = useState({
    initialInfo: {
      patientId: '',
      doctorId: null,
      diagnosis: '',
      symptoms: '',
      notes: '',
      templateId: templateIdFromUrl,
      vitalValues: [null]
    },
    vitalValues: {}
  });

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      if (!templateIdFromUrl) { setError('Không tìm thấy ID bệnh án trong URL.'); setLoading(false); return; }
      try {
        if (!cancelled) { setLoading(true); setError(null); }
        const [profileRes, templateRes] = await Promise.all([getStaffProfile(), getMedicalRecordTemplateById(templateIdFromUrl)]);
        if (cancelled) return;

        setStaffProfile(profileRes?.data || null);
        setFormData((prev) => ({
          ...prev,
          initialInfo: { ...prev.initialInfo, doctorId: profileRes?.data?.id ?? null, templateId: templateIdFromUrl }
        }));

        const { vitalGroupIds = [], name = '' } = templateRes?.data || {};
        setTemplateName(name);

        const orderedIds = Array.from(new Set(vitalGroupIds)).filter(Boolean);
        const resGroups = await Promise.all(orderedIds.map(async (id) => {
          try {
            const gr = await getVitalGroupById(id);
            return gr?.data ?? null;
          } catch { return null; }
        }));
        const groups = resGroups.filter(Boolean);
        setVitalGroups(groups);

        const gmap = {};
        groups.forEach((g) => { gmap[g.id] = (g.label && typeof g.label === 'string') ? g.label.trim() : ''; });
        setGroupLabelMap(gmap);

        setSelectedQ192(null);
        setSelectedQ62(null);
      } catch (err) {
        setError(err?.message || 'Không thể tải dữ liệu bệnh án. Vui lòng thử lại.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [templateIdFromUrl]);

  const indicatorMap = useMemo(() => {
    const m = {};
    vitalGroups.forEach((g) => g.indicators?.forEach((ind) => (m[ind.id] = ind)));
    return m;
  }, [vitalGroups]);

  const filteredVitalGroups = useMemo(() => {
    let groups = vitalGroups;
    if (isAcuteTemplate) {
      const allow18 = selectedQ192 === 'Phù mạch' || selectedQ192 === 'Cả hai' || selectedQ192 === 'Khác';
      groups = groups.filter(g => (g.id === 18 ? !!allow18 : true));
    }
    if (isChronic1Template) {
      const allow28 = selectedQ62 === 'Phù mạch' || selectedQ62 === 'Cả hai' || selectedQ62 === 'Khác';
      groups = groups.filter(g => (g.id === 28 ? !!allow28 : true));
    }
    return groups;
  }, [vitalGroups, isAcuteTemplate, selectedQ192, isChronic1Template, selectedQ62]);

  const steps = useMemo(() => [...filteredVitalGroups.map(g => g.name), 'Thông tin bệnh án'], [filteredVitalGroups]);
  useEffect(() => {
    const total = steps.length;
    setActiveStep(prev => (prev >= total ? Math.max(0, total - 1) : prev));
  }, [steps.length]);

  const handleInitialInfoChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      initialInfo: { ...prev.initialInfo, [name]: value }
    }));
    if (initialErrors[name]) setInitialErrors((s) => ({ ...s, [name]: '' }));
  };
  const handleVitalValueChange = useCallback((indicatorId, value) => {
    setFormData((prev) => ({
      ...prev,
      vitalValues: { ...prev.vitalValues, [indicatorId]: value }
    }));
  }, []);

  const validateInitialInfo = () => {
    const diag = formData.initialInfo.diagnosis?.trim() || '';
    const symp = formData.initialInfo.symptoms?.trim() || '';
    const pid = formData.initialInfo.patientId;

    const errs = {
      patientId: pid ? '' : 'Bắt buộc',
      diagnosis: diag.length < 3 ? '+3 kí tự' : '',
      symptoms: symp.length < 3 ? '+3 kí tự' : ''
    };

    setInitialErrors(errs);
    return !errs.patientId && !errs.diagnosis && !errs.symptoms;
  };

  const isNilOrEmpty2 = (v) =>
    v === undefined ||
    v === null ||
    (typeof v === 'string' && v.trim() === '') ||
    (Array.isArray(v) && v.length === 0) ||
    (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);

  const innerOfNormalIndicator = (data) => {
    const inner = data?.value;
    if (isNilOrEmpty2(inner)) return null;
    return inner;
  };

  const innerOfEpisodeQuestion = (indicator, stored) => {
    const groups = Array.isArray(indicator.valueOptions?.group) ? indicator.valueOptions.group : [];
    if (!groups.length) return null;
    const MAIN_LABEL = (groupLabelMap?.[indicator.groupId] || '');
    const raw = stored?.value || {};
    const labelMap = {
        RANGE_LABEL: 'Đợt này: Từ tháng...năm...đến tháng...năm...', // Nhãn gốc cho nhóm chính
        CO_DIEU_TRI: indicator.id === 175 ? 'Đợt bệnh này bạn đã điều trị hay chưa? (1 đợt bệnh liên tục có nghĩa là bị ít nhất 2 ngày/tuần)' : 'Có điều trị hay không?',
        DA_BI_DOT_TUONG_TU: 'Trước đây bạn đã từng bị đợt nào tương tự như vậy chưa?',
        SO_DOT: 'Số đợt bị tương tự như đợt này',
        SO_TUAN: 'Số tuần bị đợt này',
        TEN_THUOC: 'Tên thuốc',
        LIEU_THUOC: 'Liều thuốc (ghi thời gian nếu nhớ)',
        TINH_TRANG: 'Tình trạng tổn thương khi đang uống thuốc',
        TRIEU_CHUNG: 'Triệu chứng Giảm xuống/ Nặng lên là gì?'
    };
    const buildGroup = (obj, isMainGroup = false) => {
        // Tên key trong state cho range (ví dụ: 'Đợt này:start' và 'Đợt này:end')
        const rangePrefix = isMainGroup ? 'Đợt này' : obj['__group_label_for_range_prefix'] || ''; 
        
        // 1. Lấy và gộp Range Date
        const rangeStart = obj[`${rangePrefix}:start`];
        const rangeEnd = obj[`${rangePrefix}:end`];
        const rangeValue = (rangeStart && rangeEnd) ? `${rangeStart} đến ${rangeEnd}` : '';
        
        // 2. Lấy các giá trị còn lại
        const co = obj[labelMap.CO_DIEU_TRI];
        const tt = obj[labelMap.TINH_TRANG];
        const da = obj[labelMap.DA_BI_DOT_TUONG_TU];
        const so = obj[labelMap.SO_DOT];
        const soTuan = obj[labelMap.SO_TUAN];

        const value = {};
        const put = (k, v) => { if (!isNilOrEmpty2(v)) value[k] = v; };
        
        // Đặt Range và Số tuần đã tính (rangeValue là string gộp)
        if (isMainGroup) {
             put(labelMap.RANGE_LABEL, rangeValue);
             put(labelMap.SO_TUAN, soTuan);
        } else {
             // Logic cho đợt con
             const subRangeLabel = groups.find(g => g.label === rangePrefix)?.field?.find(f => f.type === 'range')?.label || rangePrefix;
             put(subRangeLabel, rangeValue);
             put(labelMap.SO_TUAN, soTuan);
        }
        
        put(labelMap.CO_DIEU_TRI, co);
        if (co === 'Có') {
          put(labelMap.TEN_THUOC, obj[labelMap.TEN_THUOC]);
          put(labelMap.LIEU_THUOC, obj[labelMap.LIEU_THUOC]);
          put(labelMap.TINH_TRANG, tt);
          if (tt === 'Giảm xuống' || tt === 'Nặng lên') {
            put(labelMap.TRIEU_CHUNG, obj[labelMap.TRIEU_CHUNG]);
          }
        }
        
        // Chỉ đặt câu hỏi lịch sử đợt bệnh ở nhóm chính
        if (isMainGroup) {
            if (da) put(labelMap.DA_BI_DOT_TUONG_TU, da);
            if (so) put(labelMap.SO_DOT, so);
        }
        return value;
    };
    const main = raw[MAIN_LABEL] || {};
    const result = { [MAIN_LABEL]: buildGroup(main, true) };
    const soDotBiStr = main[labelMap.SO_DOT] || '0 đợt';
    const soDotBi = parseInt(soDotBiStr.split(' ')[0], 10) || 0;
    
    // Xử lý các đợt con
    for (let i = 1; i <= soDotBi; i += 1) {
      const lbl = `Thông tin đợt ${i}`;
      const g = raw[lbl] || {};
      // Gán keyPrefix cho range picker để buildGroup biết cách truy cập date
      g['__group_label_for_range_prefix'] = `Đợt ${i}`; 
      const sub = buildGroup(g, false);
      if (!isNilOrEmpty2(sub)) {
        result[MAIN_LABEL][lbl] = sub;
      }
    }
    
    if (isNilOrEmpty2(result[MAIN_LABEL])) return null;
    return result;
};

  const innerForApi = (indicator, stored) => {
    if (!indicator) return null;
    if (EPISODE_IDS.has(indicator.id) || EPISODE_CODES.has(indicator.code)) {
      return innerOfEpisodeQuestion(indicator, stored);
    }
    return innerOfNormalIndicator(stored);
  };
  const isStepComplete = (stepIdx) => {
    if (stepIdx === steps.length - 1) {
      const { patientId, diagnosis, symptoms } = formData.initialInfo;
      return !!patientId && !!diagnosis?.trim() && !!symptoms?.trim();
    }

    const group = filteredVitalGroups[stepIdx];
    if (!group) return false;

    return group.indicators.every((indicator) => {
      const val = formData.vitalValues[indicator.id];
      const inner = val?.value;
      return inner !== undefined && inner !== null && inner !== '' && !(Array.isArray(inner) && inner.length === 0);
    });
  };
  const handleSelectPatient = (patient) => {
      setFormData((prev) => ({
        ...prev,
        initialInfo: { ...prev.initialInfo, patientId: patient.id }
      }));
      setPatientNameDisplay(patient.fullname);
      setInitialErrors((prev) => ({ ...prev, patientId: '' }));
      setOpenPatientDialog(false);
    };
  const renderStepContent = (stepIdx) => {
    if (stepIdx === steps.length - 1) {
      return (
        <Stack spacing={3}>
          <TextField 
            label="Bệnh nhân" // Label hiển thị
            name="patientId" 
            value={patientNameDisplay || formData.initialInfo.patientId || ''} // Ưu tiên hiện tên, nếu không có thì hiện ID
            onClick={() => setOpenPatientDialog(true)} // Mở dialog khi click
            InputProps={{ 
              readOnly: true, // Không cho sửa tay
              style: { cursor: 'pointer' } // Hiển thị con trỏ tay để biết là click được
            }} 
            required 
            error={Boolean(initialErrors.patientId)} 
            helperText={initialErrors.patientId || "Nhấn để chọn bệnh nhân từ danh sách"}
          />
          <TextField label="Chẩn đoán" name="diagnosis" multiline rows={3} value={formData.initialInfo.diagnosis} onChange={handleInitialInfoChange} required error={Boolean(initialErrors.diagnosis)} helperText={initialErrors.diagnosis} />
          <TextField label="Triệu chứng" name="symptoms" multiline rows={3} value={formData.initialInfo.symptoms} onChange={handleInitialInfoChange} required error={Boolean(initialErrors.symptoms)} helperText={initialErrors.symptoms} />
          <TextField label="Ghi chúº" name="notes" multiline rows={2} value={formData.initialInfo.notes} onChange={handleInitialInfoChange} />
          <TextField label="Mẫu bệnh án" value={{16:'Bệnh án cấp tính',17:'Bệnh án mạn tính lần 1',18:'Bệnh án mạn tính tái khám'}[formData.initialInfo.templateId] || ''} InputProps={{ readOnly: true }} variant="filled" />
          <TextField label="Bác sĩ phụ trách" value={staffProfile?.fullname || ''} InputProps={{ readOnly: true }} variant="filled" />
        </Stack>
      );
    }
    
    const group = filteredVitalGroups[stepIdx];
    if (!group) return null;

    if (isAcuteTemplate && group.id === 12) {
      const q192 = group.indicators.find((i) => i.id === 192);
      const handleQ192Change = (val) => {
        setSelectedQ192(val?.value || null);
        handleVitalValueChange(q192.id, val);
      };
      if (!selectedQ192 || selectedQ192 === 'Phù mạch') {
        return (
          <Stack spacing={2}>
            <QuestionRendererMUI key={q192.id} indicator={q192} value={formData.vitalValues[q192.id]} onChange={handleQ192Change} onOpenPreview={(src) => setPreviewSrc(src)} groupLabelMap={groupLabelMap} />
          </Stack>
        );
      }
      return (
        <Stack spacing={2}>
          {group.indicators.map((indicator) => {
            if (indicator.id === 97) {
              return (
                <ControlLevelRenderer
                  key={indicator.id}
                  indicator={indicator}
                  value={formData.vitalValues[indicator.id]}
                  onChange={(val) => handleVitalValueChange(indicator.id, val)}
                />
              );
          }
            // -----------------------------

            return (
              <QuestionRendererMUI 
                key={indicator.id} 
                indicator={indicator} 
                value={formData.vitalValues[indicator.id]} 
                onChange={(val) => handleVitalValueChange(indicator.id, val)} 
                onOpenPreview={(src) => setPreviewSrc(src)} 
                groupLabelMap={groupLabelMap} 
              />
            );
          })}
        </Stack>
      );
    };

    if (isChronic1Template && group.id === 27) {
      const q62 = group.indicators.find((i) => i.id === 62);
      const others = group.indicators.filter((i) => i.id !== 62);
      const handleQ62Change = (val) => {
        setSelectedQ62(val?.value || null);
        handleVitalValueChange(q62.id, val);
      };
      if (!selectedQ62 || selectedQ62 === 'Phù mạch') {
        return (
          <Stack spacing={2}>
            <QuestionRendererMUI key={q62.id} indicator={q62} value={formData.vitalValues[q62.id]} onChange={handleQ62Change} onOpenPreview={(src) => setPreviewSrc(src)} groupLabelMap={groupLabelMap} />
          </Stack>
        );
      }
      return (
        <Stack spacing={2}>
          <QuestionRendererMUI key={q62.id} indicator={q62} value={formData.vitalValues[q62.id]} onChange={handleQ62Change} onOpenPreview={(src) => setPreviewSrc(src)} groupLabelMap={groupLabelMap} />
          {others.map((i) => (
            <QuestionRendererMUI key={i.id} indicator={i} value={formData.vitalValues[i.id]} onChange={(val) => handleVitalValueChange(i.id, val)} onOpenPreview={(src) => setPreviewSrc(src)} groupLabelMap={groupLabelMap} />
          ))}
        </Stack>
      );
    }
    
    if (group.id === 23) {
      return (
        <LabResultTable
          indicators={group.indicators}
          values={formData.vitalValues}
          onChange={handleVitalValueChange}
        />
      );
    }
    /* if (group.id === 33) {
      const numberIndicators = group.indicators.filter(i => i.valueType === "number");
      const extraIndicators = group.indicators.filter(i => i.valueType !== "number");

      return (
        <LabResultTable
          title="Cận lâm sàng mạn tính - Lần 1"
          indicators={numberIndicators}
          extraQuestions={extraIndicators}
          values={formData.vitalValues}
          onChange={handleVitalValueChange}
        />
      );  
    }    */ 
    return (
      <Stack spacing={2}>
        {group.indicators.map((indicator) => {
          if (indicator.id === 97) {
            return (
              <ControlLevelRenderer
                key={indicator.id}
                indicator={indicator}
                value={formData.vitalValues[indicator.id]}
                onChange={(val) => handleVitalValueChange(indicator.id, val)}
              />
            );
          }
          if (indicator.id === 99){
            return (
              <CustomTableRenderer
                key={indicator.id}
                indicator={indicator}
                value={formData[indicator.id]}
                onChange={(val) => handleVitalValueChange(indicator.id, val)}
              />
            );
          }
          return (
            <QuestionRendererMUI key={indicator.id} indicator={indicator} value={formData.vitalValues[indicator.id]} onChange={(val) => handleVitalValueChange(indicator.id, val)} onOpenPreview={(src) => setPreviewSrc(src)} groupLabelMap={groupLabelMap} />
          );
        })}
      </Stack>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const incompleteSteps = steps
    .slice(0, -1)
    .filter((_, idx) => !isStepComplete(idx));

    if (incompleteSteps.length > 0) {
      const confirmProceed = window.confirm(
        'Còn câu hỏi chưa trả lời. Bạn muốn trả lời hết chứ?\n\nNhấn "OK" để tiếp tục lưu hoặc "Cancel" để quay lại.'
      );
      if (!confirmProceed) {
        setIsSubmitting(false);
        return;
      }
    }
    if (!validateInitialInfo()) {
      setError('Vui lòng nhập đầy đủ Mã bệnh nhân, Chẩn đoán và Triệu chứng.');
      setIsSubmitting(false);
      return;
    }

    try {
      const { patientId, doctorId, diagnosis, symptoms, notes, templateId } = formData.initialInfo;

      const createPayload = {
        patientId: parseInt(patientId, 10),
        doctorId,
        templateId: parseInt(templateId, 10),
        diagnosis,
        symptoms,
        ...(notes ? { notes } : {}),
        vitalValues: [null]
      };

      const createResponse = await createMedicalRecord(createPayload);
      const newId = createResponse.data?.id;
      if (!newId) throw new Error('Không nhận được ID bệnh án sau khi tạo!');

      const groupId = parseInt(patientId, 10) || 0;
      const templateIdNum = parseInt(templateId, 10) || 0;

      const pool = {
        running: 0,
        queue: [],
        next() {
          while (this.running < UPLOAD_CONCURRENCY && this.queue.length) {
            const job = this.queue.shift();
            job && job();
          }
        }
      };

      const resolvedVitalValues = {};
      for (const [id, data] of Object.entries(formData.vitalValues)) {
        if (!data) continue;
        const cloned = JSON.parse(JSON.stringify(data));
        const resolved = {
          ...cloned,
          value: await resolveUploadsDeepConcurrent(cloned.value, groupId, templateIdNum, updateProgress, [id], pool)
        };
        resolvedVitalValues[id] = resolved;
      }

      await new Promise((r) => {
        const tick = () => (pool.running === 0 && pool.queue.length === 0 ? r() : setTimeout(tick, 100));
        tick();
      });

      const formattedVitalValues = [];
      for (const [id, data] of Object.entries(resolvedVitalValues)) {
        const indicator = indicatorMap[Number(id)];
        const inner = innerForApi(indicator, data);
        if (inner === null) continue;
        formattedVitalValues.push({
          vitalIndicatorId: parseInt(id, 10),
          value: { value: inner },
          note: data?.note || ''
        });
      }
      if (formattedVitalValues.length) {
        await updateVitalMedicalRecordById(newId, { vitalValues: formattedVitalValues });
      }

      clearPendingStartsWith(PENDING_PREFIX);

      alert('Tạo bệnh án thành công!!!');
      router.push(`${paths.dashboard.medicalRecordStaff.create}`);
    } catch (err) {

      let msg = 'Đã có lỗi xảy ra khi lưu bệnh án';

      const backendMsg = err?.response?.data?.message || err?.message || '';

      if (
        typeof backendMsg === 'string' &&
        (backendMsg.includes('violates foreign key constraint') ||
        backendMsg.includes('FK_43e2800e756c913a6c7a07cc271'))
      ) {
        msg = 'Mã bệnh nhân không tồn tại trong hệ thống.';
      } else if (backendMsg.includes('500')) {
        msg = 'Máy chủ gặp lỗi. Vui lòng thử lại sau.';
      }

      setError(msg);
    } finally {
      setIsSubmitting(false);
      setUploadProgressMap({});
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ my: 6, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>Đang tải template...</Typography>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => router.push(`${paths.dashboard.medicalRecordStaff.create}`)}>
          Trang chủ
        </Button>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1, textAlign: 'center' }}>
          Tạo bệnh án: {templateName}
        </Typography>
      </Box>

      {Object.keys(uploadProgressMap).length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom aria-live="polite">Đang tải ảnh...</Typography>
          <LinearProgress />
        </Paper>
      )}

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label, i) => {
          const completed = isStepComplete(i);
          return (
            <Step key={`${label}-${i}`} completed={completed}>
              <StepLabel
                error={i < activeStep && !completed}
                onClick={() => setActiveStep(i)}
                sx={{ cursor: 'pointer' }}
              >
                {label}
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, mb: 8 }}>
        <Typography variant="h5" gutterBottom>{steps[activeStep]}</Typography>
        {error && <Alert severity="error" sx={{ mb: 3, mt: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          {renderStepContent(activeStep)}
        </Box>
      </Paper>

      <Paper elevation={6} sx={{ position: 'fixed', left: 0, right: 0, bottom: 0, py: 1.5, px: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', zIndex: (t) => t.zIndex.appBar + 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" disabled={activeStep === 0 || isSubmitting} onClick={() => setActiveStep((p) => p - 1)}>
              Quay lại
            </Button>
          </Stack>
          {activeStep < steps.length - 1 ? (
            <Button variant="contained" onClick={() => setActiveStep((p) => p + 1)}>
              Tiếp theo
            </Button>
          ) : (
            <Button variant="contained" color="success" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Hoàn tất và lưu'}
            </Button>
          )}
        </Box>
      </Paper>

      <Dialog open={Boolean(previewSrc)} onClose={() => setPreviewSrc(null)} maxWidth="md" fullWidth>
        <DialogTitle>Xem ảnh</DialogTitle>
        <DialogContent>
          {previewSrc ? <Box component="img" src={previewSrc} alt="preview" sx={{ width: '100%', borderRadius: 1 }} /> : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewSrc(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(snackMsg)} autoHideDuration={2000} onClose={() => setSnackMsg('')} message={snackMsg} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
      <PatientSelectDialog 
        open={openPatientDialog}
        onClose={() => setOpenPatientDialog(false)}
        onSelect={handleSelectPatient}
      />
    </Container>
  );
}