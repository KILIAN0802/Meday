

// ==================================================================================

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




// ================================================================================================================ //

export function MedicalRecords() {
  const [record1, setRecord1] = useState([]);
  const [isLoading1, setIsLoading1] = useState(false);
  const [showMyRecords, setShowMyRecords] = useState(false);
  const [searchId1, setSearchId1] = useState('');
  const [openForm, setOpenForm] = useState(false);
  const [editData, setEditData] = useState(null);
   const [openEditForm, setOpenEditForm] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    symptoms: '',
    diagnosis: '',
    notes: '',
    reExaminationDate: '',
    type: '',
  });

  const fetchInitialRecords1 = useCallback(async () => {
    setIsLoading1(true);
    try {
      const endpoint = showMyRecords ? endpoints.medical_record_staff.getCurrent : endpoints.medical_record_staff.get
      const response = await axiosInstance.get(endpoint);
      const fetchedRecords1 = response.data.data || [];
      setRecord1(fetchedRecords1);
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      setIsLoading1(false);
    }
  }, [showMyRecords]);

  const fetchRecordById1 = async () => {
    const id = Number(searchId1.trim());
  if (!searchId1) return;

  setIsLoading1(true);
  try {
    const response = await axiosInstance.get(`/api/staff/medical-records/${searchId1}`);
    const record1 = response.data.data;
    setRecord1(record1 ? [record1] : []); // Đưa vào mảng để hiển thị trong bảng
  } catch (error) {
    console.error('Không tìm thấy bệnh án với ID:', searchId1);
    setRecord1([]);
  } finally {
    setIsLoading1(false);
  }
};

const handleSubmit = async () => {
  try {
    const response = await axiosInstance.post(endpoints.medical_record_staff.create, formData);
    console.log("Tạo thành công:", response.data);
    setOpenForm(false);
  } catch (error) {
    console.error("Lỗi khi tạo bệnh án:", error);
  }
};

const handleDelete = async (id) => {
  if (!window.confirm("Bạn có chắc muốn xóa bệnh án này?")) return;

  try {
    await axiosInstance.delete(endpoints.medical_record_staff.DeleteID(id));
    console.log("Xóa thành công");
    fetchInitialRecords1(); // reload lại danh sách
  } catch (error) {
    console.error("Lỗi khi xóa bệnh án:", error);
  }
};



const handleEdit = async (id) => {
  try {
    const response = await axiosInstance.get(`/api/staff/medical-records/${id}`);
    const record = response.data.data;
    setEditData(record);
    setOpenEditForm(true);
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu bệnh án:", error);
  }
};

const handleUpdate = async () => {
  try {
    const response = await axiosInstance.put(`/api/staff/medical-records/${editData.id}`, editData);
    console.log("Cập nhật thành công:", response.data);
    setOpenEditForm(false);
    fetchInitialRecords1(); // reload lại danh sách
  } catch (error) {
    console.error("Lỗi khi cập nhật bệnh án:", error);
  }
};

  useEffect(() => {
    fetchInitialRecords1();
  }, [fetchInitialRecords1]);


  return (
    <>
      <Box sx={{ p: 3 }}>
        <Typography variant="h3" sx={{ mb: 3, textAlign: 'center' }}>Quản lý bệnh án 📜</Typography>

         <Grid container spacing={4} alignItems="flex-start">
          <Grid item xs={12} md={7}>
                  <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      color={showMyRecords ? "secondary" : "primary"}
                      onClick={() => setShowMyRecords((prev) => !prev)}
                    >
                      {showMyRecords ? "Hiển thị tất cả bệnh án" : "Chỉ hiển thị bệnh án của tôi"}
                    </Button>

                    <TextField
                      label="Tìm theo ID"
                      variant="outlined"
                      value={searchId1}
                      onChange={(e) => setSearchId1(e.target.value)}
                    />
                    <Button variant="contained" onClick={fetchRecordById1}>
                      Tìm
                    </Button>

                  <Button variant="contained" onClick={() => setOpenForm(true)}>
                    Tạo bệnh án mới
                  </Button>

                  <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="md">
                 <DialogTitle>Tạo bệnh án mới</DialogTitle>
              <DialogContent>
                <Box margin={3}>
                  <Grid container spacing={2}>
                  <Grid item xs={2}>
                    <TextField
                      label="Patient ID"
                      fullWidth
                      value={formData.patientId}
                      onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Doctor ID"
                      fullWidth
                      value={formData.doctorId}
                      onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Triệu chứng"
                      fullWidth
                      multiline
                      value={formData.symptoms}
                      onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Chẩn đoán"
                      fullWidth
                      value={formData.diagnosis}
                      onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Ghi chú"
                      fullWidth
                      multiline
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Ngày tái khám"
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={formData.reExaminationDate}
                      onChange={(e) => setFormData({ ...formData, reExaminationDate: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Loại bệnh án"
                      fullWidth
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    />
                  </Grid>
                  
               </Grid>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenForm(false)}>Hủy</Button>
                <Button variant="contained" onClick={handleSubmit}>Lưu</Button>
              </DialogActions>
              </Dialog>

               <Dialog open={openEditForm} onClose={() => setOpenEditForm(false)} fullWidth maxWidth="md">
      <DialogTitle>Sửa bệnh án</DialogTitle>
      <DialogContent>
        {editData && (
         <Box margin={5}>
               <Grid container spacing={2}>

             <Grid item xs={6}>
                    <TextField
                      label="ID bệnh nhân"
                      fullWidth
                      size="large" // hoặc "medium"
                      value={editData.patientId}
                      onChange={(e) => setEditData({ ...editData, patientId: e.target.value })}
                    />
            </Grid>
            <Grid item xs={6}>
                    <TextField
                      label="ID bác sỹ"
                      fullWidth
                      value={editData.doctorId}
                      onChange={(e) => setEditData({ ...editData, doctorId: e.target.value })}
                    />
           </Grid>

            <Grid item xs={6}>
             <TextField
                label="Triệu chứng"
                fullWidth
                multiline
                rows={4} // số dòng hiển thị mặc định
                value={editData.symptoms}
                onChange={(e) => setEditData({ ...editData, symptoms: e.target.value })}
                sx={{
                  overflow: 'auto',
                  maxHeight: 200 // giới hạn chiều cao để có thể cuộn
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Chẩn đoán"
                fullWidth
                value={editData.diagnosis}
                onChange={(e) => setEditData({ ...editData, diagnosis: e.target.value })}
              />
            </Grid>
            {/* Thêm các trường khác tương tự */}
            
            <Grid item xs={12}>
                    <TextField
                      label="Ghi chú"
                      fullWidth
                      multiline
                      value={editData.notes}
                      onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    />
                  </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Ngày tái khám"
                    type="date"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={editData.reExaminationDate || ''}
                    onChange={(e) =>
                      setEditData({ ...editData, reExaminationDate: e.target.value })
                    }
                  />
                </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Loại bệnh án"
                      fullWidth
                      value={editData.type}
                      onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                    />
                  </Grid>

          </Grid>
         </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenEditForm(false)}>Hủy</Button>
        <Button variant="contained" onClick={handleUpdate}>Lưu</Button>
      </DialogActions>
                </Dialog>
                  </Box>
                </Grid>

      <Grid item xs={12} md={7}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" sx={{ mb: 2 }}>
            Danh sách hồ sơ bệnh án
          </Typography>
          <Table className="border rounded-lg shadow-sm">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Bệnh nhân</TableCell>
                <TableCell>Bác sĩ</TableCell>
                <TableCell>Chẩn đoán</TableCell>
                <TableCell>Triệu chứng</TableCell>
                <TableCell>Ghi chú</TableCell>
                <TableCell>Ngày tạo</TableCell>
                <TableCell>Chức năng</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading1 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : (
                record1.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.patient.fullname}</p>
                        <p className="text-xs text-gray-500">{record.patient.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>{record.doctor.fullname}</TableCell>
                    <TableCell>{record.diagnosis}</TableCell>
                    <TableCell>{record.symptoms}</TableCell>
                    <TableCell>{record.notes}</TableCell>
                    <TableCell>
                      {new Date(record.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button variant="outlined" size="small" onClick={() => handleEdit(record.id)}>
                          Sửa
                        </Button>
                        <Button variant="outlined" color="error" size="small" onClick={() => handleDelete(record.id)}>
                          Xóa
                        </Button>
                      </Box>
                    </TableCell>
                    
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Grid>
       </Grid>


      </Box>
    </>
  );
}