'use client';

import Cookies from 'js-cookie';

export function logout(): void {
  try {
    // Remove token from localStorage (some components use it)
    try { localStorage.removeItem('token'); } catch {}

    // Attempt to remove JWT cookie under common scopes
    const cookieNames = ['token'];
    const domains = [
      undefined,
      window.location.hostname,
      window.location.hostname.startsWith('.') ? window.location.hostname : `.${window.location.hostname}`,
      'onrender.com',
    ];
    const paths = [undefined, '/', '/dashboard'];

    for (const name of cookieNames) {
      // Basic remove
      Cookies.remove(name as any);
      for (const path of paths) {
        Cookies.remove(name as any, { path });
        for (const domain of domains) {
          try { Cookies.remove(name as any, { path, domain }); } catch {}
        }
      }
    }
  } catch {}

  // Hard redirect to clear client state
  try {
    window.location.replace('/');
  } catch {
    // Fallback
    window.location.href = '/';
  }
}


