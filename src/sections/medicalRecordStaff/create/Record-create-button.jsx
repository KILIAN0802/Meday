'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getMedicalRecordTemplateById } from 'src/api/medical-record-templates-staff';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

const COLORS = {
  "Bệnh án cấp tính": "#FFB380",
  "Bệnh án mạn tính lần 1": "#FFE680",
  "Bệnh án mạn tính tái khám": "#80E580",
};

const buttonStyles = {
  minWidth: 200,
  minHeight: 60,
  fontSize: '16px',
  fontWeight: 'bold',
  borderRadius: '12px',
  color: '#212B36',
  boxShadow: 3,
  '&:hover': {
    boxShadow: 6,
  },
};

export function RecordCreateButtons() {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const handleCreateAppointment = () => {
    router.push(paths.dashboard.appointment.root);
  };

  const handleNavigateToCreate = (templateId, templateName) => {
    const encodedName = encodeURIComponent(templateName);
    const path = paths.dashboard.medicalRecordStaff.template(templateId);
    router.push(`${path}?templateName=${encodedName}`);
  };

  const fetchTemplatesByIds = useCallback(async () => {
    setIsLoading(true);
    const templateIds = [16, 17, 18];
    try {
      const promises = templateIds.map(id => getMedicalRecordTemplateById(id));
      const responses = await Promise.all(promises);
      const mappedTemplates = responses.map(response => {
        const templateData = response.data;
        if (!templateData) return null;
        return {
          id: templateData.id,
          label: templateData.name,
          color: COLORS[templateData.name] || "#D3D3D3",
        };
      }).filter(Boolean);
      setTemplates(mappedTemplates);
    } catch (error) {
      console.error("Lỗi khi fetch templates:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplatesByIds();
  }, [fetchTemplatesByIds]);

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <Typography variant="h4" sx={{ mb: 5 }}>
        Tạo bệnh án
      </Typography>
      <Stack direction="row" spacing={4} justifyContent="center" sx={{ minHeight: 60 }}>
        {isLoading ? ( <CircularProgress /> ) : 
        templates.length > 0 ? (
          <>
            {templates.map((template) => (
              <Button
                key={template.id}
                variant="contained"
                onClick={() => handleNavigateToCreate(template.id, template.label)}
                sx={{
                  ...buttonStyles,
                  backgroundColor: template.color,
                  '&:hover': {
                    backgroundColor: template.color,
                    filter: 'brightness(0.95)',
                  },
                }}
              >
                {template.label}
              </Button>
            ))}
            <Button
              variant="contained"
              onClick={handleCreateAppointment}
              sx={{
                ...buttonStyles,
                backgroundColor: '#80B3FF',
                '&:hover': {
                  backgroundColor: '#80B3FF',
                  filter: 'brightness(0.95)',
                },
              }}
            >
              Lịch hẹn
            </Button>
          </>
        ) : (
          <Typography sx={{ color: 'text.secondary' }}>
            Không tìm thấy mẫu bệnh án nào.
          </Typography>
        )}
      </Stack>
    </Box>
  );
}