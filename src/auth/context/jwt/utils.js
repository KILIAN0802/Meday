import { paths } from 'src/routes/paths';
import axios from 'src/lib/axios';
import { JWT_STORAGE_KEY, ACCOUNT_TYPE_KEY } from './constant';

// ----------------------------------------------------------------------
function b64urlToJson(str) {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
  const raw =
    typeof window === 'undefined'
      ? Buffer.from(padded, 'base64').toString('utf-8')
      : atob(padded);
  return JSON.parse(raw);
}

// ----------------------------------------------------------------------

export function jwtDecode(token) {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) throw new Error('Invalid token!');
    return b64urlToJson(parts[1]);
  } catch (error) {
    console.error('Error decoding token:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export function isValidToken(accessToken) {
  if (!accessToken) return false;
  try {
    const decoded = jwtDecode(accessToken);
    if (!decoded || typeof decoded.exp !== 'number') return false;
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch (error) {
    console.error('Error during token validation:', error);
    return false;
  }
}

export function tokenExpired(exp) {
  const currentTime = Date.now();
  const timeLeft = exp * 1000 - currentTime;
  setTimeout(() => {
    try {
      alert('Token expired!');
      sessionStorage.removeItem(JWT_STORAGE_KEY);
      sessionStorage.removeItem(ACCOUNT_TYPE_KEY); // thêm
      window.location.href = paths.auth.jwt.signIn;
    } catch (error) {
      console.error('Error during token expiration:', error);
      throw error;
    }
  }, Math.max(0, timeLeft));
}

// ----------------------------------------------------------------------

export async function setSession(accessToken) {
  try {
    if (accessToken) {
      sessionStorage.setItem(JWT_STORAGE_KEY, accessToken);
      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      try {
        const decodedToken = jwtDecode(accessToken);
        if (decodedToken && typeof decodedToken.exp === 'number') {
          tokenExpired(decodedToken.exp);
        }
      } catch {
        console.warn('Cannot decode token (no exp or non-standard JWT). Skipping auto-expire.');
      }
    } else {
      sessionStorage.removeItem(JWT_STORAGE_KEY);
      sessionStorage.removeItem(ACCOUNT_TYPE_KEY); // thêm
      delete axios.defaults.headers.common.Authorization;
    }
  } catch (error) {
    console.error('Error during set session:', error);
    throw error;
  }
}
