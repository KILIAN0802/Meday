import { CONFIG } from 'src/global-config';

import { PatientUserList } from 'src/sections/overview/PatientUserList/view';

// ----------------------------------------------------------------------

export const metadata = { title: `PatientUserList | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return < PatientUserList/>;
}