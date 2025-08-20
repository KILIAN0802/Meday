import { CONFIG } from 'src/global-config';

import { CreateEmployeeUser } from 'src/sections/overview/CreateEmployeeUser/view';

// ----------------------------------------------------------------------

export const metadata = { title: `CreateEmployeeUser | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return < CreateEmployeeUser/>;
}