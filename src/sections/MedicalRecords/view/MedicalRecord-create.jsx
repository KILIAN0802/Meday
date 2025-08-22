'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import axiosInstance, { endpoints } from 'src/lib/axios';
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

// --- MUI Components ---
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';

// --- MUI Icons ---
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';

// ----------------------------------------------------------------------

// --- Các Component con ---

function IndicatorDetailsDialog({ indicator, open, onClose }) {
  if (!indicator) return null;

  // Hàm để định dạng giá trị cho dễ đọc
  const formatValue = (value) => {
    if (typeof value === 'boolean') {
      return value ? 'Kích hoạt' : 'Vô hiệu';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    // --- THÊM ĐIỀU KIỆN MỚI Ở ĐÂY ---
    // Xử lý trường hợp value là object (nhưng không phải array hoặc null)
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return Object.values(value).join(', ');
    }
    if (value instanceof Date || !isNaN(new Date(value).getTime())) {
        return new Date(value).toLocaleString('vi-VN');
    }
    return value;
  };

  const details = {
    'Đơn vị': indicator.unit,
    'Kiểu giá trị': indicator.valueType,
    'Các lựa chọn': indicator.valueOptions,
    'Giá trị nhỏ nhất': indicator.minValue,
    'Giá trị lớn nhất': indicator.maxValue,
    'Trạng thái': indicator.isActive,
    'Ngày tạo': indicator.createdAt,
    'Cập nhật lần cuối': indicator.updatedAt,
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Chi tiết chỉ số: {indicator.name} (#{indicator.id})</DialogTitle>
      <DialogContent>
        <TableContainer component={Card} sx={{ mt: 2 }}>
            <Table size="small">
                <TableBody>
                    {Object.entries(details).map(([key, value]) => (
                        <TableRow key={key}>
                            <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>{key}</TableCell>
                            <TableCell>{formatValue(value)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
}
function VitalIndicatorsList({ onIndicatorClick }) {
  const [indicators, setIndicators] = useState([]);
  const [originalIndicators, setOriginalIndicators] = useState([]);
  const [searchId, setSearchId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchIndicators = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(endpoints.vital_indicators.get);
      const fetchedData = response.data.data || [];
      setIndicators(fetchedData);
      setOriginalIndicators(fetchedData);
    } catch (error) {
      console.error('Failed to fetch indicators:', error);
      setIndicators([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIndicators();
  }, [fetchIndicators]);

  useEffect(() => {
    if (!searchId.trim()) {
      setIndicators(originalIndicators);
    } else {
      const filtered = originalIndicators.filter((indicator) =>
        String(indicator.id).includes(searchId)
      );
      setIndicators(filtered);
    }
  }, [searchId, originalIndicators]);


  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;

  return (
    <Card sx={{ width: '90vw' }}>
      <CardHeader title="Danh sách các chỉ số bệnh án" />

      <Box sx={{ p: "10px"}} >
        <TextField
          fullWidth
          variant="outlined"
          label="Lọc chỉ số theo ID"
          placeholder="Nhập ID để lọc..."
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
        />
      </Box>

      <TableContainer>
        <Table size="small" padding='10px'>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Code</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Tên</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Mô tả</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Mã BA</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {indicators.length === 0 ? (
                 <TableRow>
                    <TableCell colSpan={5} align="center">
                        <Typography color="text.secondary" sx={{ py: 3 }}>Không tìm thấy chỉ số nào.</Typography>
                    </TableCell>
                </TableRow>
            ) : (
                indicators.map((row) => (
                  <TableRow hover key={row.id} sx={{ height: 60 }}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.code}</TableCell>
                    <TableCell>
                      <Link component="button" variant="body2" onClick={() => onIndicatorClick(row)} sx={{ textAlign: 'left' }}>{row.name}</Link>
                    </TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell>{row.groupId}</TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

function MedicalRecordForm({ onCreationSuccess }) {
  const { enqueueSnackbar } = useSnackbar();
  const [recordName, setRecordName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRecord = async () => {
    if (!recordName) {
      enqueueSnackbar('Vui lòng nhập tên bệnh án', { variant: 'warning' });
      return;
    }
    setIsLoading(true);
    try {
      const response = await axiosInstance.post(endpoints.vital_groups.create, { name: recordName, description });
      enqueueSnackbar('Tạo bệnh án thành công!', { variant: 'success' });
      setRecordName('');
      setDescription('');
      onCreationSuccess(response.data.data);
    } catch (error) {
      enqueueSnackbar('Tạo bệnh án thất bại!', { variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Stack direction="row" spacing={3}  sx={{ width: '90vw', maxWidth: 960}}>
      <TextField
        variant="outlined"
        InputLabelProps={{ shrink: true }}
        label="Tên bệnh án"
        value={recordName}
        onChange={(e) => setRecordName(e.target.value)}
        sx={{ flex: 1.5, '& .MuiInputLabel-root': { color: 'primary.main', fontWeight: 'bold' } }}
      />
          <TextField
        variant="outlined"
        InputLabelProps={{ shrink: true }}
        label="Mô tả bệnh án"
        multiline
        minRows={1}
        maxRows={5}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        sx={{
          flex: 2,
          '& .MuiInputBase-root': {
            overflowY: 'auto' // Kích hoạt scroll khi vượt quá 5 dòng
          }
        }}
      />
      <Button
        size="large"
        variant="contained"
        color="success"
        disabled={!recordName || isLoading}
        onClick={handleCreateRecord}
        sx={{ height: '56px' }}
      >
        {isLoading ? 'Đang tạo...' : 'Tạo bệnh án'}
      </Button>
    </Stack>
  );
}

function MedicalRecordsList({ records, isLoading, onOpenMenu, searchId, setSearchId }) {
  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;

  return (
    <Card sx={{ width: '90vw' , display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
      <CardHeader title="Danh sách bệnh án" />
      <Box sx={{ p: 2 }}>
        <TextField fullWidth variant="outlined" label="Lọc bệnh án theo ID" value={searchId} onChange={(e) => setSearchId(e.target.value)} />
      </Box>
      <TableContainer >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Mã</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Tên bệnh án</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Mô tả</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Thời gian tạo</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Cập nhật lần cuối</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center"><Typography color="text.secondary" sx={{ py: 3 }}>Không có dữ liệu.</Typography></TableCell></TableRow>
            ) : (
              records.slice().reverse().map((row) => (
                <TableRow hover key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>
                    <Link component={RouterLink} href={`${paths.dashboard.MedicalRecords.acute}?id=${row.id}`} sx={{ color: 'primary.main', fontWeight: 'bold', '&:hover': { textDecoration: 'underline' } }}>
                      {row.name}
                    </Link>
                  </TableCell>
                  <TableCell>{row.description}</TableCell>
                  <TableCell>{new Date(row.createdAt).toLocaleString('vi-VN')}</TableCell>
                  <TableCell>{new Date(row.updatedAt).toLocaleString('vi-VN')}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={(event) => onOpenMenu(event, row.id)}><MoreVertIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

function UpdateRecordDialog({ open, onClose, record, onUpdateSuccess }) {
  const { enqueueSnackbar } = useSnackbar();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (record) {
      setName(record.name || '');
      setDescription(record.description || '');
    }
  }, [record]);

  const handleUpdate = async () => {
    if (!record) return;
    try {
      const response = await axiosInstance.patch(endpoints.vital_groups.updateID.replace('{id}', record.id), { name, description });
      enqueueSnackbar('Cập nhật thành công!', { variant: 'success' });
      onUpdateSuccess(response.data.data);
      onClose();
    } catch (error) {
      enqueueSnackbar('Cập nhật thất bại!', { variant: 'error' });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Chỉnh sửa bệnh án</DialogTitle>
      <DialogContent>
        <TextField autoFocus margin="dense" label="Tên bệnh án" fullWidth variant="outlined" value={name} onChange={(e) => setName(e.target.value)} sx={{ mt: 2 }} />
        <TextField margin="dense" label="Mô tả" fullWidth multiline rows={4} variant="outlined" value={description} onChange={(e) => setDescription(e.target.value)} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button onClick={handleUpdate} variant="contained">Lưu thay đổi</Button>
      </DialogActions>
    </Dialog>
  );
}

// --- Component chính của trang ---

export function MedicalRecordsCreate() {
  const { enqueueSnackbar } = useSnackbar();
  const [records, setRecords] = useState([]);
  const [originalRecords, setOriginalRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [currentRecordId, setCurrentRecordId] = useState(null);
  const [searchId, setSearchId] = useState('');
  const [selectedIndicator, setSelectedIndicator] = useState(null);

  const fetchInitialRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(endpoints.vital_groups.get);
      const fetchedRecords = response.data.data || [];
      setRecords(fetchedRecords);
      setOriginalRecords(fetchedRecords);
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchInitialRecords(); }, [fetchInitialRecords]);

  useEffect(() => {
    if (!searchId.trim()) {
      setRecords(originalRecords);
    } else {
      setRecords(originalRecords.filter((record) => String(record.id).includes(searchId)));
    }
  }, [searchId, originalRecords]);

  const handleOpenMenu = (event, recordId) => {
    setMenuAnchorEl(event.currentTarget);
    setCurrentRecordId(recordId);
  };
  const handleCloseMenu = () => setMenuAnchorEl(null);

  const handleCreationSuccess = (newRecord) => {
    const updated = [newRecord, ...originalRecords];
    setRecords(updated);
    setOriginalRecords(updated);
  };

  const handleUpdateSuccess = (updatedRecord) => {
    const updatedList = originalRecords.map((r) => (r.id === updatedRecord.id ? updatedRecord : r));
    setRecords(updatedList);
    setOriginalRecords(updatedList);
  };

  const handleStartEdit = () => {
    setEditingRecord(originalRecords.find((r) => r.id === currentRecordId));
    handleCloseMenu();
  };

  const handleStartDelete = () => {
    setDeletingId(currentRecordId);
    handleCloseMenu();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await axiosInstance.delete(endpoints.vital_groups.deleteID.replace('{id}', deletingId));
      enqueueSnackbar('Xóa thành công!', { variant: 'success' });
      const updatedList = originalRecords.filter((r) => r.id !== deletingId);
      setRecords(updatedList);
      setOriginalRecords(updatedList);
    } catch (error) {
      enqueueSnackbar('Xóa thất bại!', { variant: 'error' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Box sx={{ p: 3 }}>
        <Typography variant="h3" sx={{ mb: 3, textAlign: 'center' }}>Quản lý bệnh án 📜</Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 5, border: '1px solid lightgray', py: '50px', borderRadius:'30px' }}>
            <Typography variant="h5" sx={{ mb: 3 }}>Tạo bệnh án mới</Typography>
            <MedicalRecordForm onCreationSuccess={handleCreationSuccess} />
        </Box>

        <Grid container spacing={4} alignItems="flex-start">
          <Grid item xs={12} md={7}>
            <MedicalRecordsList
              records={records}
              isLoading={isLoading}
              onOpenMenu={handleOpenMenu}
              searchId={searchId}
              setSearchId={setSearchId}
            />
          </Grid>

          <Grid item xs={12} md={5}>
              <VitalIndicatorsList onIndicatorClick={setSelectedIndicator} />
          </Grid>
        </Grid>
      </Box>

      {/* CÁC DIALOG VÀ MENU */}
      <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleCloseMenu}>
        <MenuItem onClick={handleStartEdit}><EditIcon sx={{ mr: 1 }} /> Sửa</MenuItem>
        <MenuItem onClick={handleStartDelete} sx={{ color: 'error.main' }}><DeleteIcon sx={{ mr: 1 }} /> Xóa</MenuItem>
      </Menu>

      <UpdateRecordDialog open={!!editingRecord} onClose={() => setEditingRecord(null)} record={editingRecord} onUpdateSuccess={handleUpdateSuccess} />
      
      <Dialog open={!!deletingId} onClose={() => setDeletingId(null)}>
        <DialogTitle>Xác nhận xóa</DialogTitle>
        <DialogContent><DialogContentText>Bạn có chắc chắn muốn xóa bệnh án này không?</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingId(null)}>Hủy</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>Xóa</Button>
        </DialogActions>
      </Dialog>
      
      <IndicatorDetailsDialog 
        indicator={selectedIndicator} 
        open={!!selectedIndicator} 
        onClose={() => setSelectedIndicator(null)} 
      />
    </>
  );
}