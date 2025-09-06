import { CONFIG } from 'src/global-config';

import { ProcessingView } from 'src/sections/medicalRecordManager/table/processing-view'

// ----------------------------------------------------------------------

export const metadata = { title: `Medical Records | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <ProcessingView />;
}
