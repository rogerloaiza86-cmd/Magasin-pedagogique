"use client";

import { useEffect } from 'react';
import { useWms } from '@/context/WmsContext';
import { usePathname, useRouter } from 'next/navigation';

export function AppStateSync() {
  const { state, dispatch } = useWms();
  const router = useRouter();
  const pathname = usePathname();

  const unprotectedRoutes = ['/login', '/signup'];

  useEffect(() => {
    // This component will now also handle re-login on refresh
    // via the logic in WmsProvider's useEffect.
    if (!state.currentUser && !unprotectedRoutes.includes(pathname)) {
      router.replace('/login');
    }
    else if (state.currentUser && unprotectedRoutes.includes(pathname)) {
      router.replace('/dashboard');
    }
  }, [state.currentUser, pathname, router]);

  return null; // This component doesn't render anything
}
