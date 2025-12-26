import { CONFIG } from 'src/global-config';

import { RecordCreateView} from 'src/sections/medicalRecordStaff/create/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Medical Records Create | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <RecordCreateView />;
}
