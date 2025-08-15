import { CONFIG } from 'src/global-config';

import { MedicalRecordsView } from 'src/sections/MedicalRecords/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Medical Records | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <MedicalRecordsView />;
}
