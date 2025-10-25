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
  Container,
} from '@mui/material';
import { paths } from 'src/routes/paths';
import { useRouter } from 'next/navigation';
import { getMedicalRecord } from 'src/api/medical-record-staff';

// ---- Thẻ thống kê từng mục ----
function StatCard({ title, count, color, onClick, loading }) {
  return (
    <Card
      onClick={onClick}
      sx={{
        borderRadius: 4,
        boxShadow: 1,
        textAlign: 'center',
        p: { xs: 2, sm: 3 },
        bgcolor: color.bg,
        color: color.text,
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'scale(1.03)',
          boxShadow: 3,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontSize: { xs: '0.95rem', sm: '1rem' },
            mb: 1,
            fontWeight: 600,
          }}
        >
          {title}
        </Typography>

        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{
            mb: 1,
            fontSize: { xs: '1.6rem', sm: '1.8rem', md: '2rem' },
          }}
        >
          {loading ? <CircularProgress size={28} color="inherit" /> : count}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            color: color.text,
            textTransform: 'none',
          }}
        >
          Xem chi tiết
        </Typography>
      </CardContent>
    </Card>
  );
}

// ---- Component chính ----
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

        // Lấy toàn bộ bệnh án
        const allRecordsRes = await getMedicalRecord({ limit: 1000 });
        const records = allRecordsRes?.data || [];

        const statsCount = records.reduce(
          (acc, record) => {
            const status = record.appointment?.status;
            if (status === 'PENDING') acc.pending += 1;
            else if (status === 'CONFIRMED') acc.processing += 1;
            else if (status === 'COMPLETED') acc.done += 1;
            return acc;
          },
          { pending: 0, processing: 0, done: 0 }
        );

        const total = statsCount.pending + statsCount.processing + statsCount.done;

        setStats({
          pending: statsCount.pending,
          processing: statsCount.processing,
          done: statsCount.done,
          total,
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography
        variant="h6"
        sx={{
          mb: 3,
          fontSize: { xs: '1.1rem', sm: '1.25rem' },
          fontWeight: 700,
          textAlign: { xs: 'center', sm: 'left' },
        }}
      >
        Thống kê bệnh án
      </Typography>

      {/* Grid responsive: 1 cột mobile, 2 tablet, 4 desktop */}
      <Grid container spacing={{ xs: 2, sm: 3 }} justifyContent="center">
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Bệnh án chờ xử lý"
            count={stats.pending}
            loading={loading}
            color={{ bg: '#ffebee', text: '#b71c1c' }}
            onClick={() =>
              router.push(paths.dashboard.medicalRecordManager.pendingView)
            }
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Bệnh án đang xử lý"
            count={stats.processing}
            loading={loading}
            color={{ bg: '#fffde7', text: '#f57f17' }}
            onClick={() =>
              router.push(paths.dashboard.medicalRecordManager.processingView)
            }
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Bệnh án đã xử lý"
            count={stats.done}
            loading={loading}
            color={{ bg: '#e8eaf6', text: '#283593' }}
            onClick={() =>
              router.push(paths.dashboard.medicalRecordManager.doneView)
            }
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tất cả bệnh án"
            count={stats.total}
            loading={loading}
            color={{ bg: '#e0f2f1', text: '#004d40' }}
            onClick={() =>
              router.push(paths.dashboard.medicalRecordManager.root)
            }
          />
        </Grid>
      </Grid>
    </Container>
  );
}
