import { CONFIG } from 'src/global-config';

import { PendingView } from 'src/sections/medicalRecordManager/table/pending-view'

// ----------------------------------------------------------------------

export const metadata = { title: `Medical Records | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <PendingView />;
}