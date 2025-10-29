'use client';
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, Box, Typography, Divider, CircularProgress
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';
import { paths } from 'src/routes/paths';

import {
  useGetMedicalRecordTemplate,
  useGetVitalGroup,
  useGetVitalValuesMedicalRecord
} from '../hooks/singles';

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

function RenderAnswerGroup({ data, level = 0 }) {
  const [previewImg, setPreviewImg] = useState(null);
  const indent = level * 1.5;

  const isImageUrl = (val) =>
    typeof val === 'string' &&
    (val.startsWith('http') || val.startsWith('data:image/')) &&
    (val.endsWith('.jpg') ||
      val.endsWith('.jpeg') ||
      val.endsWith('.png') ||
      val.endsWith('.gif') ||
      val.endsWith('.webp'));

  if (typeof data !== 'object') {
    if (isImageUrl(data)) {
      return (
        <>
          <Box sx={{ ml: indent, my: 1, cursor: 'pointer', display: 'inline-block' }} onClick={() => setPreviewImg(data)}>
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

export function RecordDialog({
  open,
  step,
  record,
  onBack,
  onNext,
  onClose,
}) {
  const { fetchTemplate } = useGetMedicalRecordTemplate();
  const { fetchVitalGroup } = useGetVitalGroup();
  const { fetchVitalValues } = useGetVitalValuesMedicalRecord();
  const router = useRouter();
  const [vitalGroups, setVitalGroups] = useState([]);
  const [savedValuesMap, setSavedValuesMap] = useState(new Map());
  const [loadingVitals, setLoadingVitals] = useState(false);

  useEffect(() => {
    const loadVitals = async () => {
      if (!record?.templateId || step !== 2) return;
      setLoadingVitals(true);
      setVitalGroups([]);
      setSavedValuesMap(new Map());
      try {
        const tpl = await fetchTemplate(record.templateId);
        const ids = tpl?.vitalGroupIds || [];
        const groups = [];
        for (const gid of ids) {
          const gr = await fetchVitalGroup(gid);
          if (gr?.data) groups.push(gr.data);
        }
        setVitalGroups(groups);

        const saved = await fetchVitalValues(record.id);
        const arr = saved || [];
        const map = new Map();
        arr.forEach((i) => map.set(i.vitalIndicatorId, i.value));
        setSavedValuesMap(map);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingVitals(false);
      }
    };
    loadVitals();
  }, [record, step]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{step === 1 ? 'Thông tin bệnh án' : 'Chỉ số đã ghi nhận'}</DialogTitle>
      <DialogContent dividers>
        {!record ? (
          <Typography>Không có dữ liệu</Typography>
        ) : step === 1 ? (
          <Stack spacing={1.2}>
            <Row label="ID bệnh án" value={record.id} />
            {record.diagnosis && <Row label="Chẩn đoán" value={record.diagnosis} />}
            {record.symptoms && <Row label="Triệu chứng" value={record.symptoms} />}
            {record.notes && <Row label="Ghi chú" value={record.notes} />}
            {record.createdAt && (
              <Row label="Ngày tạo" value={new Date(record.createdAt).toLocaleString('vi-VN')} />
            )}
          </Stack>
        ) : loadingVitals ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <CircularProgress size={22} />
          </Box>
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
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} disabled={step === 1}>
          Quay lại
        </Button>
        {step === 1 ? (
          <Button variant="contained" endIcon={<ArrowForwardIcon />} onClick={onNext}>
            Tiếp theo
          </Button>
        ) : (
          <>
            <Button variant="contained" onClick={() => router.push(paths.dashboard.medicalRecordManager.detailView(record.id))}>
              xem chi tiết
            </Button>
            <Button variant="contained" onClick={onClose}>
              Đóng
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

function Row({ label, value }) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 0.25 }}>{label}</Typography>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{value ?? '—'}</Typography>
    </Box>
  );
}
