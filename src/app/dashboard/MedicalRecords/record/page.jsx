import { CONFIG } from 'src/global-config';

import { MedicalRecords} from 'src/sections/MedicalRecords/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Medical Records Processing| Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <MedicalRecords />;
}
