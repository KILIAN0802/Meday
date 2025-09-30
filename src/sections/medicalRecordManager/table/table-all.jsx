'use client';

import React from 'react';
import { MedicalRecordClientView } from '../components/MedicalRecordTable';

export function AllMedicalRecords() {
  return (
    <MedicalRecordClientView 
      status="ALL" 
      title="Danh sách tất cả bệnh án" 
    />
  );
}
