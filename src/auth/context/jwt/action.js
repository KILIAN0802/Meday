'use client';

import axios, { endpoints } from 'src/lib/axios';
import { setSession } from './utils';
import { JWT_STORAGE_KEY, ACCOUNT_TYPE_KEY, AccountType } from './constant';

/** **************************************
 * Keys
 *************************************** */
const AUTH_USER_KEY = 'AUTH_USER'; // cache user info sau login

/** **************************************
 * Helpers
 *************************************** */
function pickAccessToken(res) {
  return (
    res?.data?.data?.accessToken ??
    res?.data?.accessToken ??
    res?.data?.token ??
    res?.data?.access_token ??
    null
  );
}

async function fetchMeByRole(role) {
  const url = role === AccountType.STAFF ? endpoints.staff.me : endpoints.auth.me;
  const res = await axios.get(url);
  return res?.data?.data ?? res?.data?.user ?? res?.data ?? null;
}

function cacheUser(me) {
  try {
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(me ?? null));
  } catch {}
}

/** **************************************
 * Sign in (ADMIN)
 *************************************** */
export const signInWithPassword = async ({ username, password }) => {
  const res = await axios.post(endpoints.auth.signIn, { username, password });
  const accessToken = pickAccessToken(res);
  if (!accessToken) throw new Error('Access token not found in response');

  await setSession(accessToken);
  sessionStorage.setItem(ACCOUNT_TYPE_KEY, AccountType.ADMIN);

  // Prefetch /me (không chặn luồng nếu lỗi)
  try {
    const me = await fetchMeByRole(AccountType.ADMIN);
    cacheUser(me);
  } catch {}

  return true;
};

/** **************************************
 * Sign in (STAFF)
 *************************************** */
export const signInStaffWithPassword = async ({ username, password }) => {
  const res = await axios.post(endpoints.staff.signIn, { username, password });
  const accessToken = pickAccessToken(res);
  if (!accessToken) throw new Error('Access token not found in response');

  await setSession(accessToken);
  sessionStorage.setItem(ACCOUNT_TYPE_KEY, AccountType.STAFF);

  // Prefetch /me (không chặn luồng nếu lỗi)
  try {
    const me = await fetchMeByRole(AccountType.STAFF);
    cacheUser(me);
  } catch {}

  return true;
};

/** **************************************
 * Sign up
 *************************************** */
export const signUp = async ({ email, password, firstName, lastName }) => {
  const params = { email, password, firstName, lastName };
  const res = await axios.post(endpoints.auth.signUp, params);

  const accessToken = pickAccessToken(res);
  if (!accessToken) throw new Error('Access token not found in response');

  // Đăng ký xong: set session để user vào app ngay
  await setSession(accessToken);

  // Không đoán role ở đây (tuỳ backend). Nếu muốn, bạn có thể nhận thêm param role.
  // sessionStorage.setItem(ACCOUNT_TYPE_KEY, AccountType.ADMIN | AccountType.STAFF);

  // Lưu thẳng token (setSession đã làm rồi, dòng dưới không bắt buộc)
  try {
    sessionStorage.setItem(JWT_STORAGE_KEY, accessToken);
  } catch {}

  return true;
};

/** **************************************
 * Sign out
 *************************************** */
export const signOut = async () => {
  try {
    // Xoá token + header (utils đã lo)
    await setSession(null);
  } finally {
    // Chủ động dọn thêm cache/role để chắc chắn
    try {
      sessionStorage.removeItem(ACCOUNT_TYPE_KEY);
      sessionStorage.removeItem(AUTH_USER_KEY);
    } catch {}
  }
  return true;
};
