import { CONFIG } from 'src/global-config';

import { MedicalRecordsPending} from 'src/sections/MedicalRecords/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Medical Records Pending | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <MedicalRecordsPending />;
}
