'use client';

import React from 'react';
import { MedicalRecordTable } from '../components/MedicalRecordTable';

export function PendingMedicalRecords() {
  return (
    <MedicalRecordTable 
      status="PENDING" 
      title="Danh sách bệnh án đang chờ xử lý" 
    />
  );
}
