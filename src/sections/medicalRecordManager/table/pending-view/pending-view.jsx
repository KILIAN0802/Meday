'use client';

import { PendingMedicalRecords } from '../table-pending'
import { getAppointmentID } from 'src/api/appointments-staff';

export function PendingView(){
    
    return <PendingMedicalRecords/>;
}