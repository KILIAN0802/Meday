'use client';

import { Iconify } from 'src/components/iconify';
import { paths } from 'src/routes/paths';

// Trả về object: { me, menu }
export const buildAccount = (user) => {
  const displayName = user?.username || user?.displayName || '—';
  const caption = [user?.roleLabel, user?.fullname].filter(Boolean).join(' • ');

  return {
    me: {
      displayName,               // dòng chính (username)
      caption,                   // dòng phụ: "Bác sĩ • Dr. John Smith"
      photoURL: user?.photoURL,  // avatar nếu có
    },
  };
};

// Nếu nơi khác vẫn cần mảng đơn để map(), xuất helper này:
export const accountMenu = (user) => buildAccount(user).menu;
