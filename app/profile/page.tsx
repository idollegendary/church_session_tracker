"use client";

import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const [admin, setAdmin] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admins/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => { if (j?.admin) setAdmin(j.admin); })
      .catch(() => setAdmin(null));
  }, []);

  if (!admin) return <div className="max-w-md mx-auto card-vhs p-6 rounded-lg mt-6">Loading...</div>;

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch('/api/admins/logout', { method: 'POST', credentials: 'include' });
      // notify other components
      window.dispatchEvent(new CustomEvent('admin:logout'));
      // redirect to home
      window.location.href = '/';
    } catch (e) {
      setLoading(false);
      alert('Logout failed');
    }
  }

  return (
    <div className="max-w-md mx-auto card-vhs p-6 rounded-lg mt-6 text-center">
      <div className="flex items-center flex-col gap-4">
        {admin.avatar_url ? (
          <img src={admin.avatar_url} alt="avatar" className="w-24 h-24 rounded-full object-cover" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-white/6 flex items-center justify-center text-white">ADM</div>
        )}
        <h2 className="text-xl font-semibold">{admin.display_name ?? admin.username}</h2>
        <p className="text-sm muted">You are a cool admin and the developer of this service.</p>
        <div className="mt-4">
          <button onClick={handleLogout} disabled={loading} className="btn btn-danger">
            {loading ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>
    </div>
  );
}
