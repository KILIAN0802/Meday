import { CONFIG } from 'src/global-config';

import { StaffAppointment } from 'src/sections/Appointments/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Appointment | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <StaffAppointment />;
}
