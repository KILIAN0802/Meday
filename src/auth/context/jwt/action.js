'use client';

import axios, { endpoints } from 'src/lib/axios';

import { setSession } from './utils';
import { JWT_STORAGE_KEY } from './constant';

/** **************************************
 * Sign in
 *************************************** */

// ----------------------------------------------------------------------

const AUTH_ROLE_KEY = 'AUTH_ROLE';
const AUTH_USER_KEY = 'AUTH_USER';

// ----------------------------------------------------------------------

export const signInWithPassword = async ({ username, password }) => {
  const res = await axios.post(endpoints.auth.signIn, { username, password });

  // Đọc token linh hoạt theo shape backend
  const accessToken =
    res?.data?.data?.accessToken ??
    res?.data?.accessToken ??
    res?.data?.token ??
    res?.data?.access_token ?? null;

  if (!accessToken) {
    throw new Error('Access token not found in response');
  }

  await setSession(accessToken);
  sessionStorage.setItem(AUTH_ROLE_KEY, 'admin');
  return true;
};

/** **************************************
 * Sign up
 *************************************** */

export const signInStaffWithPassword = async ({ username, password }) => {
  const res = await axios.post(endpoints.staff.signIn, { username, password });
  const accessToken =
    res?.data?.data?.accessToken ??
    res?.data?.accessToken ??
    res?.data?.token ??
    res?.data?.access_token ?? null;

  if (!accessToken) throw new Error('Access token not found in response');

  await setSession(accessToken);

  sessionStorage.setItem(AUTH_ROLE_KEY, 'staff');

  try {
    const meRes = await axios.get(endpoints.staff.me);
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(meRes?.data?.data ?? null));
  } catch {
  }

  return true;
};

/** **************************************
 * Sign up
 *************************************** */

// ----------------------------------------------------------------------

export const signUp = async ({ email, password, firstName, lastName }) => {
  const params = {
    email,
    password,
    firstName,
    lastName,
  };

  try {
    const res = await axios.post(endpoints.auth.signUp, params);

    const { accessToken } = res.data;

    if (!accessToken) {
      throw new Error('Access token not found in response');
    }

    sessionStorage.setItem(JWT_STORAGE_KEY, accessToken);
  } catch (error) {
    console.error('Error during sign up:', error);
    throw error;
  }
};

/** **************************************
 * Sign out
 *************************************** */

// ----------------------------------------------------------------------

export const signOut = async () => {
  try {
    await setSession(null);
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
};