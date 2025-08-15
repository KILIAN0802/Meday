import { CONFIG } from 'src/global-config';

import { MedicalRecordsCreate} from 'src/sections/MedicalRecords/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Medical Records Create | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <MedicalRecordsCreate />;
}
