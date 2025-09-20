'use client';

import React from 'react';
import { MedicalRecordTable } from '../components/MedicalRecordTable';

export function CompletedMedicalRecords() {
  return (
    <MedicalRecordTable 
      status="COMPLETED" 
      title="Danh sách bệnh án đã xử lý" 
    />
  );
}

