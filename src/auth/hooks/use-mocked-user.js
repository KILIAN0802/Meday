'use client';

import { _mock } from 'src/_mock';
import { useAuthContext } from 'src/auth/hooks';
import { AccountType, ACCOUNT_TYPE_KEY } from 'src/auth/context/jwt/constant';

// ----------------------------------------------------------------------

function normalizeUser(me, accountType) {
  if (!me) return null;

  const isStaff = accountType === AccountType.STAFF;
  const displayName = me.fullname || me.displayName || me.username || 'User';

  // map nhãn role cho staff
  const staffRoleNumber = isStaff ? Number(me.role) : undefined;
  let roleLabel = 'Quản trị';
  if (isStaff) {
    roleLabel =
      staffRoleNumber === 1 ? 'Bác sĩ'
      : staffRoleNumber === 2 ? 'Y tá'
      : 'Nhân viên';
  }

  // secondaryLine: hiển thị cả role, username, fullname (tự ẩn phần trống)
  const parts = [
    roleLabel,
    me?.username || null,
    me?.fullname || null,
  ].filter(Boolean);
  const secondaryLine = parts.join(' • ');

  return {
    // GIỮ NGUYÊN dữ liệu từ backend
    id: me.id ?? null,
    username: me.username ?? null,
    fullname: me.fullname ?? null,         // staff có
    role: isStaff ? staffRoleNumber : undefined, // 1/2 cho staff
    createdAt: me.createdAt ?? null,
    updatedAt: me.updatedAt ?? null,

    // THÊM các field phục vụ UI
    accountType: isStaff ? 'staff' : 'admin',
    roleLabel,                              // 'Bác sĩ' / 'Y tá' / 'Nhân viên' / 'Quản trị'
    displayName,                            // ưu tiên fullname
    secondaryLine,                          // 👉 "Bác sĩ • doctor.smith • Dr. John Smith"

    // avatar (nếu cần fallback)
    photoURL: me.photoURL || _mock.image.avatar(24),

    _raw: me,
  };
}

function fallbackUser() {
  return {
    id: null,
    username: null,
    displayName: 'Guest',
    createdAt: null,
    updatedAt: null,
    photoURL: _mock.image.avatar(24),
    role: 'guest',
    roleLabel: 'Khách',
    secondaryLine: 'Khách',
    isPublic: false,
  };
}

// ----------------------------------------------------------------------

export function useMockedUser() {
  const { user: ctxUser, loading } = useAuthContext();

  const accountType =
    (ctxUser && ctxUser.userType) ||
    (typeof window !== 'undefined' && sessionStorage.getItem(ACCOUNT_TYPE_KEY)) ||
    AccountType.ADMIN;

  const normalized = normalizeUser(ctxUser, accountType) || fallbackUser();

  return { user: normalized, loading };
}
