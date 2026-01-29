"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!username || !password) return alert('Username and password required');
    setLoading(true);
    try {
      const res = await fetch('/api/admins/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(json?.error || 'Invalid credentials');
        return;
      }
      // cookie is set by server (httpOnly)
      // If server returned admin profile in body, dispatch it so header can update immediately.
      if (json?.admin) {
        window.dispatchEvent(new CustomEvent('admin:login', { detail: { admin: json.admin } }));
        window.location.assign('/profile');
        return;
      }

      // Fallback: notify header to refresh and poll /api/admins/me a few times to ensure cookie is available.
      window.dispatchEvent(new CustomEvent('admin:login'));
      async function waitForAdmin() {
        for (let i = 0; i < 3; i++) {
          try {
            const r = await fetch('/api/admins/me', { credentials: 'include', cache: 'no-store' });
            const j = await r.json().catch(() => ({}));
            if (j?.admin) return true;
          } catch (e) {
            // ignore
          }
          await new Promise((res) => setTimeout(res, 250));
        }
        return false;
      }
      await waitForAdmin();
      window.location.assign('/profile');
    } catch (err: any) {
      alert(err?.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto card-vhs p-6 rounded-lg mt-8">
      <h2 className="text-xl font-semibold mb-4 vhs-heading">Login</h2>
      <input className="bg-transparent border border-white/10 text-white p-2 rounded w-full mb-2" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
      <input type="password" className="bg-transparent border border-white/10 text-white p-2 rounded w-full mb-4" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" />
      <div className="flex gap-2">
        <button className="btn btn-primary" onClick={handleSignIn} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>
    </div>
  );
}
