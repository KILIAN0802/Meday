'use client';

import React from 'react';
import { MedicalRecordClientView } from '../components/MedicalRecordTable';

export function CompletedMedicalRecords() {
  return (
    <MedicalRecordClientView 
      status="COMPLETED" 
      title="Danh sách bệnh án đã xử lý" 
    />
  );
}

