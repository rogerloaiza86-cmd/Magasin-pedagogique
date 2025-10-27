"use client";

import { useEffect } from 'react';
import { useWms } from '@/context/WmsContext';
import { usePathname, useRouter } from 'next/navigation';

export function AppStateSync() {
  const { state } = useWms();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Redirect to login if not authenticated and not on login page
    if (!state.currentUser && pathname !== '/login') {
      router.replace('/login');
    }
    // Redirect to dashboard if authenticated and on login page
    else if (state.currentUser && pathname === '/login') {
      router.replace('/dashboard');
    }
  }, [state.currentUser, pathname, router]);

  return null; // This component doesn't render anything
}
