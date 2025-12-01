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
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import { getMedicalRecordTemplateById } from 'src/api/medical-record-templates-staff';
import { getVitalGroupById } from 'src/api/vitals';
import { createMedicalRecord, updateVitalMedicalRecordById } from 'src/api/medical-record-staff';
import { getPatient } from 'src/api/staff/patient_manage';
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
const SHAPE_IDS = new Set([182, 69]); 

const lsSafeParse = (s, fb) => {
  try { return JSON.parse(s); } catch { return fb; }
};

const calculateWeeks = (start, end) => {
  if (!start || !end || start.isAfter(end)) return '';

  const startDate = start.startOf('month');
  const endDate = end.endOf('month');
  const daysDiff = endDate.diff(startDate, 'day') + 1;

  const weeks = Math.ceil(daysDiff / 7);
  return String(weeks);
};

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

// Thêm component mới vào đâu đó trong file
function UAS7TrackerTable({ value, onChange, indicatorId }) {
  const UAS7_DAYS = useMemo(() => ([
    "Ngày 1", "Ngày 2", "Ngày 3", "Ngày 4", "Ngày 5", "Ngày 6", "Ngày 7"
  ]), []);
  const URTICARIA_SEVERITY_OPTIONS = useMemo(() => ([
    { value: "0", label: "0 - Không ngứa" },
    { value: "1", label: "1 - Ngứa nhẹ, không khó chịu" },
    { value: "2", label: "2 - Ngứa nhiều, khó chịu nhưng chịu được" },
    { value: "3", label: "3 - Ngứa rất nhiều, không thể chịu đựng" },
  ]), []);
  const currentValues = useMemo(() => {
    const data = Array.isArray(value?.value) ? value.value : Array(7).fill({});
    
    // Đảm bảo có đủ 7 phần tử
    return data.length === 7 ? data : Array(7).fill({});
  }, [value]);

  // Các tùy chọn cho Select
  const severityValues = URTICARIA_SEVERITY_OPTIONS.map(opt => opt.value);

  const handleDayChange = useCallback((dayIndex, field, newValue) => {
    const updatedValues = currentValues.map((dayData, i) => {
      if (i === dayIndex) {
        return { ...dayData, [field]: newValue };
      }
      return dayData;
    });

    // 1. Tính toán UAS7 và HSS7
    const uas7 = updatedValues.reduce((sum, item) => sum + (parseInt(item.dot, 10) || 0) + (parseInt(item.phu, 10) || 0), 0);
    const hss7 = updatedValues.reduce((sum, item) => sum + (parseInt(item.phu, 10) || 0), 0);
    
    // 2. Cập nhật state nội bộ và prop value
    onChange({ 
      value: updatedValues, 
      note: `UAS7: ${uas7}, HSS7: ${hss7}` // Lưu kết quả vào note
    });

  }, [currentValues, onChange]);

  // Hiển thị UAS7/HSS7 dưới dạng tổng
  const totalUAS7 = currentValues.reduce((sum, item) => sum + (parseInt(item.dot, 10) || 0) + (parseInt(item.phu, 10) || 0), 0);
  const totalHSS7 = currentValues.reduce((sum, item) => sum + (parseInt(item.phu, 10) || 0), 0);


  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Theo dõi UAS7
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Ngày/tháng/năm</TableCell>
              <TableCell>Ngày</TableCell>
              <TableCell>Điểm mức độ ngứa</TableCell>
              <TableCell>Điểm mức độ sẩn phù (chỉ tính những nốt tự liên không do cào gãi)</TableCell>
              <TableCell>Ghi chú</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {UAS7_DAYS.map((dayLabel, index) => (
              <TableRow key={index}>
                <TableCell sx={{ minWidth: 150 }}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      format="MM/DD/YYYY"
                      value={currentValues[index].date ? dayjs(currentValues[index].date, 'MM/DD/YYYY') : null}
                      onChange={(date) => 
                        handleDayChange(index, 'date', date ? dayjs(date).format('MM/DD/YYYY') : '')
                      }
                      slotProps={{ textField: { size: 'small' } }}
                    />
                  </LocalizationProvider>
                </TableCell>
                
                {/* Cột Ngày 1-7 */}
                <TableCell sx={{ minWidth: 80 }}>{dayLabel}</TableCell>
                
                {/* Cột Điểm mức độ ngứa (dot) */}
                <TableCell sx={{ minWidth: 250 }}>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={currentValues[index].dot ?? ''}
                      onChange={(e) => handleDayChange(index, 'dot', e.target.value)}
                      renderValue={(selected) => {
                        const option = URTICARIA_SEVERITY_OPTIONS.find(o => o.value === selected);
                        return option ? option.label : selected; // Hiển thị nhãn chi tiết
                      }}
                    >
                      {URTICARIA_SEVERITY_OPTIONS.map((opt) => (
                        <MenuItem key={`dot-${index}-${opt.value}`} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
                
                <TableCell sx={{ minWidth: 250 }}>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={currentValues[index].phu ?? ''}
                      onChange={(e) => handleDayChange(index, 'phu', e.target.value)}
                      renderValue={(selected) => {
                        const option = URTICARIA_SEVERITY_OPTIONS.find(o => o.value === selected);
                        return option ? option.label : selected;
                      }}
                    >
                      {URTICARIA_SEVERITY_OPTIONS.map((opt) => (
                        <MenuItem key={`phu-${index}-${opt.value}`} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
                
                {/* Cột Ghi chú */}
                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    value={currentValues[index].note ?? ''}
                    onChange={(e) => handleDayChange(index, 'note', e.target.value)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Stack direction="row" spacing={2} sx={{ mt: 3, maxWidth: 500 }}>
          <TextField 
              label="UAS7 (Tổng điểm Ngứa và Sẩn phù)" 
              value={totalUAS7} 
              InputProps={{ readOnly: true }} 
              sx={{ flex: 1 }}
              variant="filled"
          />
          <TextField 
              label="HSS7 (Tổng điểm Sẩn phù)" 
              value={totalHSS7} 
              InputProps={{ readOnly: true }} 
              sx={{ flex: 1 }}
              variant="filled"
          />
      </Stack>
    </Paper>
  );
}

function normalizeLabName(name) {
  return name
    .replace(/^Chỉ số\s*/i, "")
    .trim();
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

function PatientSearchDialog({ open, onClose, onSelect }) {
  const GENDER_OPTIONS = [
        { value: 'MALE', label: 'Nam' },
        { value: 'FEMALE', label: 'Nữ' },
        { value: 'OTHER', label: 'Khác' },
    ];
  
  const SORTABLE_COLUMNS = ['id', 'fullname', 'createdAt']; 
  
  const DEFAULT_SORT_COLUMN = 'createdAt';
  const DEFAULT_SORT_DIRECTION = 'DESC';
  
  const INITIAL_PARAMS = {
    limit: 10,
    page: 1,
    search: '',
    gender: '',
    phone: '', // Đảm bảo là chuỗi
    identityNumber: '',
    sort: '',
  };
  
  const [currentSort, setCurrentSort] = useState({ 
    column: DEFAULT_SORT_COLUMN, 
    direction: DEFAULT_SORT_DIRECTION 
  });

  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchParams, setSearchParams] = useState(INITIAL_PARAMS);
  const [localSearch, setLocalSearch] = useState(INITIAL_PARAMS);

  const fetchPatients = useCallback(async (params) => {
    setLoading(true);
    try {
      const response = await getPatient({
        limit: params.limit,
        page: params.page,
        search: params.search || undefined,
        gender: params.gender || undefined,
        phone: params.phone || undefined,
        identityNumber: params.identityNumber || undefined,
        sort: params.sort || undefined, 
      });

      setPatients(response.data.data || []); 
      setTotalCount(response.data.total || 0);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách bệnh án:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      const sortParam = (currentSort.column && currentSort.direction)
        ? `${currentSort.column}:${currentSort.direction}`
        : ''; 
      
      setSearchParams((prev) => ({
        ...prev,
        sort: sortParam,
        page: 1, 
      }));
    }
  }, [open, currentSort]);

  useEffect(() => {
    if (open) {
      fetchPatients(searchParams);
    }
  }, [open, searchParams, fetchPatients]);

  const handleLocalChange = (e) => {
    const { name, value } = e.target;
    // Chuyển giá trị thành chuỗi khi lưu, để tránh bị cắt số 0
    setLocalSearch((prev) => ({ ...prev, [name]: String(value) })); 
  };

  const handleApplySearch = (e) => {
    if (e) e.preventDefault();
    let processedPhone = localSearch.phone.trim();
    
    // 2. LOGIC QUAN TRỌNG: Nếu số điện thoại BẮT ĐẦU bằng '0', loại bỏ nó khi gửi API.
    if (processedPhone.startsWith('0')) {
        processedPhone = processedPhone.substring(1); 
    }  
    setSearchParams((prev) => ({
      ...prev,
      page: 1,
      search: localSearch.search,
      gender: localSearch.gender,
      phone: processedPhone, 
      identityNumber: localSearch.identityNumber,
    }));
  };

  const handleChangePage = (event, newPage) => {
    setSearchParams((prev) => ({ ...prev, page: newPage + 1 })); 
  };
  const handleChangeRowsPerPage = (event) => {
    setSearchParams((prev) => ({
      ...prev,
      limit: parseInt(event.target.value, 10),
      page: 1,
    }));
  };
  
  const getSortDirection = (column) => {
    if (currentSort.column === column) {
      return currentSort.direction;
    }
    return false;
  };
  
  const handleSort = (column) => {
    if (!SORTABLE_COLUMNS.includes(column)) {
      return; 
    }

    let newDirection = 'ASC';
    let newColumn = column;

    if (currentSort.column === column) {
        if (currentSort.direction === 'ASC') {
            newDirection = 'DESC';
        } else if (currentSort.direction === 'DESC') {
            newColumn = '';
            newDirection = '';
        }
    } else { 
        newDirection = 'ASC';
    } 
    
    setCurrentSort({ column: newColumn, direction: newDirection });
  };

  const handleRowClick = (patient) => {
    onSelect(patient.id, patient.fullname);
    onClose();
  };
  
  const renderSortIcon = (column) => {
    const direction = getSortDirection(column);
    if (direction === 'ASC') return ' \u25B2'; 
    if (direction === 'DESC') return ' \u25BC'; 
    return '';
  };
  
  const getGenderLabel = (gender) => {
    const option = GENDER_OPTIONS.find(g => g.value === gender);
    return option ? option.label : '—';
  };
  
  // HÀM MỚI: Định dạng số điện thoại cho mục đích hiển thị
  // Giữ lại logic format để hiển thị số 0 nếu DB trả về thiếu 
  const formatPhoneNumber = (phone) => {
    if (!phone) return '—';
    const phoneStr = String(phone).trim();
    // Kiểm tra nếu số điện thoại có độ dài 9 hoặc 10 chữ số và không bắt đầu bằng '0'
    if (phoneStr.length >= 9 && phoneStr.length <= 10 && !phoneStr.startsWith('0')) {
        return '0' + phoneStr;
    }
    return phoneStr;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Tìm kiếm và Chọn Bệnh nhân</Typography>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers sx={{ minHeight: 400 }}>
        {/* === Thanh Filter được bọc trong <form> để bắt sự kiện Enter === */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }} component="form" onSubmit={handleApplySearch}>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            {/* 1. Tìm kiếm theo Tên */}
            <TextField
              size="small"
              label="Tìm kiếm theo Tên"
              name="search"
              value={localSearch.search}
              onChange={handleLocalChange}
              sx={{ minWidth: 200 }}
            />
            
            {/* 2. Lọc theo Giới tính */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Giới tính</InputLabel>
              <Select
                name="gender"
                label="Giới tính"
                value={localSearch.gender}
                onChange={handleLocalChange}
              >
                <MenuItem value="">Tất cả</MenuItem>
                {GENDER_OPTIONS.map((g) => (
                  <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* 3. Tìm theo SĐT (Sử dụng type="tel" an toàn hơn type="number") */}
            <TextField
              size="small"
              label="Tìm theo SĐT"
              name="phone"
              type="tel" // Quan trọng: type="tel" cho phép nhập số 0 ở đầu
              value={localSearch.phone}
              onChange={handleLocalChange}
            />
            
            {/* 4. Tìm theo CMND/CCCD */}
            <TextField
              size="small"
              label="Tìm theo CMND/CCCD"
              name="identityNumber"
              value={localSearch.identityNumber}
              onChange={handleLocalChange}
            />
            
            {/* 5. Nút ÁP DỤNG BỘ LỌC */}
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleApplySearch} 
              disabled={loading}
              type="submit" 
            >
              Áp dụng bộ lọc
            </Button>
          </Stack>
        </Paper>
        {/* === Bảng Kết quả === */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell 
                    onClick={() => handleSort('id')} 
                    sx={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    ID {renderSortIcon('id')}
                  </TableCell>
                  <TableCell 
                    onClick={() => handleSort('fullname')} 
                    sx={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Họ tên {renderSortIcon('fullname')}
                  </TableCell>
                  <TableCell>Giới tính</TableCell>
                  <TableCell>Ngày sinh</TableCell>
                  <TableCell>CMND/CCCD</TableCell>
                  <TableCell>Số điện thoại</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {patients.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center">Không tìm thấy bệnh nhân nào.</TableCell></TableRow>
                ) : (
                  patients.map((patient) => (
                    <TableRow
                      key={patient.id}
                      onClick={() => handleRowClick(patient)}
                      hover
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{patient.id}</TableCell>
                      <TableCell>{patient.fullname}</TableCell>
                      <TableCell>{getGenderLabel(patient.gender) || '—'}</TableCell>
                      <TableCell>{patient.birthday ? dayjs(patient.birthday).format('DD/MM/YYYY') : '—'}</TableCell>
                      <TableCell>{patient.identityNumber || '—'}</TableCell>
                      <TableCell>{formatPhoneNumber(patient.phone)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <TablePagination
          component="div"
          count={totalCount}
          page={searchParams.page - 1} 
          onPageChange={handleChangePage}
          rowsPerPage={searchParams.limit}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage="Số dòng/trang:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} trong ${count}`}
        />
      </DialogActions>
    </Dialog>
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

function ClearableSelect({ label, value, options = [], onChange, name }) {
  return (
    <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ mt: 1 }}>
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
        aria-label="Xóa lựa chọn"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(''); }}
        disabled={!value}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
}


function ClearableMultiSelect({ label, value, options = [], onChange }) {
  const arr = Array.isArray(value) ? value : [];
  const toggle = (opt) => {
    if (arr.includes(opt)) onChange(arr.filter((v) => v !== opt));
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
              control={<Checkbox size="small" checked={arr.includes(opt)} onChange={() => toggle(opt)} />}
              label={opt}
            />
          ))}
        </FormGroup>
      </Box>
      {arr.length ? (
        <IconButton size="small" aria-label="Xóa táº¥t cáº£" onClick={() => onChange([])}>
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
    const raw = indicator.valueOptions?.group;
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.fields)) return [raw];
    return [];
  })();

  const setKV = (g, k, v) => {
    const current = value?.value || {};
    onChange({ value: { ...current, [g]: { ...(current[g] || {}), [k]: v } }, note: '' });
  };

  const isShapeThis = SHAPE_IDS.has(indicator.id);
  const isDurationThis = Q11_IDS.has(indicator.id);
  const isConditionalTextThis = CONDITIONAL_TEXT_IDS.has(indicator.id);
  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
      <Box sx={{ borderLeft: 3, borderColor: 'divider', pl: 2 }}>
        {groups.map((group, gi) => {
          const gKeyFromApi = groupLabelMap?.[indicator.groupId] || '';
          const gKey = gKeyFromApi;
          const fields = group.field || group.fields || [];
          const gVal = value?.value?.[gKey] || {};
          const renderedFieldLabels = new Set();
          return (
            <Box key={`${gKey || ''}_${gi}`} sx={{ '&:not(:first-of-type)': { mt: 2 } }}>
              {(gKey || '').trim() !== '' && <Typography variant="subtitle2" gutterBottom>{gKey}</Typography>}
              <Stack spacing={2}>
                {fields.map((field, fi) => {
                  const fKeyRaw = field.label || ``;
                  const fKey = fKeyRaw === '' ? '_select_' : fKeyRaw;
                  if (renderedFieldLabels.has(fKey)) return null;
                  const fVal = gVal[fKey];
                  const options = field.option || field.options || [];
                  const fieldId = field.id ?? fi;
                  const keyId = `${indicator.id}-${gKey || ''}-${fKey}-${fieldId}`;
                  const pendingKey = `${indicator.id}::${gKey}::${fKey}`;
                  const isQ5This = Q5_IDS.has(indicator.id);
                  const handleText = (e) => setKV(gKey, fKey, e.target.value);
                  const handleNumber = (e) => setKV(gKey, fKey, e.target.value === '' ? '' : Number(e.target.value));
                  const handleSelect = (v) => setKV(gKey, fKey, v);

                  if (isShapeThis && field.label && field.label.toLowerCase().includes('mô tả hình dạng khác')) {
                    return null;
                  }
                  if (isDurationThis && field.label === 'Nhập khoảng thời gian') {
                    return null;
                  }
                  if (isConditionalTextThis && field.label === 'Số lần bị khó thở' && field.type === 'text') {
                        return null; 
                  }
                  if (isQ5This && field.label) {
                    const lower = field.label.toLowerCase();
                    if (lower.includes('chi tiết thức ăn') || lower.includes('chi tiết thuốc')) {
                      return null;
                    }
                  }

                  if (field.type === 'text') {
                    return (
                      <TextField key={keyId} size="small" fullWidth label={fKey} value={fVal ?? ''} onChange={handleText} />
                    );
                  }

                  if (field.type === 'number') {
                    return (
                      <TextField key={keyId} size="small" fullWidth type="number" inputProps={{ step: 'any' }} label={fKey} value={fVal ?? ''} onChange={handleNumber} />
                    );
                  }

                  if (field.type === 'select') {
                    if (isDurationThis && (fKey === '11.1 Khi dùng thuốc' || fKey === '11.2 Khi không dùng thuốc')) {
                      return (
                        <Box key={keyId}>
                          <ClearableSelect label={fKey} value={fVal ?? ''} options={options} onChange={handleSelect} />
                          {fVal === 'Khác (theo giờ)' && (
                            <Box sx={{ mt: 1 }}>
                              <TextField
                                key={`${keyId}-other-hours`}
                                size="small"
                                fullWidth
                                label="Nhập khoảng thời gian"
                                value={gVal[`${fKey} - Khác (theo giờ)`] || ''}
                                onChange={(e) => setKV(gKey, `${fKey} - Khác (theo giờ)`, e.target.value)}
                              />
                            </Box>
                          )}
                        </Box>
                      );
                    }
                  if (isDurationThis && (fKey.includes('4.1') || fKey.includes('4.2'))) {
                        const otherInputField = fields.find(f => f.label === 'Nhập khoảng thời gian' && f.type === 'text');
                        const otherInputKey = otherInputField ? 'Nhập khoảng thời gian' : `${fKey} - Khác (theo giờ)`; // Dùng nhãn chính thức nếu có, hoặc dùng key tạm nếu không tìm thấy (giống logic cũ)
                        
                        return (
                            <Box key={keyId}>
                              <ClearableSelect label={fKey} value={fVal ?? ''} options={options} onChange={handleSelect} />
                              {fVal === 'Khác (theo giờ)' && (
                                <Box sx={{ mt: 1 }}>
                                  <TextField
                                    key={`${keyId}-other-hours`}
                                    size="small"
                                    fullWidth
                                    label="Nhập khoảng thời gian"
                                    value={gVal[otherInputKey] || ''}
                                    onChange={(e) => setKV(gKey, otherInputKey, e.target.value)}
                                  />
                                </Box>
                              )}
                            </Box>
                        );
                    }
                  if (isConditionalTextThis && fKey === '_select_') {
                        const selectedOption = gVal[fKey];
                        const textControl = fields.find((f, index) => index > fi && f.label === 'Số lần bị khó thở' && f.type === 'text');
                        const textKey = textControl?.label;
                        if (textKey) renderedFieldLabels.add(textKey); 
                        
                        // Cập nhật hàm xử lý chọn
                        const handleConditionalSelect = (v) => {
                            setKV(gKey, fKey, v); 
                            if (v !== 'Có' && textKey) {
                                setKV(gKey, textKey, '');
                            }
                        };

                        return (
                            <Box key={keyId}>
                                {/* 1. Select chính: Label rỗng để chỉ hiển thị radio buttons */}
                                <ClearableSelect 
                                    label="" 
                                    name={keyId}
                                    value={selectedOption ?? ''} 
                                    options={options} 
                                    onChange={handleConditionalSelect}
                                />
                                {textKey && selectedOption === 'Có' && (
                                    <Box sx={{ mt: 1 }}>
                                        <TextField
                                            key={`${keyId}-conditional-text`}
                                            size="small"
                                            fullWidth
                                            label={textKey}
                                            type="number" 
                                            inputProps={{ step: '1', min: '0' }}
                                            value={gVal[textKey] ?? ''}
                                            onChange={(e) => setKV(gKey, textKey, e.target.value)}
                                        />
                                    </Box>
                                )}
                            </Box>
                        );
                    }
                    return (
                      <Box key={keyId}>
                        <ClearableSelect label={fKey} value={fVal ?? ''} options={options} onChange={handleSelect} />
                      </Box>
                    );
                  }

                  if (field.type === 'multi_selection') {
                    const arr = Array.isArray(fVal) ? fVal : [];
                    if (isQ5This) {
                      const hasFood = arr.includes('Thức ăn');
                      const hasDrug = arr.includes('Chống viêm, giảm đau');

                      const toggle = (opt) => {
                        const updated = arr.includes(opt)
                          ? arr.filter((v) => v !== opt)
                          : [...arr, opt];
                        setKV(gKey, fKey, updated);
                      };

                      const labelsRendered = new Set();

                      return (
                        <Box key={keyId} sx={{ mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                            {fKey || 'Chọn yếu tố làm nặng bệnh'}
                          </Typography>

                          <FormGroup>
                            {['Stress', 'Thức ăn', 'Chống viêm, giảm đau'].map((opt) => (
                              <FormControlLabel
                                key={opt}
                                control={
                                  <Checkbox
                                    size="small"
                                    checked={arr.includes(opt)}
                                    onChange={() => toggle(opt)}
                                  />
                                }
                                label={opt}
                              />
                            ))}
                          </FormGroup>

                          {hasFood &&
                            fields
                              .filter(
                                (fld) =>
                                  fld.label &&
                                  fld.label.toLowerCase().includes('chi tiết thức ăn') &&
                                  !labelsRendered.has(fld.label)
                              )
                              .map((fld) => {
                                labelsRendered.add(fld.label);
                                return (
                                  <TextField
                                    key={fld.label}
                                    size="small"
                                    fullWidth
                                    sx={{ mt: 1 }}
                                    label={fld.label}
                                    placeholder={fld.placeholder || 'Nhập chi tiết thức ăn'}
                                    value={gVal[fld.label] || ''}
                                    onChange={(e) => setKV(gKey, fld.label, e.target.value)}
                                  />
                                );
                              })}

                          {/* ✅ Nếu chọn “Chống viêm, giảm đau” → hiển thị text “Chi tiết thuốc” */}
                          {hasDrug &&
                            fields
                              .filter(
                                (fld) =>
                                  fld.label &&
                                  fld.label.toLowerCase().includes('chi tiết thuốc') &&
                                  !labelsRendered.has(fld.label)
                              )
                              .map((fld) => {
                                labelsRendered.add(fld.label);
                                return (
                                  <TextField
                                    key={fld.label}
                                    size="small"
                                    fullWidth
                                    sx={{ mt: 1 }}
                                    label={fld.label}
                                    placeholder={fld.placeholder || 'Nhập chi tiết thuốc'}
                                    value={gVal[fld.label] || ''}
                                    onChange={(e) => setKV(gKey, fld.label, e.target.value)}
                                  />
                                );
                              })}
                        </Box>
                      );
                    }

                    if (isShapeThis && fKey === 'Chọn hình dạng bạn gặp phải') {
                      const toggleShape = (opt) => {
                        const updated = arr.includes(opt) ? arr.filter((v) => v !== opt) : [...arr, opt];
                        if (!updated.includes('Hình dạng khác')) {
                          setKV(gKey, 'Mô tả hình dạng khác', '');
                        }
                        setKV(gKey, fKey, updated);
                      };
                      const otherSelected = arr.includes('Hình dạng khác');
                      const otherValue = gVal['Mô tả hình dạng khác'] ?? '';

                      return (
                        <Box key={keyId}>
                          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{fKey}</Typography>
                          <FormGroup>
                            {(options || []).map((opt, idx) => (
                              <FormControlLabel
                                key={`${keyId}-opt-${idx}`}
                                control={<Checkbox size="small" checked={arr.includes(opt)} onChange={() => toggleShape(opt)} />}
                                label={opt}
                              />
                            ))}
                          </FormGroup>
                          {otherSelected && (
                            <TextField
                              key={`${keyId}-other-input`}
                              size="small"
                              fullWidth
                              sx={{ mt: 1 }}
                              label="Mô tả hình dạng khác"
                              placeholder="Nhập mô tả"
                              value={otherValue}
                              onChange={(e) => setKV(gKey, 'Mô tả hình dạng khác', e.target.value)}
                            />
                          )}
                        </Box>
                      );
                    }

                    const arrVal = arr;
                    const renderOptions = () => {
                      let list = options;
                      if (Q4_IDS.has(indicator.id) && (fKey.includes('4.') || indicator.id === 190 || indicator.id === 65)) {
                        const baseTwo = ['Một cách ngẫu nhiên', 'Khi có các yếu tố kích thích'];
                        const showExtra = arrVal.includes('Khi có các yếu tố kích thích');
                        list = showExtra ? options : options.filter((o) => baseTwo.includes(o));
                      }
                      return list;
                    };

                    return (
                      <Box key={keyId}>
                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{fKey || 'Chọn'}</Typography>
                        <FormGroup>
                          {renderOptions().map((opt, idx) => {
                            const checked = arrVal.includes(opt);
                            const toggle = () => {
                              const updated = checked ? arrVal.filter((v) => v !== opt) : [...arrVal, opt];
                              setKV(gKey, fKey, updated);
                            };

                            const reqField = Array.isArray(field.requiredFields)
                              ? field.requiredFields.find((r) => r.type === 'image' && r.condition === 'hasSelection')
                              : null;

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
                                <FormControlLabel
                                  control={<Checkbox size="small" checked={checked} onChange={toggle} />}
                                  label={opt}
                                />

                                {checked && reqField && (
                                  <Stack spacing={1} sx={{ ml: 4, mt: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">
                                      {reqField.description || 'Tải ảnh'}
                                    </Typography>
                                    <Button variant="outlined" component="label" size="small" sx={{ width: 'fit-content' }}>
                                      Tải ảnh
                                      <input hidden multiple accept="image/*" type="file" onChange={handleFilesChange} />
                                    </Button>
                                    {previews.length > 0 && (
                                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
                                        {previews.map((item, i) => (
                                          <Box key={`${keyId}-prev-${idx}-${i}`} sx={{ position: 'relative' }}>
                                            <Box
                                              component="img"
                                              src={item.src}
                                              alt={item.name}
                                              onClick={() => onOpenPreview && onOpenPreview(item.src)}
                                              sx={{ width: 70, height: 70, borderRadius: 1, border: '1px solid #ccc', objectFit: 'cover', cursor: 'zoom-in' }}
                                            />
                                            <IconButton
                                              size="small"
                                              onClick={() => handleRemoveFile(i)}
                                              sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'rgba(255,255,255,0.😎', '&:hover': { bgcolor: 'white' } }}
                                            >
                                              <CloseIcon fontSize="small" />
                                            </IconButton>
                                          </Box>
                                        ))}
                                      </Stack>
                                    )}
                                    <Typography variant="caption" color="text.secondary">
                                      {previews.length}/{MAX_IMAGES_PER_FIELD} ảnh
                                    </Typography>
                                  </Stack>
                                )}
                              </Box>
                            );
                          })}
                        </FormGroup>
                      </Box>
                    );
                  }

                  if (field.type === 'image') {
                    const previews = getPending(pendingKey);
                    const handleFilesChange = (e) => {
                      const selected = Array.from(e.target.files || []);
                      if (!selected.length) return;
                      const nextCount = previews.length + selected.length;
                      if (nextCount > MAX_IMAGES_PER_FIELD) {
                        alert(`Tải ảnh${MAX_IMAGES_PER_FIELD} ảnh cho trang này.`);
                        return;
                      }
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
                    useEffect(() => {
                      if (!Array.isArray(fVal)) setKV(gKey, fKey, previews);
                    }, []);
                    return (
                      <Stack key={keyId} spacing={1} alignItems="flex-start">
                        <Typography variant="subtitle2">{fKey}</Typography>
                        <Button variant="outlined" component="label" size="small" aria-label={`Tải ảnh cho ${fKey}`}>
                          Tải ảnh
                          <input hidden multiple accept="image/*" type="file" onChange={handleFilesChange} />
                        </Button>
                        {previews.length > 0 && (
                          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                            {previews.map((item, i) => (
                              <Box key={`${keyId}-prev-${i}`} sx={{ position: 'relative' }}>
                                <Box
                                  component="img"
                                  src={item.src}
                                  alt={item.name}
                                  onClick={() => onOpenPreview && onOpenPreview(item.src)}
                                  sx={{ width: 80, height: 80, borderRadius: 1, border: '1px solid #ccc', objectFit: 'cover', cursor: 'zoom-in' }}
                                />
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveFile(i)}
                                  aria-label={`Xóa ảnh ${item.name}`}
                                  sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'rgba(255,255,255,0.😎', '&:hover': { bgcolor: 'white' } }}
                                >
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
function MonthRangeAndWeekCalculator({ label, keyPrefix, valueObj, setKV, groupKey }) {
  const [startMonth, endMonth] = useMemo(() => {
    const startKey = `${keyPrefix}:start`;
    const endKey = `${keyPrefix}:end`;
    const startVal = valueObj[startKey] ? dayjs(valueObj[startKey], 'MM/YYYY') : null;
    const endVal = valueObj[endKey] ? dayjs(valueObj[endKey], 'MM/YYYY') : null;
    return [startVal, endVal];
  }, [valueObj, keyPrefix]);
  
  const weekCount = useMemo(() => calculateWeeks(startMonth, endMonth), [startMonth, endMonth]);
  
  useEffect(() => {
      const weekKey = keyPrefix.includes('Đợt này') ? 'Số tuần bị đợt này' : 'Số tuần bị đợt này'; 
      if (valueObj[weekKey] !== weekCount) {
          setKV(groupKey, weekKey, weekCount);
      }
  }, [weekCount, groupKey, setKV, keyPrefix, valueObj]);

  const handleDateChange = (type, date) => {
    const key = `${keyPrefix}:${type}`;
    const formatted = date ? dayjs(date).format('MM/YYYY') : '';
    setKV(groupKey, key, formatted);
  };

  const startLabel = label.split('...đến')[0].replace('Đợt này: ', '').replace('Đợt 1: ', '').replace('Đợt 2: ', '').replace('Đợt 3: ', '') + '...năm...';
  const endLabel = label.split('...đến')[1] || '';

  return (
    <Stack spacing={1}>
        <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 'normal' }}>
            {label.replace(/: Từ.*$/g, ':')}
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                    label={`Từ ${startLabel}`}
                    views={['month', 'year']}
                    format="MM/YYYY"
                    value={startMonth}
                    onChange={(date) => handleDateChange('start', date)}
                    slotProps={{ textField: { size: 'small', sx: { flexGrow: 1 } } }}
                />
                <DatePicker
                    label={`Đến ${endLabel}`}
                    views={['month', 'year']}
                    format="MM/YYYY"
                    value={endMonth}
                    onChange={(date) => handleDateChange('end', date)}
                    slotProps={{ textField: { size: 'small', sx: { flexGrow: 1 } } }}
                />
            </LocalizationProvider>
        </Stack>

        <TextField
            size="small"
            label="Số tuần bị đợt này"
            value={weekCount}
            InputProps={{ readOnly: true }}
            sx={{ mt: 1 }}
        />
    </Stack>
  );
}
function EpisodeInfoRenderer({ indicator, value, onChange, groupLabelMap }) {
  const groups = Array.isArray(indicator.valueOptions?.group) ? indicator.valueOptions.group : [];
  if (!groups.length) return null;
  const MAIN_LABEL = groupLabelMap?.[indicator.groupId] || '';
  const valObj = value?.value || {};
  const mainGroup = valObj[MAIN_LABEL] || {};

  const setKV = useCallback((g, k, v) => {
    const current = value?.value || {};
    onChange({ value: { ...current, [g]: { ...(current[g] || {}), [k]: v } }, note: '' });
  }, [onChange, value]);
  
  const labelMap = {
      MAIN_RANGE: 'Đợt này: Từ tháng...năm...đến tháng...năm...',
      MAIN_CO_DIEU_TRI: 'Đợt bệnh này bạn đã điều trị hay chưa? (1 đợt bệnh liên tục có nghĩa là bị ít nhất 2 ngày/tuần)',
      MAIN_DA_BI_DOT_TUONG_TU: 'Trước đây bạn đã từng bị đợt nào tương tự như vậy chưa?',
      MAIN_SO_DOT: 'Số đợt bị tương tự như đợt này',
      TEN_THUOC: 'Tên thuốc',
      LIEU_THUOC: 'Liều thuốc (ghi thời gian nếu nhớ)',
      TINH_TRANG: 'Tình trạng tổn thương khi đang uống thuốc',
      TRIEU_CHUNG: 'Triệu chứng Giảm xuống/ Nặng lên là gì?'
  };

  const fieldsMain = groups[0].field || groups[0].fields || [];
  const opt = (label) => fieldsMain.find((f) => f.label === label)?.option || [];
  const coDieuTri = mainGroup[labelMap.MAIN_CO_DIEU_TRI];
  const tinhTrang = mainGroup[labelMap.TINH_TRANG];
  const daBiDotTuongTu = mainGroup[labelMap.MAIN_DA_BI_DOT_TUONG_TU];
  
  const soDotBiStr = mainGroup[labelMap.MAIN_SO_DOT] || '0 đợt';
  const soDotBi = parseInt(soDotBiStr.split(' ')[0], 10) || 0;

  const renderEpisodeGroup = (group, index) => {
    const gKey = group.label; 
    const groupNum = index; 
    const gVal = valObj[gKey] || {};
    const flds = group.field || group.fields || [];
    const optEp = (label) => flds.find((f) => f.label === label)?.option || [];
    const epCoDieuTri = gVal['Có điều trị hay không?'];
    const epTinhTrang = gVal[labelMap.TINH_TRANG];
    
    const rangeLabel = `rangeField?.label || Đợt ${groupNum}: Từ tháng...năm... đến tháng...năm...`;
    const rangeKeyPrefix = `Đợt ${groupNum}`;
    
    return (
      <Box key={gKey} sx={{ mt: 2, borderLeft: 3, borderColor: 'divider', pl: 2 }}>
        {gKey && <Typography variant="subtitle2" gutterBottom>{gKey}</Typography>}
        <MonthRangeAndWeekCalculator
            label={rangeLabel}
            keyPrefix={rangeKeyPrefix}
            valueObj={gVal}
            setKV={setKV}
            groupKey={gKey}
        />

        {/* 2. Có điều trị hay không? */}
        <ClearableSelect
          label="Có điều trị hay không?"
          value={epCoDieuTri ?? ''}
          options={optEp('Có điều trị hay không?')}
          onChange={(v) => setKV(gKey, 'Có điều trị hay không?', v)}
        />
        
        {epCoDieuTri === 'Có' && (
          <Stack spacing={1} sx={{ mt: 1, ml: 1 }}>
            <TextField size="small" label={labelMap.TEN_THUOC} value={gVal[labelMap.TEN_THUOC] ?? ''} onChange={(e) => setKV(gKey, labelMap.TEN_THUOC, e.target.value)} />
            <TextField size="small" label={labelMap.LIEU_THUOC} value={gVal[labelMap.LIEU_THUOC] ?? ''} onChange={(e) => setKV(gKey, labelMap.LIEU_THUOC, e.target.value)} />
            
            <ClearableSelect
              label={labelMap.TINH_TRANG}
              value={epTinhTrang ?? ''}
              options={optEp(labelMap.TINH_TRANG)}
              onChange={(v) => setKV(gKey, labelMap.TINH_TRANG, v)}
            />
            
            {(epTinhTrang === 'Giảm xuống' || epTinhTrang === 'Nặng lên') && (
              <ClearableSelect
                label={labelMap.TRIEU_CHUNG}
                value={gVal[labelMap.TRIEU_CHUNG] ?? ''}
                options={optEp(labelMap.TRIEU_CHUNG)}
                onChange={(v) => setKV(gKey, labelMap.TRIEU_CHUNG, v)}
              />
            )}
          </Stack>
        )}
      </Box>
    );
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
      <Typography
        variant="subtitle1"
        gutterBottom
        fontWeight="bold"
        component="div"
        dangerouslySetInnerHTML={{ __html: indicator.name }}
      />
      {/* KHỐI CÂU HỎI CHÍNH (MAIN GROUP) */}
      <Box sx={{ borderLeft: 3, borderColor: 'divider', pl: 2 }}>
        <Box>
          {(MAIN_LABEL || '').trim() !== '' && <Typography variant="subtitle2" gutterBottom>{MAIN_LABEL}</Typography>}
          <Stack spacing={2}>
            
            {/* 1. Range Picker & Calculator (MAIN) */}
            <MonthRangeAndWeekCalculator
                label={labelMap.MAIN_RANGE}
                keyPrefix="Đợt này"
                valueObj={mainGroup}
                setKV={setKV}
                groupKey={MAIN_LABEL}
            />

            {/* 2. Đợt bệnh này bạn đã điều trị hay chưa? */}
            <ClearableSelect
              label={labelMap.MAIN_CO_DIEU_TRI}
              value={coDieuTri ?? ''}
              options={opt(labelMap.MAIN_CO_DIEU_TRI)}
              onChange={(v) => setKV(MAIN_LABEL, labelMap.MAIN_CO_DIEU_TRI, v)}
            />
            
            {coDieuTri === 'Có' && (
              <Stack spacing={1} sx={{ ml: 1 }}>
                <TextField size="small" label={labelMap.TEN_THUOC} value={mainGroup[labelMap.TEN_THUOC] ?? ''} onChange={(e) => setKV(MAIN_LABEL, labelMap.TEN_THUOC, e.target.value)} />
                <TextField size="small" label={labelMap.LIEU_THUOC} value={mainGroup[labelMap.LIEU_THUOC] ?? ''} onChange={(e) => setKV(MAIN_LABEL, labelMap.LIEU_THUOC, e.target.value)} />
                <ClearableSelect
                  label={labelMap.TINH_TRANG}
                  value={tinhTrang ?? ''}
                  options={opt(labelMap.TINH_TRANG)}
                  onChange={(v) => setKV(MAIN_LABEL, labelMap.TINH_TRANG, v)}
                />
                {(tinhTrang === 'Giảm xuống' || tinhTrang === 'Nặng lên') && (
                  <ClearableSelect
                    label={labelMap.TRIEU_CHUNG}
                    value={mainGroup[labelMap.TRIEU_CHUNG] ?? ''}
                    options={opt(labelMap.TRIEU_CHUNG)}
                    onChange={(v) => setKV(MAIN_LABEL, labelMap.TRIEU_CHUNG, v)}
                  />
                )}
              </Stack>
            )}
            
            {/* 3. Lịch sử đợt bệnh (Câu hỏi điều kiện) */}
            <Box sx={{ mt: 2 }}>
              <ClearableSelect
                label={labelMap.MAIN_DA_BI_DOT_TUONG_TU}
                value={daBiDotTuongTu ?? ''}
                options={opt(labelMap.MAIN_DA_BI_DOT_TUONG_TU)}
                onChange={(v) => setKV(MAIN_LABEL, labelMap.MAIN_DA_BI_DOT_TUONG_TU, v)}
              />
              {daBiDotTuongTu === 'Có' && (
                <Box sx={{ mt: 1 }}>
                  <ClearableSelect
                    label={labelMap.MAIN_SO_DOT}
                    value={soDotBiStr}
                    options={['1 đợt', '2 đợt', '3 đợt']}
                    onChange={(v) => setKV(MAIN_LABEL, labelMap.MAIN_SO_DOT, v)}
                  />
                </Box>
              )}
            </Box>
          </Stack>
        </Box>
      </Box>
      {/* KHỐI CÂU HỎI ĐỢT CON */}
      {daBiDotTuongTu === 'Có' && Array.isArray(groups) && groups.slice(1, 1 + soDotBi).map((g, i) => renderEpisodeGroup(g, i + 1))}
    </Paper>
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
                        <IconButton size="small" onClick={() => handleRemoveFile(i)} aria-label={`Xóa ảnh ${item.name}`} sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'rgba(255,255,255,0.😎', '&:hover': { bgcolor: 'white' } }}>
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
  const [selectedPatientName, setSelectedPatientName] = useState('');
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
        const UAS7_GROUP_MOCK = {
          id: 9999,
          name: 'Theo dõi UAS7',
          indicators: [
            { 
              id: 999901, // ID chỉ số UAS7
              code: 'UAS7_TRACKER', 
              name: 'Bảng theo dõi UAS7', 
              valueType: 'uas7_tracker', // Loại custom mới
              groupId: 9999
            }
          ]
        };
        let finalGroups = [...groups];
        const targetGroupIdToInsertAfter = 31; 
        const indexToInsert = finalGroups.findIndex(g => g.id === targetGroupIdToInsertAfter);

        if (indexToInsert !== -1) {
            finalGroups.splice(indexToInsert + 1, 0, UAS7_GROUP_MOCK);
        }

        const finalGroupsToSet = isChronic1Template ? finalGroups : groups;
        setVitalGroups(finalGroups);

        const gmap = {};
        finalGroups.forEach((g) => { gmap[g.id] = (g.label && typeof g.label === 'string') ? g.label.trim() : ''; });
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
  const handlePatientSelect = useCallback((id, name) => {
    setFormData((prev) => ({
      ...prev,
      initialInfo: { ...prev.initialInfo, patientId: String(id) }
    }));
    setSelectedPatientName(name);
    setInitialErrors((s) => ({ ...s, patientId: '' }));
  }, []);
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
    if (indicator.code === 'UAS7_TRACKER') {
        const inner = stored?.value;
        if (!Array.isArray(inner) || inner.length === 0) return null;
        return inner; 
    }
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
    if (group.id === 9999) {
        const val = formData.vitalValues[999901];
        return Array.isArray(val?.value) && val.value.length === 7;
    }
    return group.indicators.every((indicator) => {
      const val = formData.vitalValues[indicator.id];
      const inner = val?.value;
      return inner !== undefined && inner !== null && inner !== '' && !(Array.isArray(inner) && inner.length === 0);
    });
  };
  const renderStepContent = (stepIdx) => {
    if (stepIdx === steps.length - 1) {
      return (
        <Stack spacing={3}>
          <Stack direction="row" spacing={1} alignItems="flex-end">
            <TextField
              label="Mã bệnh nhân"
              name="patientId"
              type="number"
              value={formData.initialInfo.patientId}
              onChange={handleInitialInfoChange}
              onClick={() => setOpenPatientDialog(true)}
              required
              error={Boolean(initialErrors.patientId)}
              helperText={initialErrors.patientId || selectedPatientName}
              sx={{ flexGrow: 1 }}
            />
          </Stack>
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
    if (group.id === 9999) {
      const uas7Indicator = group.indicators.find(i => i.code === 'UAS7_TRACKER');
      if (!uas7Indicator) return <Alert severity="error">Không tìm thấy chỉ số UAS7 Tracker.</Alert>;
      
      return (
        <UAS7TrackerTable
          indicatorId={uas7Indicator.id}
          value={formData.vitalValues[uas7Indicator.id]}
          onChange={(val) => handleVitalValueChange(uas7Indicator.id, val)}
        />
      );
    }
    if (isAcuteTemplate && group.id === 12) {
      const q192 = group.indicators.find((i) => i.id === 192);
      const others = group.indicators.filter((i) => i.id !== 192);
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
          <QuestionRendererMUI key={q192.id} indicator={q192} value={formData.vitalValues[q192.id]} onChange={handleQ192Change} onOpenPreview={(src) => setPreviewSrc(src)} groupLabelMap={groupLabelMap} />
          {others.map((i) => (
            <QuestionRendererMUI key={i.id} indicator={i} value={formData.vitalValues[i.id]} onChange={(val) => handleVitalValueChange(i.id, val)} onOpenPreview={(src) => setPreviewSrc(src)} groupLabelMap={groupLabelMap} />
          ))}
        </Stack>
      );
    }

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
    if (group.id === 34) {
      const numberIndicators = group.indicators.filter(i => i.valueType === "number");
      const extraIndicators = group.indicators.filter(i => i.valueType !== "number");

      return (
        <LabResultTable
          indicators={numberIndicators}
          extraQuestions={extraIndicators}
          values={formData.vitalValues}
          onChange={handleVitalValueChange}
        />
      );
    }
    return (
      <Stack spacing={2}>
        {group.indicators.map((indicator) => (
          <QuestionRendererMUI key={indicator.id} indicator={indicator} value={formData.vitalValues[indicator.id]} onChange={(val) => handleVitalValueChange(indicator.id, val)} onOpenPreview={(src) => setPreviewSrc(src)} groupLabelMap={groupLabelMap} />
        ))}
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
      <PatientSearchDialog
        open={openPatientDialog}
        onClose={() => setOpenPatientDialog(false)}
        onSelect={handlePatientSelect}
      />
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
    </Container>
  );
}