'use client';

import React from 'react';
import { MedicalRecordClientView } from '../components/MedicalRecordTable';

export function PendingMedicalRecords() {
  return (
    <MedicalRecordClientView 
      status="PENDING" 
      title="Danh sách bệnh án đang chờ xử lý" 
    />
  );
}
