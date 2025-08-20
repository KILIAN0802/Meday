'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';

import { DashboardContent } from 'src/layouts/dashboard';
import axiosInstance, { endpoints } from 'src/lib/axios';
import { useMockedUser } from 'src/auth/hooks';
import { EmployeeUserList_NewList } from '../EmployyeeUserList-new-list';
import { Iconify } from 'src/components/iconify';

function toUTC7Parts(iso) {
  const d = new Date(iso);               // ISO 'Z' = UTC
  const ms = d.getTime() + 7 * 60 * 60 * 1000; // shift to UTC+7
  const z = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');

  const dd = pad(z.getUTCDate());
  const mm = pad(z.getUTCMonth() + 1);
  const yyyy = z.getUTCFullYear();
  const hh = pad(z.getUTCHours());
  const mi = pad(z.getUTCMinutes());
  const ss = pad(z.getUTCSeconds());

  return { date: `${dd}/${mm}/${yyyy}`, time: `${hh}:${mi}:${ss}` };
}

export function EmployeeUserList() {
  const { user } = useMockedUser();
  const theme = useTheme();

  const [idInput, setIdInput] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [page] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');
  const [tableData, setTableData] = useState([]);
  const [total, setTotal] = useState(0);

  const [editingId, setEditingId] = useState(null);
  const [draftForm, setDraftForm] = useState({ username: '', fullname: '', role: 1 });

  const runSearch = () => {
    const val = idInput.trim();
    if (val === '') { setErr(''); setSelectedId(null); return; }
    if (!/^\d+$/.test(val)) { setErr('ID phải là số'); return; }
    setErr(''); setSelectedId(Number(val));
  };
  const onKeyDown = (e) => { if (e.key === 'Enter') runSearch(); };

  const handleDeleteRow = async (id, fullname) => {
    const ok = window.confirm(`Bạn chắc chắn muốn xóa nhân viên ${fullname}?`);
    if (!ok) return;

    setLoading(true);
    setErr('');
    setSuccess('');
    try {
      const url = endpoints.staff.deleteID.replace('{id}', String(id));
      await axiosInstance.delete(url);
      setTableData((prev) => prev.filter((r) => r.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      if (selectedId === id) setSelectedId(null);
      setSuccess(`Đã xóa nhân viên ID ${id} thành công ✅`);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || 'Xóa nhân viên thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (row) => {
    const roleNum = row.role === 'Bác sĩ' ? 1 : row.role === 'Y tá' ? 2 : 2;
    setEditingId(row.id);
    setDraftForm({ username: row.username || '', fullname: row.fullname || '', role: roleNum });
  };
  const handleChangeDraft = (field, value) => {
    setDraftForm((f) => ({ ...f, [field]: value }));
  };
  const handleCancelEdit = () => {
    setEditingId(null);
    setDraftForm({ username: '', fullname: '', role: 1 });
  };

  const handleSubmitEdit = async () => {
    if (editingId == null) return;

    const username = (draftForm.username || '').trim();
    const fullname = (draftForm.fullname || '').trim();
    const role = Number(draftForm.role) === 1 ? 1 : 2;

    if (!username || !fullname) {
      setErr('Username và Họ & Tên không được để trống');
      return;
    }

    const ok = window.confirm(`Bạn có đồng ý thay đổi người dùng ${username} không ?`);
    if (!ok) return;

    try {
      setLoading(true);
      setErr('');
      setSuccess('');

      const url = endpoints.staff.updateID.replace('{id}', String(editingId));
      await axiosInstance.put(url, { username, fullname, role }); // id trong URL

      setTableData((prev) =>
        prev.map((r) =>
          r.id === editingId
            ? { ...r, username, fullname, role: role === 1 ? 'Bác sĩ' : 'Y tá' }
            : r
        )
      );
      setSuccess(`Đã cập nhật người dùng ${username} (ID ${editingId}) ✅`);
      handleCancelEdit();
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || 'Cập nhật nhân viên thất bại');
    } finally {
      setLoading(false);
    }
  };

  // LOAD LIST
useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setErr((prev) => (prev === 'ID phải là số' ? prev : ''));
      setSuccess('');
      try {
        if (selectedId !== null) {
          const url = endpoints.staff.getID.replace('{id}', String(selectedId));
          const res = await axiosInstance.get(url);
          const s = (res && res.data && (res.data.data ?? res.data)) || null;

          const minimal = s ? [{
            id: s.id,
            username: s.username,
            fullname: s.fullname,
            role: s.role === 1 ? 'Bác sĩ' : s.role === 2 ? 'Y tá' : '-',
            ...( (() => { const p = toUTC7Parts(s.createdAt); return { createdDate: p.date, createdTime: p.time }; })() ),
          }] : [];

          if (!ignore) { setTableData(minimal); setTotal(minimal.length); }
        } else {
          const res = await axiosInstance.get(endpoints.staff.fillter, { params: { page, limit } });
          const list = Array.isArray(res?.data?.data) ? res.data.data : [];

          const minimal = list.map((s) => {
            const pc = toUTC7Parts(s.createdAt);
            const pu = toUTC7Parts(s.updatedAt);
            return {
              id: s.id,
              username: s.username,
              fullname: s.fullname,
              role: s.role === 1 ? 'Bác sĩ' : s.role === 2 ? 'Y tá' : '-',
              createdDate: pc.date,
              createdTime: pc.time,
              updatedDate: pu.date,
              updatedTime: pu.time,

              createdAt: s.createdAt,
              updatedAt: s.updatedAt,
            };
          }).sort((a, b) => Number(a.id) - Number(b.id));

          if (!ignore) { setTableData(minimal); setTotal(res?.data?.total ?? minimal.length); }
        }
      } catch (e) {
        if (!ignore) {
          if (e?.response?.status === 404 && selectedId !== null) {
            setTableData([]); setTotal(0);
            setErr(`Không tìm thấy nhân viên với ID ${selectedId}`);
          } else {
            setErr(e?.response?.data?.message || e.message || 'Load staff failed');
          }
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [page, limit, selectedId]);

  return (
    <DashboardContent maxWidth="xl">
      <Grid container spacing={2} direction="column">
        <Grid item><Typography variant="h5">Danh sách nhân viên</Typography></Grid>

        <Grid item>
          <TextField
            fullWidth label="Tìm theo ID" placeholder="Nhập ID, ví dụ 12"
            value={idInput} onChange={(e) => setIdInput(e.target.value)} onKeyDown={onKeyDown}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={runSearch} edge="end" aria-label="search-by-id">
                    <Iconify icon="solar:magnifer-bold" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {loading && <Grid item><CircularProgress size={24} /></Grid>}
        {err && <Grid item><Alert severity="error" sx={{ mb: 2 }}>{err}</Alert></Grid>}
        {success && <Grid item><Alert severity="success" sx={{ mb: 2 }}>{success}</Alert></Grid>}

        <Grid item>
          <EmployeeUserList_NewList
            title={`Danh sách nhân viên (Tổng: ${total})`}
            tableData={tableData}
            headCells={[
              { id: 'id', label: 'ID' },
              { id: 'username', label: 'Tài khoản' },
              { id: 'fullname', label: 'Họ & Tên' },
              { id: 'role', label: 'Chức vụ' },
              { id: 'createdDate', label: 'Ngày tạo (dd/mm/yyyy)' }, 
              { id: 'createdTime', label: 'Giờ tạo (UTC+7)' },
              { id: 'updatedDate', label: 'Ngày cập nhật (dd/mm/yyyy)' },
              { id: 'updatedTime', label: 'Giờ cập nhật (UTC+7)' },       
              { id: '', label: '' },
            ]}
            onDeleteRow={handleDeleteRow}
            editingId={editingId}
            draftForm={draftForm}
            onStartEdit={handleStartEdit}
            onChangeDraft={handleChangeDraft}
            onCancelEdit={handleCancelEdit}
            onSubmitEdit={handleSubmitEdit}
          />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}