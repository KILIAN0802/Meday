'use client';

import React, { useState, useEffect, useCallback } from 'react';
// import axiosInstance from 'src/utils/axios';
import axiosInstance from 'src/lib/axios'; 
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

// ----------------------------------------------------------------------

const COLORS = {
  "Bệnh án cấp tính": "#FFB380",        // Cam pastel đậm hơn
  "Bệnh án mạn tính lần 1": "#FFE680",  // Vàng pastel đậm hơn
  "Bệnh án mạn tính tái khám": "#80E580",// Xanh lá pastel đậm hơn
};

const buttonStyles = {
  minWidth: 200,
  minHeight: 60,
  fontSize: '16px',
  fontWeight: 'bold',
  borderRadius: '12px',
  boxShadow: 3,
  '&:hover': {
    boxShadow: 6,
  },
};

export function RecordCreateButtons({ onTemplateSelect }) {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, severity: "info", message: "" });
  const [selectedVersion, setSelectedVersion] = useState("Version 1.0.0"); // mặc định chọn 1.0.0
  const [versions, setVersions] = useState([]); // danh sách version duy nhất

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const endpoint = "/api/staff/medical-record-templates";
      const response = await axiosInstance.get(endpoint);
      const apiData = response.data?.data || [];

      // // Lấy danh sách version duy nhất từ notes
      // const uniqueVersions = [...new Set(apiData.map((item) => item.notes))];
      // setVersions(uniqueVersions);

      // Lọc theo version đang chọn
      const filtered = apiData.filter((item) => item.notes === selectedVersion);

      const mapped = filtered.map((item) => ({
        id: item.id,
        label: item.name,
        color: COLORS[item.name] || "#D3D3D3",
      }));

      setTemplates(mapped);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách template:", error);
      setSnackbar({ open: true, severity: "error", message: "Lấy template thất bại" });
    } finally {
      setIsLoading(false);
    }
  }, [selectedVersion]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Tạo bệnh án
      </Typography>

      {/* Nút chọn version */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        {versions.map((ver) => (
          <Button
            key={ver}
            variant={selectedVersion === ver ? "contained" : "outlined"}
            onClick={() => setSelectedVersion(ver)}
          >
            {ver}
          </Button>
        ))}
      </Stack>

      {/* Nút chọn template */}
      <Stack direction="row" spacing={4} justifyContent="center">
        {templates.map((template) => (
          <Button
            key={template.id}
            variant="contained"
            onClick={() => onTemplateSelect(template.id)}
            sx={{
              ...buttonStyles,
              backgroundColor: template.color,
              '&:hover': {
                ...buttonStyles['&:hover'],
                backgroundColor: template.color,
              },
            }}
          >
            {template.label}
          </Button>
        ))}
      </Stack>
    </Box>
  );
}
