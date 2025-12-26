import { CONFIG } from 'src/global-config';

import { ViewTableMedicalRecord } from 'src/sections/medicalRecordManager/table/view'

// ----------------------------------------------------------------------

export const metadata = { title: `Medical Records | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <ViewTableMedicalRecord />;
}
