'use client';

import { PendingMedicalRecords } from '../table-pending'
import { ConfirmedMedicalRecords } from '../table-processing'
import { CompletedMedicalRecords } from '../table-done'

export function ViewTableMedicalRecord(){
    
    return <ConfirmedMedicalRecords/>;
}