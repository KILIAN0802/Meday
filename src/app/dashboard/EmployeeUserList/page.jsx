import { CONFIG } from 'src/global-config';

import { EmployeeUserList } from 'src/sections/overview/EmployeeUserList/view';

// ----------------------------------------------------------------------

export const metadata = { title: `EmployeeUserList | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return < EmployeeUserList/>;
}