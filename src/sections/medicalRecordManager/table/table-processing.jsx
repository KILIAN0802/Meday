'use client';

import React from 'react';
import { MedicalRecordTable } from '../components/MedicalRecordTable';

export function ConfirmedMedicalRecords() {
  return (
    <MedicalRecordTable 
      status="CONFIRMED" 
      title="Danh sách bệnh án đang xử lý" 
    />
  );
}
