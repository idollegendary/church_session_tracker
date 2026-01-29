"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Header() {
  const [admin, setAdmin] = useState<any | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchAdmin() {
      try {
        const r = await fetch('/api/admins/me', { credentials: 'include' });
        const j = await r.json().catch(() => ({}));
        if (!mounted) return;
        if (j?.admin) setAdmin(j.admin);
        else setAdmin(null);
      } catch (e) {
        if (mounted) setAdmin(null);
      }
    }
    fetchAdmin();

    const onLogin = () => fetchAdmin();
    const onLogout = () => setAdmin(null);
    window.addEventListener('admin:login', onLogin);
    window.addEventListener('admin:logout', onLogout);
    return () => { mounted = false; window.removeEventListener('admin:login', onLogin); window.removeEventListener('admin:logout', onLogout); };
  }, []);

  return (
    <header className="pb-4">
      <div className="app-container flex items-center justify-between py-4">
        <Link href="/" className="text-lg font-semibold neon vhs-logo">Session Tracker</Link>
        <nav className="hidden sm:flex gap-4 items-center text-sm">
          <Link href="/timer" className="px-3 py-1 rounded hover:bg-white/5">Timer</Link>
          <Link href="/preachers" className="px-3 py-1 rounded hover:bg-white/5">Preachers</Link>
          <Link href="/sessions" className="px-3 py-1 rounded hover:bg-white/5">Sessions</Link>
          {admin ? (
            <Link href="/profile" className="flex items-center gap-2">
              {admin.avatar_url ? <img src={admin.avatar_url} alt="avatar" className="w-6 h-6 rounded-full object-cover" /> : <span className="w-6 h-6 rounded-full bg-white/5 inline-block" />}
              <span className="muted">{admin.display_name ?? admin.username}</span>
            </Link>
          ) : (
            <Link href="/login" className="px-3 py-1 rounded hover:bg-white/5">Login</Link>
          )}
        </nav>

        {/* Mobile hamburger */}
        <div className="sm:hidden relative">
          <button aria-label="menu" className="p-2 bg-white/6 rounded" onClick={() => setMobileOpen(v => !v)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {mobileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-black/80 border border-white/6 rounded shadow-md p-2 z-20">
              <Link href="/timer" className="block px-2 py-1 rounded hover:bg-white/6" onClick={() => setMobileOpen(false)}>Timer</Link>
              <Link href="/preachers" className="block px-2 py-1 rounded hover:bg-white/6" onClick={() => setMobileOpen(false)}>Preachers</Link>
              <Link href="/sessions" className="block px-2 py-1 rounded hover:bg-white/6" onClick={() => setMobileOpen(false)}>Sessions</Link>
              <div className="border-t border-white/6 my-2" />
              {admin ? (
                <Link href="/profile" className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/6" onClick={() => setMobileOpen(false)}>
                  {admin.avatar_url ? <img src={admin.avatar_url} alt="avatar" className="w-6 h-6 rounded-full object-cover" /> : <span className="w-6 h-6 rounded-full bg-white/5 inline-block" />}
                  <span className="muted">{admin.display_name ?? admin.username}</span>
                </Link>
              ) : (
                <Link href="/login" className="block px-2 py-1 rounded hover:bg-white/6" onClick={() => setMobileOpen(false)}>Login</Link>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
