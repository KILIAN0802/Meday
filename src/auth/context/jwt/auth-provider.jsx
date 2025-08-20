'use client';

import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useEffect, useCallback } from 'react';

import axios, { endpoints } from 'src/lib/axios';

import { JWT_STORAGE_KEY, ACCOUNT_TYPE_KEY } from './constant';
import { AuthContext } from '../auth-context';
import { setSession } from './utils';

// ----------------------------------------------------------------------

const AUTH_USER_KEY = 'AUTH_USER';

// ----------------------------------------------------------------------

export function AuthProvider({ children }) {
  const { state, setState } = useSetState({ user: null, loading: true });

  const checkUserSession = useCallback(async () => {
    try {
      const accessToken = sessionStorage.getItem(JWT_STORAGE_KEY);
      const role = sessionStorage.getItem(ACCOUNT_TYPE_KEY) || 'admin';

      if (!accessToken) {
        setState({ user: null, loading: false });
        return null;
      }

      await setSession(accessToken);

      const meUrl = role === 'staff' ? endpoints.staff.me : endpoints.auth.me;

      const res = await axios.get(meUrl);
      const me = res?.data?.data ?? res?.data?.user ?? res?.data ?? null;

      sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(me));

      setState({
        user: me ? { ...me, accessToken, userType: role } : null,
        loading: false,
      });

      return me;
    } catch (error) {
      const accessToken = sessionStorage.getItem(JWT_STORAGE_KEY);
     
      const role = sessionStorage.getItem(ACCOUNT_TYPE_KEY) || 'admin';

      const cached = sessionStorage.getItem(AUTH_USER_KEY);

      if (cached) {
        const me = JSON.parse(cached);
        setState({ user: { ...me, accessToken, userType: role }, loading: false });
      } else {
        setState({ user: null, loading: false });
      }
      return null;
    }
  }, [setState]);

  useEffect(() => {
    checkUserSession();
  }, [checkUserSession]);

  const status = state.loading ? 'loading' : state.user ? 'authenticated' : 'unauthenticated';

  const memoizedValue = useMemo(
    () => ({
      user: state.user,
      checkUserSession,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
    }),
    [checkUserSession, state.user, status]
  );

  return <AuthContext value={memoizedValue}>{children}</AuthContext>;
  
}
