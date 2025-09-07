import { CONFIG } from 'src/global-config';

import { DoneView } from 'src/sections/medicalRecordManager/table/done-view'

// ----------------------------------------------------------------------

export const metadata = { title: `Medical Records | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <DoneView />;
}