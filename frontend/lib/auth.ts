'use client';

import Cookies from 'js-cookie';

export function logout(): void {
  console.log('🚪 [LOGOUT] Starting logout process...');
  
  try {
    // Remove token from localStorage (some components use it)
    try { 
      localStorage.removeItem('token'); 
      console.log('✅ [LOGOUT] Removed token from localStorage');
    } catch (e) {
      console.warn('⚠️ [LOGOUT] Failed to remove from localStorage:', e);
    }

    // Remove all possible cookie variations
    const cookieNames = ['token', 'auth-token', 'jwt'];
    const domains = [
      undefined,
      window.location.hostname,
      window.location.hostname.startsWith('.') ? window.location.hostname : `.${window.location.hostname}`,
      '.vercel.app',
      '.onrender.com',
      'ai-capital-app7.vercel.app',
      'ai-capital-app7.onrender.com'
    ];
    const paths = [undefined, '/', '/dashboard', '/api'];

    for (const name of cookieNames) {
      // Basic remove
      try {
        Cookies.remove(name as any);
        console.log(`✅ [LOGOUT] Removed cookie: ${name}`);
      } catch (e) {
        console.warn(`⚠️ [LOGOUT] Failed to remove cookie ${name}:`, e);
      }
      
      for (const path of paths) {
        try {
          Cookies.remove(name as any, { path });
          console.log(`✅ [LOGOUT] Removed cookie: ${name} (path: ${path})`);
        } catch (e) {
          console.warn(`⚠️ [LOGOUT] Failed to remove cookie ${name} with path ${path}:`, e);
        }
        
        for (const domain of domains) {
          try { 
            Cookies.remove(name as any, { path, domain }); 
            console.log(`✅ [LOGOUT] Removed cookie: ${name} (path: ${path}, domain: ${domain})`);
          } catch (e) {
            console.warn(`⚠️ [LOGOUT] Failed to remove cookie ${name} with path ${path} and domain ${domain}:`, e);
          }
        }
      }
    }

    // Clear all cookies manually as fallback
    try {
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      console.log('✅ [LOGOUT] Cleared all cookies manually');
    } catch (e) {
      console.warn('⚠️ [LOGOUT] Failed to clear cookies manually:', e);
    }

  } catch (e) {
    console.error('❌ [LOGOUT] Error during logout cleanup:', e);
  }

  console.log('🚪 [LOGOUT] Redirecting to login page...');

  // Hard redirect to clear client state
  try {
    window.location.replace('/');
  } catch (e) {
    console.warn('⚠️ [LOGOUT] window.location.replace failed, trying href:', e);
    try {
      window.location.href = '/';
    } catch (e2) {
      console.error('❌ [LOGOUT] All redirect methods failed:', e2);
      // Last resort - reload the page
      window.location.reload();
    }
  }
}


