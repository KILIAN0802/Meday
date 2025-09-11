import { paths } from 'src/routes/paths';
import { CONFIG } from 'src/global-config';
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

// ----------------------------------------------------------------------

export function useNavData() {
  const { user } = useMockedUser();

  // Bệnh án
  const medicalRecordItems = useMemo(() => {
    if (user?.role === 1) {
      return [
        { title: 'Thống kê nhanh', path: paths.dashboard.medicalRecordStaff.create },
        { title: 'Danh sách tất cả bệnh án', path: paths.dashboard.medicalRecordManager.root },
        { title: 'Danh sách bệnh án chờ xử lý', path: paths.dashboard.medicalRecordManager.pendingView },
        { title: 'Danh sách bệnh án đang xử lý', path: paths.dashboard.medicalRecordManager.processingView },
        { title: 'Danh sách bệnh án đã xử lý', path: paths.dashboard.medicalRecordManager.doneView },
      ];
    }
    return [
      { title: 'Tạo mẫu bệnh án', path: paths.dashboard.MedicalRecords.create },
    ];
  }, [user?.role]);

  // Lịch hẹn
  const appointmentItems = useMemo(
    () => [
      {
        title: 'Lịch hẹn',
        path: paths.dashboard.appointment.root,
      },
    ],
    []
  );

  return [
    ...(user?.accountType === 'admin'
      ? [
          {
            subheader: 'Quản lý nhân sự',
            items: [
              { title: 'Trang chủ', path: paths.dashboard.root, icon: ICONS.dashboard },
              { title: 'Danh sách nhân viên', path: paths.dashboard.general.EmployeeUserList, icon: ICONS.dashboard },
              { title: 'Thêm nhân viên', path: paths.dashboard.general.CreateEmployeeUser, icon: ICONS.ecommerce },
            ],
          },
        ]
      : []),

    {
      subheader: 'Quản lý bệnh án',
      items: medicalRecordItems,
    },

    {
      subheader: 'Quản lý lịch hẹn',
      items: appointmentItems,
    },
  ];
}
