import { CONFIG } from 'src/global-config';

import { RecordDetailView } from 'src/sections/medicalRecordStaff/manager/detail';

// ----------------------------------------------------------------------

export const metadata = { title: `Medical Record Details | Dashboard - ${CONFIG.appName}` };

export default async function MedicalRecordDetailPage() {

  return <RecordDetailView />;
}