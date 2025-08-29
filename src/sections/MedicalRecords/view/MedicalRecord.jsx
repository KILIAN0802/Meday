

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
   const [filteredRecords, setFilteredRecords] = useState(record1);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    symptoms: '',
    diagnosis: '',
    notes: '',
     reExaminationDate: new Date().toISOString().split("T")[0],
    type: '',
     vitalValues: null
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
    const payload = {
      patientId: Number(formData.patientId),
      doctorId: Number(formData.doctorId),
      diagnosis: formData.diagnosis,
      symptoms: formData.symptoms,
      notes: formData.notes,
      vitalValues: formData.vitalValues || []
    };

    const response = await axiosInstance.post(endpoints.medical_record_staff.create, payload);
    console.log("Tạo thành công:", response.data);
    setOpenForm(false);
  } catch (error) {
    console.error("Lỗi khi tạo bệnh án:", error.response?.data || error.message);
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
    const response = await axiosInstance.patch(`/api/staff/medical-records/${editData.id}`, editData);
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
                     onChange={(e) => {
                        const value = e.target.value;
                        setSearchId1(value);

                        if (value) {
                          const filtered = record1.filter((item) =>
                            item.id.toString().includes(value)
                          );
                          setFilteredRecords(filtered);
                        } else {
                          setFilteredRecords([]); // reset về rỗng khi xoá input
                        }
                      }}
                    />

                  <Button variant="contained" onClick={() => setOpenForm(true)}>
                    Tạo bệnh án mới
                  </Button>

                 <Dialog open={openForm} onClose={() => setOpenForm(false)} fullWidth maxWidth="md">
                    <DialogTitle>Tạo bệnh án mới</DialogTitle>
                    <DialogContent>
                      <Box margin={3}>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <TextField
                              label="Patient ID"
                              type="number"
                              fullWidth
                              value={formData.patientId}
                              onChange={(e) => setFormData({ ...formData, patientId: Number(e.target.value) })}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              label="Doctor ID"
                              type="number"
                              fullWidth
                              value={formData.doctorId}
                              onChange={(e) => setFormData({ ...formData, doctorId: Number(e.target.value) })}
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

                          {/* Optional: Cho phép nhập vitalValues nếu cần */}
                          <Grid item xs={12}>
                            <TextField
                              label="Giá trị sinh tồn (Vital Values)"
                              fullWidth
                              placeholder="Nhập dạng JSON hoặc để trống"
                              value={JSON.stringify(formData.vitalValues)}
                              onChange={(e) => {
                                try {
                                  const parsed = JSON.parse(e.target.value);
                                  setFormData({ ...formData, vitalValues: parsed });
                                } catch {
                                  // Không làm gì nếu JSON không hợp lệ
                                }
                              }}
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
      <Box margin={4}>
        <Grid container spacing={2}>
          {/* Chỉ hiển thị, không cho sửa */}
          <Grid item xs={6}>
            <TextField
              label="ID bệnh nhân"
              fullWidth
              value={editData.patientId}
              disabled
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              label="ID bác sỹ"
              fullWidth
              value={editData.doctorId}
              disabled
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              label="Ngày tái khám"
              fullWidth
              value={editData.reExaminationDate || ""}
              disabled
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              label="Loại bệnh án"
              fullWidth
              value={editData.type || ""}
              disabled
            />
          </Grid>

          {/* Các field cho phép sửa */}
          <Grid item xs={6}>
            <TextField
              label="Triệu chứng"
              fullWidth
              multiline
              rows={4}
              value={editData.symptoms}
              onChange={(e) => setEditData({ ...editData, symptoms: e.target.value })}
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

          <Grid item xs={12}>
            <TextField
              label="Ghi chú"
              fullWidth
              multiline
              rows={3}
              value={editData.notes}
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
            />
          </Grid>
        </Grid>
      </Box>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenEditForm(false)}>Hủy</Button>
    <Button variant="contained" onClick={handleUpdate}>
      Lưu
    </Button>
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
              ) : (searchId1 ? filteredRecords : record1).length > 0 ? (
                      (searchId1 ? filteredRecords : record1).map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{record.id}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{record.patient?.fullname}</p>

                            </div>
                          </TableCell>
                          <TableCell>{record.doctor?.fullname}</TableCell>
                          <TableCell>{record.diagnosis}</TableCell>
                          <TableCell>{record.symptoms}</TableCell>
                          <TableCell>{record.notes}</TableCell>
                          <TableCell>
                            {new Date(record.createdAt).toLocaleDateString("vi-VN")}
                          </TableCell>

                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleEdit(record.id)}
                              >
                                Sửa
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={() => handleDelete(record.id)}
                              >
                                Xóa
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          Không tìm thấy ID thỏa mãn
                        </TableCell>
                      </TableRow>
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