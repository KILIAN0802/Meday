'use client';

import React from 'react';
import { MedicalRecordTable } from '../components/MedicalRecordTable';

export function AllMedicalRecords() {
  return (
    <MedicalRecordTable 
      status="ALL" 
      title="Danh sách tất cả bệnh án" 
    />
  );
}
