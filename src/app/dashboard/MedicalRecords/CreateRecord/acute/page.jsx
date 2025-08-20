import { CONFIG } from 'src/global-config';

import { CreateAcute } from 'src/sections/MedicalRecords/view/CreateRecord';

// ----------------------------------------------------------------------

export const metadata = { title: `Medical Records | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <CreateAcute />;
}
