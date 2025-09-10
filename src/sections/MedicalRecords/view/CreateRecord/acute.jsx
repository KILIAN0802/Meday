'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, useWatch, Controller, useFormContext } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import axiosInstance, { endpoints } from 'src/lib/axios';

// --- MUI Components ---
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import FormLabel from '@mui/material/FormLabel';
import Autocomplete from '@mui/material/Autocomplete';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import DialogContentText from '@mui/material/DialogContentText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
// --- MUI Icons ---
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
// --- Form Components ---
import { Form, RHFTextField, RHFSwitch } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const VALUE_TYPE_SUGGESTIONS = ['number', 'string', 'boolean', 'selection'];

function ValueOptionsDialog({ open, onClose, onSave, initialOptions = [] }) {
  const [options, setOptions] = useState([]);
  const [currentOption, setCurrentOption] = useState('');

  useEffect(() => {
    const validInitialOptions = Array.isArray(initialOptions) ? initialOptions : [];
    if (open) {
      setOptions(validInitialOptions);
    }
  }, [open, initialOptions]);


  const handleAddOption = () => {
    if (currentOption.trim() && !options.includes(currentOption.trim())) {
      setOptions([...options, currentOption.trim()]);
      setCurrentOption('');
    }
  };

  const handleDeleteOption = (optionToDelete) => {
    setOptions(options.filter(opt => opt !== optionToDelete));
  };

  const handleSave = () => {
    onSave(options);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Thêm các lựa chọn (Labels)</DialogTitle>
      <DialogContent>
        <Stack direction="row" spacing={1} sx={{ mt: 2, mb: 2 }}>
          <TextField
            fullWidth
            label="Giá trị mới"
            value={currentOption}
            onChange={(e) => setCurrentOption(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddOption(); } }}
          />
          <Button variant="contained" onClick={handleAddOption}>Thêm</Button>
        </Stack>
        <List>
          {options.map((opt, index) => (
            <ListItem key={index} secondaryAction={<IconButton edge="end" onClick={() => handleDeleteOption(opt)}><DeleteIcon /></IconButton>}>
              <ListItemText primary={opt} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button onClick={handleSave} variant="contained">Lưu</Button>
      </DialogActions>
    </Dialog>
  );
}

function RHFAutocomplete({ name, label, ...other }) {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Autocomplete
          {...field}
          freeSolo
          options={VALUE_TYPE_SUGGESTIONS.map((option) => option)}
          onChange={(event, newValue) => field.onChange(newValue)}
          onInputChange={(event, newInputValue) => field.onChange(newInputValue)}
          renderInput={(params) => (<TextField {...params} label={label} error={!!error} helperText={error?.message} {...other} />)}
        />
      )}
    />
  );
}

function IndicatorTableRowActions({ onEdit, onDeleteRequest }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    onEdit();
    handleCloseMenu();
  };

  const handleDelete = () => {
    onDeleteRequest();
    handleCloseMenu();
  };

  return (
    <>
      <IconButton onClick={handleOpenMenu}>
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} /> Sửa
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1 }} /> Xóa
        </MenuItem>
      </Menu>
    </>
  );
}


function VitalIndicatorsList({ indicators, isLoading, onEdit, onDeleteRequest }) {
  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
  }

  return (
    <Card sx={{ mt: 5, width: '100%' }}>
      <CardHeader title="Danh sách các chỉ số" />
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Tên chỉ số</TableCell>
              <TableCell>Đơn vị</TableCell>
              <TableCell>Kiểu giá trị</TableCell>
              <TableCell>Lựa chọn</TableCell>
              <TableCell>Giá trị min</TableCell>
              <TableCell>Giá trị max</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell align="right">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {indicators.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Typography color="text.secondary" sx={{ py: 3 }}>Chưa có chỉ số nào.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              indicators.map((row) => (
                <TableRow hover key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.code}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.unit}</TableCell>
                  <TableCell>{row.valueType}</TableCell>
                  <TableCell>{Object.values(row.valueOptions || {}).join(', ')}</TableCell>
                  <TableCell>{row.minValue}</TableCell>
                  <TableCell>{row.maxValue}</TableCell>
                  <TableCell>
                    <Chip label={row.isActive ? 'Kích hoạt' : 'Vô hiệu'} color={row.isActive ? 'success' : 'default'} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    {/* Sử dụng component menu hành động mới */}
                    <IndicatorTableRowActions
                      onEdit={() => onEdit(row)}
                      onDeleteRequest={() => onDeleteRequest(row.id)}
                    />
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

function DeleteConfirmationDialog({ open, onClose, onConfirm, isDeleting }) {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Bạn có chắc chắn muốn xóa chỉ số này không? Hành động này không thể hoàn tác.
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Hủy</Button>
                <Button onClick={onConfirm} color="error" variant="contained" disabled={isDeleting}>
                    {isDeleting ? 'Đang xóa...' : 'Xóa'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}


// ----------------------------------------------------------------------

export function CreateAcute() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  const groupId = searchParams.get('id');

  const [indicators, setIndicators] = useState([]);
  const [isListLoading, setIsListLoading] = useState(true);
  const [editingIndicator, setEditingIndicator] = useState(null);
  const [indicatorToDelete, setIndicatorToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const defaultValues = { code: '', name: '', unit: '', description: '', valueType: '', valueOptions: [], minValue: 0, maxValue: 0, isActive: true, groupId: groupId || '' };
  
  const methods = useForm({ defaultValues });
  const { handleSubmit, reset, control, setValue, formState: { isSubmitting } } = methods;
  
  const currentOptions = useWatch({ control, name: 'valueOptions' });
  const [isOptionsModalOpen, setOptionsModalOpen] = useState(false);

  const fetchIndicators = useCallback(async () => {
    if (!groupId) return;
    setIsListLoading(true);
    try {
      // Giả sử endpoint lấy danh sách là 'list' hoặc 'get'
      const listEndpoint = endpoints.vital_indicators.list || endpoints.vital_indicators.get;
      const response = await axiosInstance.get(listEndpoint, { params: { groupId } });
      setIndicators(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch indicators:", error);
      setIndicators([]);
    } finally {
      setIsListLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchIndicators();
  }, [fetchIndicators]);

  const handleEdit = (indicator) => {
    const formData = {
        ...indicator,
        valueOptions: Object.values(indicator.valueOptions || {})
    };
    reset(formData);
    setEditingIndicator(indicator);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    reset(defaultValues);
    setEditingIndicator(null);
  };
  
  const handleDeleteRequest = (id) => {
    setIndicatorToDelete(id);
  };

  const handleDeleteConfirm = async () => {
    if (!indicatorToDelete) return;
    setIsDeleting(true);
    try {
        await axiosInstance.delete(endpoints.vital_indicators.deleteID(indicatorToDelete));
        setIndicators(prev => prev.filter(ind => ind.id !== indicatorToDelete));
        enqueueSnackbar('Xóa thành công!');
    } catch (error) {
        console.error("Failed to delete indicator:", error);
        enqueueSnackbar('Xóa thất bại!', { variant: 'error' });
    } finally {
        setIsDeleting(false);
        setIndicatorToDelete(null);
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
        const payload = {
            ...data,
            valueOptions: { ...(data.valueOptions || []) },
            minValue: Number(data.minValue),
            maxValue: Number(data.maxValue),
            groupId: Number(data.groupId),
        };

        if (editingIndicator) {
            const response = await axiosInstance.patch(endpoints.vital_indicators.updateID(editingIndicator.id), payload);
            setIndicators(prev => prev.map(ind => (ind.id === editingIndicator.id ? response.data.data : ind)));
            enqueueSnackbar('Cập nhật thành công!');
            setEditingIndicator(null);
        } else {
            const response = await axiosInstance.post(endpoints.vital_indicators.create, payload);
            setIndicators(prevIndicators => [response.data.data, ...prevIndicators]);
            enqueueSnackbar('Tạo chỉ số thành công!');
        }
        reset(defaultValues);

    } catch (error) {
        console.error(error);
        const errorMessage = error.response?.data?.message || 'Đã có lỗi xảy ra!';
        enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  });

  const isEditMode = !!editingIndicator;

  return (
    <>
      <Box sx={{ p: 3 }}>
        <Stack spacing={3}>
          <div>
            <Button variant="text" onClick={() => router.back()}>Quay lại</Button>
            <Typography variant="h3" sx={{ mt: 1 }}>
              {isEditMode ? `Chỉnh sửa chỉ số #${editingIndicator.id}` : `Tạo chỉ số cho bệnh án #${groupId}`}
            </Typography>
          </div>
          <Form methods={methods} onSubmit={onSubmit}>
            <Card>
              <CardHeader title={isEditMode ? 'Thông tin chỉnh sửa' : 'Thông tin chỉ số sinh tồn'} />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}><RHFTextField name="code" label="Mã chỉ số (Code)" /></Grid>
                  <Grid item xs={12} md={6}><RHFTextField name="name" label="Tên chỉ số" /></Grid>
                  <Grid item xs={12} md={6}><RHFTextField name="groupId" label="ID Bệnh án (Group ID)" disabled /></Grid>
                  <Grid item xs={12} md={6}><RHFTextField name="unit" label="Đơn vị (Unit)" /></Grid>
                  <Grid item xs={12} md={6}><RHFAutocomplete name="valueType" label="Tên kiểu dữ liệu (gợi ý)" /></Grid>
                  <Grid item xs={12} md={6} />
                  <Grid item xs={12}><RHFTextField name="description" label="Mô tả" multiline rows={3} /></Grid>
                  <Grid item xs={12}><Stack spacing={1}><FormLabel>Các lựa chọn / Nhãn (Labels)</FormLabel><Button variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={() => setOptionsModalOpen(true)}>Thêm / Sửa các lựa chọn</Button><Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>{Array.isArray(currentOptions) && currentOptions.map((opt) => <Chip key={opt} label={opt} />)}</Box></Stack></Grid>
                  <Grid item xs={12} md={6}><RHFTextField name="minValue" label="Giá trị nhỏ nhất" type="number" /></Grid>
                  <Grid item xs={12} md={6}><RHFTextField name="maxValue" label="Giá trị lớn nhất" type="number" /></Grid>
                  <Grid item xs={12}><RHFSwitch name="isActive" label="Kích hoạt" /></Grid>
                </Grid>
              </CardContent>
            </Card>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
                {isEditMode && <Button variant="outlined" color="inherit" onClick={handleCancelEdit}>Hủy</Button>}
                <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Đang lưu...' : (isEditMode ? 'Lưu thay đổi' : 'Tạo mới')}
                </Button>
            </Box>
          </Form>

          <Divider sx={{ my: 3 }} />

          <VitalIndicatorsList 
            indicators={indicators} 
            isLoading={isListLoading} 
            onEdit={handleEdit}
            onDeleteRequest={handleDeleteRequest}
          />
        </Stack>
      </Box>
      <ValueOptionsDialog open={isOptionsModalOpen} onClose={() => setOptionsModalOpen(false)} initialOptions={currentOptions} onSave={(newOptions) => setValue('valueOptions', newOptions, { shouldValidate: true })} />
      
      <DeleteConfirmationDialog 
        open={!!indicatorToDelete}
        onClose={() => setIndicatorToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </>
  );
}