'use client';

import axios from 'src/lib/axios';
import { setSession } from './utils';
import { JWT_STORAGE_KEY, ACCOUNT_TYPE_KEY, AccountType } from './constant';
import { loginAdmin, loginStaff, getAdminProfile, getStaffProfile } from 'src/api/auth'; 
import { endpoints } from 'src/lib/axios';

const AUTH_USER_KEY = 'AUTH_USER';

function pickAccessToken(res) {
  return (
    res?.data?.accessToken ??
    res?.accessToken ??
    res?.token ??
    res?.access_token ??
    null
  );
}

async function fetchMeByRole(role) {
  try {
    let res;
    if (role === AccountType.STAFF) {
      res = await getStaffProfile();
    } else {
      res = await getAdminProfile();
    }
    return res?.data ?? res?.user ?? res ?? null;
  } catch (error) {
    console.error(`Lỗi khi fetch thông tin người dùng cho vai trò ${role}:`, error);
    return null;
  }
}

function cacheUser(me) {
  try {
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(me ?? null));
  } catch {}
}

export const signInWithCredentials = async ({ username, password }) => {
  try {
    const res = await loginStaff({ username, password });
    const accessToken = pickAccessToken(res);
    if (accessToken) {
      await setSession(accessToken);
      sessionStorage.setItem(ACCOUNT_TYPE_KEY, AccountType.STAFF);
      try {
        const me = await fetchMeByRole(AccountType.STAFF);
        cacheUser(me);
      } catch {}
      return true;
    }
  } catch (error) {
    console.log("Đăng nhập tài khoản nhân viên thất bại, thử vai trò tiếp theo...");
  }
  try {
    const res = await loginAdmin({ username, password });
    const accessToken = pickAccessToken(res);

    if (accessToken) {
      await setSession(accessToken);
      sessionStorage.setItem(ACCOUNT_TYPE_KEY, AccountType.ADMIN);
      try {
        const me = await fetchMeByRole(AccountType.ADMIN);
        cacheUser(me);
      } catch {}
      return true;
    }
  } catch (error) {
    console.log("Đăng nhập tài khoản ADMIN thất bại.");
  }
  throw new Error('Tên đăng nhập hoặc mật khẩu không chính xác.');
};


export const signUp = async ({ email, password, firstName, lastName }) => {
  const params = { email, password, firstName, lastName };
  const res = await axios.post(endpoints.auth.signUp, params);

  const accessToken = pickAccessToken(res);
  if (!accessToken) throw new Error('Access token not found in response');
    await setSession(accessToken);
  try {
    sessionStorage.setItem(JWT_STORAGE_KEY, accessToken);
  } catch {}
  return true;
};

export const signOut = async () => {
  try {
    await setSession(null);
  } finally {
  try {
    sessionStorage.removeItem(ACCOUNT_TYPE_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
    } catch {}
  }
  return true;
};