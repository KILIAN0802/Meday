'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  CircularProgress,
} from '@mui/material';
import { paths } from 'src/routes/paths';
import { useRouter } from 'next/navigation';
import { getAppointment } from 'src/api/appointments-staff'; 
import { getMedicalRecord } from 'src/api/medical-record-staff'
function StatCard({ title, count, color, onClick, loading }) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: 1,
        textAlign: 'center',
        p: 2,
        bgcolor: color.bg,
        color: color.text,
        minHeight: '180px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          {loading ? <CircularProgress size={30} color="inherit" /> : count}
        </Typography>
        <Button variant="text" size="small" onClick={onClick} sx={{ color: color.text }}>
          Xem chi tiết
        </Button>
      </CardContent>
    </Card>
  );
}

export function TableManager() {
  const router = useRouter();
  const [stats, setStats] = useState({
    pending: 0,
    processing: 0,
    done: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchStats = async () => {
    try {
      setLoading(true);

      const allRecordsRes = await getMedicalRecord({ limit: 1000 }); 
      const records = allRecordsRes?.data || [];

      const statsCount = records.reduce(
        (acc, record) => {
          const status = record.appointment?.status;
          if (status === 'PENDING') {
            acc.pending += 1;
          } else if (status === 'CONFIRMED') {
            acc.processing += 1;
          } else if (status === 'COMPLETED') {
            acc.done += 1;
          }
          return acc;
        },
        { pending: 0, processing: 0, done: 0 }
      );

      const manualTotal = statsCount.pending + statsCount.processing + statsCount.done;

      setStats({
        pending: statsCount.pending,
        processing: statsCount.processing,
        done: statsCount.done,
        total: manualTotal,
      });
      
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu thống kê:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchStats();
}, []);
  return (
    <Box sx={{ mt: 4, alignItems: 'center' }}>
      <Typography variant="h6" gutterBottom>
        Thống kê bệnh án
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Bệnh án chờ xử lý"
            count={stats.pending}
            loading={loading}
            color={{ bg: '#ffcdd2', text: '#c62828' }}
            onClick={() => router.push(paths.dashboard.medicalRecordManager.pendingView)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Bệnh án đang xử lý"
            count={stats.processing}
            loading={loading}
            color={{ bg: '#fff59d', text: '#f9a825' }}
            onClick={() => router.push(paths.dashboard.medicalRecordManager.processingView)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Bệnh án đã xử lý"
            count={stats.done}
            loading={loading}
            color={{ bg: '#c5cae9', text: '#303f9f' }}
            onClick={() => router.push(paths.dashboard.medicalRecordManager.doneView)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tất cả bệnh án"
            count={stats.total}
            loading={loading}
            color={{ bg: '#b2dfdb', text: '#00695c' }}
            onClick={() => router.push(paths.dashboard.medicalRecordManager.root)}
          />
        </Grid>
      </Grid>
    </Box>
  );
}