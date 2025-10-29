import { CONFIG } from 'src/global-config';

import { DetailViewMedicalRecord } from 'src/sections/medicalRecordManager/detail/detail-view';


// ----------------------------------------------------------------------

export const metadata = { title: `Medical Records | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <DetailViewMedicalRecord />;
}