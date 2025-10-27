"use client";

import { useEffect } from 'react';
import { useWms } from '@/context/WmsContext';
import { usePathname, useRouter } from 'next/navigation';

export function AppStateSync() {
  const { state } = useWms();
  const router = useRouter();
  const pathname = usePathname();

  const unprotectedRoutes = ['/login', '/signup'];

  useEffect(() => {
    // Redirect to login if not authenticated and not on an unprotected page
    if (!state.currentUser && !unprotectedRoutes.includes(pathname)) {
      router.replace('/login');
    }
    // Redirect to dashboard if authenticated and on an unprotected page
    else if (state.currentUser && unprotectedRoutes.includes(pathname)) {
      router.replace('/dashboard');
    }
  }, [state.currentUser, pathname, router]);

  return null; // This component doesn't render anything
}
