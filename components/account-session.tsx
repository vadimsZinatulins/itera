'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

function clearAccountState() {
  // Reserved namespace for future device-only drafts. Never delete server-saved work.
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    try {
      const storage = window[name];
      for (const key of Object.keys(storage)) {
        if (key.startsWith('learning-companion:')) storage.removeItem(key);
      }
    } catch { /* Storage can be unavailable in privacy-restricted browsers. */ }
  }
}

export default function AccountSession() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  const check = useCallback(async () => {
    if (document.visibilityState !== 'visible') return;
    try {
      const response = await fetch('/api/account', { cache: 'no-store' });
      if (response.status === 401) { clearAccountState(); window.location.replace('/login'); }
      else setUnavailable(!response.ok);
    } catch { setUnavailable(true); }
  }, []);
  useEffect(() => {
    const channel = new BroadcastChannel('learning-companion:session');
    channel.onmessage = () => { clearAccountState(); window.location.replace('/login'); };
    // Revalidate on return, including a browser back/forward-cache restore.
    window.addEventListener('pageshow', check);
    document.addEventListener('visibilitychange', check);
    return () => {
      channel.close(); window.removeEventListener('pageshow', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, [check]);

  async function logout() {
    if (!window.dispatchEvent(new Event('document-navigation', { cancelable: true }))) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) { setError('Could not log out. Try again.'); return; }
      clearAccountState();
      const channel = new BroadcastChannel('learning-companion:session');
      channel.postMessage('logout'); channel.close();
      window.location.replace('/login');
    } catch { setError('Could not connect. Try again.'); }
    finally { setBusy(false); }
  }
  return <div><Button variant="outline" className="min-h-11" disabled={busy} onClick={() => void logout()}>{busy ? 'Logging out…' : 'Log out'}</Button>{error && <p role="alert" aria-label="Account status" className="mt-2 text-sm">{error}</p>}{unavailable && <div><p role="alert" aria-label="Account status" className="mt-2 text-sm">Account service is temporarily unavailable. Your local work is unchanged.</p><Button variant="ghost" className="min-h-11" onClick={() => void check()}>Try again</Button></div>}</div>;
}
