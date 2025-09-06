import { CONFIG } from 'src/global-config';

import { RecordManagerView} from 'src/sections/medicalRecordStaff/manager/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Medical Records Create | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <RecordManagerView />;
}