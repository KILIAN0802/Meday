'use client';

import React from 'react';
import { MedicalRecordClientView } from '../components/MedicalRecordTable';

export function ConfirmedMedicalRecords() {
  return (
    <MedicalRecordClientView 
      status="CONFIRMED" 
      title="Danh sách bệnh án đang xử lý" 
    />
  );
}
