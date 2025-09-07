

import { paths } from 'src/routes/paths';
import { CONFIG } from 'src/global-config';
import { Iconify } from 'src/components/iconify';
import { SvgColor } from 'src/components/svg-color';
import { useMockedUser } from 'src/auth/hooks';
import { useMemo } from 'react';
// ----------------------------------------------------------------------
const icon = (name) => (
  <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />
);

const ICONS = {
  job: icon('ic-job'),
  blog: icon('ic-blog'),
  chat: icon('ic-chat'),
  mail: icon('ic-mail'),
  user: icon('ic-user'),
  file: icon('ic-file'),
  lock: icon('ic-lock'),
  tour: icon('ic-tour'),
  order: icon('ic-order'),
  label: icon('ic-label'),
  blank: icon('ic-blank'),
  kanban: icon('ic-kanban'),
  folder: icon('ic-folder'),
  course: icon('ic-course'),
  banking: icon('ic-banking'),
  booking: icon('ic-booking'),
  invoice: icon('ic-invoice'),
  product: icon('ic-product'),
  calendar: icon('ic-calendar'),
  disabled: icon('ic-disabled'),
  external: icon('ic-external'),
  menuItem: icon('ic-menu-item'),
  ecommerce: icon('ic-ecommerce'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
  parameter: icon('ic-parameter'),
};

// ⚡ Thay export const navData = [...] bằng function
export function useNavData() {
  const { user } = useMockedUser();

  
  const medicalRecordItems = useMemo(() => [
    {
      title: 'Bệnh án',
      path: paths.dashboard.MedicalRecords.root,
      children: [
        ...(user?.role === 1
          ? [
             { title: 'Bệnh án', path: paths.dashboard.medicalRecordStaff.create},
            { title: 'Danh sách tất cả bệnh án', path: paths.dashboard.medicalRecordManager.root},
            { title: 'Bệnh án chờ tiếp nhận', path: paths.dashboard.medicalRecordManager.pendingView},
            { title: 'Bệnh án đã tiếp nhận', path: paths.dashboard.medicalRecordManager.processingView},
            { title: 'Bệnh án đã hoàn thành', path: paths.dashboard.medicalRecordManager.doneView},
            
          ]
          : [{ title: 'Tạo mẫu bệnh án', path: paths.dashboard.MedicalRecords.create }]),

      ],
    },
  ], [user?.role]);
  
   const appointment = useMemo(() => [
    {
      title: 'Lịch hẹn',
      path: paths.dashboard.appointment.root,
     
    },
  ], [user?.role]);

  return [
    {
      subheader: 'Tổng quát',
      items: [
        { title: 'Trang chủ', path: paths.dashboard.root, icon: ICONS.dashboard },
        ...(user?.accountType === 'admin'
          ? [
              { title: 'Danh sách nhân viên', path: paths.dashboard.general.EmployeeUserList, icon: ICONS.dashboard },
              { title: 'Thêm nhân viên', path: paths.dashboard.general.CreateEmployeeUser, icon: ICONS.ecommerce },
            ]
          : []),
        { title: 'Danh sách bệnh nhân', path: paths.dashboard.general.PatientUserList, icon: ICONS.analytics },
        { title: 'Thêm bệnh nhân', path: paths.dashboard.general.CreatePatientUser, icon: ICONS.banking },
      ],
    },
    // {
    //   subheader: 'Quản lý bệnh án',
    //   items: [
    //     {
    //       title: 'Bệnh án',
    //       path: paths.dashboard.MedicalRecords.root,
    //       children: [
    //         ...(user?.role === 1
    //           ? [{ title: 'Quản lý bệnh án', path: paths.dashboard.MedicalRecords.record }]
    //           : [{ title: 'Tạo bệnh án', path: paths.dashboard.MedicalRecords.create }]),
    //         { title: 'Bệnh án chờ xử lý', path: paths.dashboard.MedicalRecords.pending },
    //         { title: 'Bệnh án đang xử lý', path: paths.dashboard.MedicalRecords.processing },
    //       ],
    //     },
    //   ],
    // },

     {
      subheader: 'Quản lý bệnh án',
      items: medicalRecordItems,
    },

    {
      subheader: 'Quản lý lịch hẹn',
      items: appointment,
    },

    {
      subheader: 'Misc',
      items: [
        {
          title: 'Các thông tin về bệnh may đay',
          path: 'https://www.bing.com/search?q=urticaria',
          icon: ICONS.external,
          info: <Iconify width={18} icon="eva:external-link-fill" />,
        },
        { title: 'Blank', path: paths.dashboard.blank, icon: ICONS.blank },
      ],
    },
  ];
}
