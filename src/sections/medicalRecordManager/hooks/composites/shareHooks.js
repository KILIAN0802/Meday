'use client';
import { useEffect, useState, useMemo } from 'react';
import debounce from 'lodash.debounce';
import {
  useGetMedicalRecords,
  useGetStaffProfile,
  useGetVitalValuesMedicalRecord,
  useCreateAppointment,
  useCheckAvailability,
  useUpdateMedicalRecordById,
  useUpdateAppointmentStatus
} from '../singles';

export function useMedicalRecordManager() {
  const { records, loading, fetchRecords } = useGetMedicalRecords();
  const { staff: doctor } = useGetStaffProfile();
  const { vitalValues, fetchVitalValues } = useGetVitalValuesMedicalRecord();
  const { create: createAppointment } = useCreateAppointment();
  const { check: checkAvailability } = useCheckAvailability();
  const { update: updateRecord } = useUpdateMedicalRecordById();
  const { updateStatus } = useUpdateAppointmentStatus();

  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchText, setSearchText] = useState('');

  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [recordStep, setRecordStep] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [patientDialogOpen, setPatientDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createPayload, setCreatePayload] = useState({
    patientId: '', doctorId: '', reason: '', appointmentDate: new Date(),
    status: 'PENDING', notes: '', fullName: '', phone: '',
    customInfo: { emergencyContact: '', insurance: '' },
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadAllRecords = async () => {
      let page = 1;
      let hasMore = true;
      const all = [];
      const perPage = 100;

      while (hasMore) {
        const res = await fetchRecords({ page, limit: perPage });
        if (!res?.length) break;
        all.push(...res);
        hasMore = res.length === perPage;
        page++;
      }

      setFiltered(all);
      setRows(all.slice(0, limit));
    };

    loadAllRecords();
  }, [limit]);

  useEffect(() => {
    const normalized = records.map((r) => {
      const p = r.patient || {};
      let phone = p.phone ? String(p.phone) : '';

      if (phone && !phone.startsWith('0')) phone = '0' + phone;

      return { ...r, patient: { ...p, phone } };
    });

    setFiltered(normalized);
    setRows(normalized.slice(0, limit));
  }, [records, limit]);

  const applyPaginate = (list, pg, lim) => {
    const start = (pg - 1) * lim;
    setRows(list.slice(start, start + lim));
    setPage(pg);
  };

  const searchSequential = async (query, pg = 1, lim = limit) => {
    const q = query.trim().toLowerCase();
    const result = records.filter((r) => {
      const p = r.patient || {};
      return (
        p.fullname?.toLowerCase().includes(q) ||
        p.phone?.includes(q) ||
        String(r.id).includes(q)
      );
    });
    setFiltered(result);
    applyPaginate(result, pg, lim);
  };

  const debouncedSearch = useMemo(() => debounce((t) => searchSequential(t, 1, limit), 500), [limit]);
  const handleSearchInput = (e) => { setSearchText(e.target.value); debouncedSearch(e.target.value); };

  const openMenu = (e, row) => { setMenuAnchorEl(e.currentTarget); setMenuRow(row); };
  const closeMenu = () => setMenuAnchorEl(null);
  const refreshAfterAction = async () => { closeMenu(); await fetchRecords({ page: 1, limit: 1000 }); };

  const onChangeStatus = async (newStatus) => {
    try {
      if (!menuRow?.appointment) return;
      await updateStatus(menuRow.appointment.id, newStatus);
    } catch (e) {
      console.error(e);
      alert('Cập nhật trạng thái thất bại');
    } finally {
      await refreshAfterAction();
    }
  };

  const openPatientDialog = (p) => { setSelectedPatient(p); setPatientDialogOpen(true); };
  const openRecordDialog = (r) => { setSelectedRecord(r); setRecordStep(1); setRecordDialogOpen(true); };
  const nextRecordStep = async () => {
    if (!selectedRecord) return;
    setRecordStep(2);
    await fetchVitalValues(selectedRecord.id);
  };

  const openCreateModal = (row) => {
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

  const changeCreatePayload = (field, value) => {
    setCreatePayload((prev) => {
      if (field.startsWith('customInfo.')) {
        const sub = field.split('.')[1];
        return { ...prev, customInfo: { ...prev.customInfo, [sub]: value } };
      }
      return { ...prev, [field]: value };
    });
  };

  const submitCreateAppointment = async () => {
    try {
      if (!createPayload.doctorId || !createPayload.patientId)
        return alert('Thiếu thông tin bác sĩ hoặc bệnh nhân');
      setSubmitting(true);
      const iso = new Date(createPayload.appointmentDate).toISOString();
      const available = await checkAvailability({ doctorId: createPayload.doctorId, appointmentDate: iso });
      if (!available) return alert('Bác sĩ đã có lịch vào thời điểm này!');
      const res = await createAppointment({ ...createPayload, appointmentDate: iso });
      const appointmentId = res?.id || res?.data?.id;
      if (appointmentId && menuRow?.id) await updateRecord(menuRow.id, { appointmentId });
      alert('Tạo lịch hẹn và cập nhật bệnh án thành công!');
      setCreateOpen(false);
      await fetchRecords({ page: 1, limit: 1000 });
    } catch (e) {
      console.error(e);
      alert('Tạo lịch hẹn thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  // ==== Return toàn bộ API và state cho component ====
  return {
    records, loading, doctor, vitalValues,
    rows, filtered, page, limit, searchText,
    recordDialogOpen, recordStep, selectedRecord,
    patientDialogOpen, selectedPatient,
    menuAnchorEl, menuRow,
    createOpen, createPayload, submitting,
    setPatientDialogOpen,
    setRecordDialogOpen,
    setRecordStep,
    applyPaginate, handleSearchInput,
    openPatientDialog, openRecordDialog, nextRecordStep,
    openMenu, closeMenu, refreshAfterAction, onChangeStatus,
    openCreateModal, closeCreateModal, changeCreatePayload, submitCreateAppointment,
  };
}
