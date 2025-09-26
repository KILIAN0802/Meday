'use client';

import React, { useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add'; 
import { useRouter } from 'next/navigation';
import { TableManager } from '../Record-create-tableManager';
import { paths } from 'src/routes/paths'; 
import { MedicalRecordFormModal } from '../components/MedicalRecordFormModal';
import { RecordCreateButtons } from '../Record-create-button'

// ----------------------------------------------------------------------

export function RecordCreateView() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);

  const handleCreateAppointment = () => {
    router.push(paths.dashboard.appointment.root);
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplateId(templateId);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTemplateId(null);
  };

  return (
    <>
      <RecordCreateButtons onTemplateSelect={handleTemplateSelect} />

      <TableManager />

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          my: 4,
        }}
      >
        <Button
          variant="contained"
          onClick={handleCreateAppointment}
          sx={{
            width: '70%',
            height: 120,
            fontSize: '1.25rem',
            flexDirection: 'column',
            borderRadius: 4,
            boxShadow: 3,
          }}
        >
          <AddIcon sx={{ fontSize: 40, mb: 1 }} />
          Tạo lịch hẹn
        </Button>
      </Box>
      {selectedTemplateId && (
        <MedicalRecordFormModal
          open={modalOpen}
          onClose={handleCloseModal}
          templateId={selectedTemplateId}
        />
      )}
    </>
  );
}