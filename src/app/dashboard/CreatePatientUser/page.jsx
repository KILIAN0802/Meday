import { CONFIG } from 'src/global-config';

import { CreatePatientUser } from 'src/sections/overview/CreatePatientUser/view';

// ----------------------------------------------------------------------

export const metadata = { title: `reatePatientUser | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return < CreatePatientUser/>;
}