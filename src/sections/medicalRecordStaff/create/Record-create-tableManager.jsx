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
import { getAppointment } from 'src/api/appointments-staff'; // Đảm bảo import đúng

// Thay đổi nhỏ: Thêm prop `loading` để hiển thị trạng thái tải
function StatCard({ title, count, color, onClick, loading }) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: 3,
        textAlign: 'center',
        p: 2,
        bgcolor: color.bg,
        color: color.text,
        minHeight: '180px', // Đặt chiều cao tối thiểu để giao diện ổn định khi tải
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
        <Button variant="text" size="small" onClick={onClick}>
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
        const [pendingRes, processingRes, doneRes, allRes] = await Promise.all([
          getAppointment({ status: 'PENDING'}),
          getAppointment({ status: 'CONFIRMED' }),
          getAppointment({ status: 'COMPLETED' }),
          getAppointment(),
        ]);
        setStats({
          pending: pendingRes?.total || 0,
          processing: processingRes?.total || 0,
          done: doneRes?.total || 0,
          total: allRes?.total || 0,
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
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Thống kê bệnh án
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Bệnh án chờ xử lý"
            count={stats.pending} // <-- Dữ liệu thật
            loading={loading} // <-- Truyền trạng thái loading
            color={{ bg: '#fdecea', text: '#d32f2f' }}
            onClick={() => router.push(paths.dashboard.medicalRecordManager.pendingView)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Bệnh án đang xử lý"
            count={stats.processing} // <-- Dữ liệu thật
            loading={loading}
            color={{ bg: '#fff8e1', text: '#f9a825' }}
            onClick={() => router.push(paths.dashboard.medicalRecordManager.processingView)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Bệnh án đã xử lý"
            count={stats.done} // <-- Dữ liệu thật
            loading={loading}
            color={{ bg: '#e3f2fd', text: '#1565c0' }}
            onClick={() => router.push(paths.dashboard.medicalRecordManager.doneView)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tất cả bệnh án"
            count={stats.total} // <-- Dữ liệu thật
            loading={loading}
            color={{ bg: '#e8f5e9', text: '#2e7d32' }}
            onClick={() => router.push(paths.dashboard.medicalRecordManager.root)}
          />
        </Grid>
      </Grid>
    </Box>
  );
}