'use client';

import React, { useState } from 'react';

import { RecordCreateButtons } from '../Record-create-button';
import { MedicalRecordFormModal } from '../components/MedicalRecordFormModal';
import { TableManager } from '../Record-create-tableManager';

// ----------------------------------------------------------------------

export function RecordCreateView() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleTemplateSelect = (templateId, templateName) => {
    setSelectedTemplate({ id: templateId, name: templateName });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTemplate(null);
  };

  return (
    <>
      <RecordCreateButtons onTemplateSelect={handleTemplateSelect} />
      <TableManager />
      {selectedTemplate && (
        <MedicalRecordFormModal
          open={modalOpen}
          onClose={handleCloseModal}
          templateId={selectedTemplate.id}
          templateName={selectedTemplate.name}
        />
      )}
    </>
  );
}