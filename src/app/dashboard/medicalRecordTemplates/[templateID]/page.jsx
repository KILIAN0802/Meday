import { CONFIG } from 'src/global-config';

import { TemplateView } from 'src/sections/medicalRecordTemplate/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Medical Records Create | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <TemplateView />;
}