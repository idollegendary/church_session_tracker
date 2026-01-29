"use client";

import { useEffect, useState } from 'react';
import { createSupabaseClient } from '../../lib/supabaseClient';

export default function PreachersPage() {
  const [preachers, setPreachers] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPreacher, setModalPreacher] = useState<any | null>(null);
  const supabase = createSupabaseClient();

  useEffect(() => {
    fetchList();
  }, []);
  useEffect(() => {
    const onOpenCreate = () => { setModalPreacher(null); setModalOpen(true); };
    const onRefresh = () => { fetchList(); };
    window.addEventListener('open:preacher:create', onOpenCreate);
    window.addEventListener('refresh:preachers', onRefresh);
    return () => { window.removeEventListener('open:preacher:create', onOpenCreate); window.removeEventListener('refresh:preachers', onRefresh); };
  }, []);

  async function fetchList() {
    try {
      const res = await fetch('/api/preachers', { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) return setPreachers([]);
      setPreachers(json.preachers ?? []);
    } catch (err) {
      setPreachers([]);
    }
  }

  async function handleCreate() {
    if (!name) return alert('Enter name');
    setLoading(true);
    try {
      const res = await fetch('/api/preachers', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      const json = await res.json();
      if (!res.ok) return alert(json?.error || 'Failed');
      setName('');
      fetchList();
    } catch (err: any) {
      alert(err.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this preacher?')) return;
    const res = await fetch(`/api/preachers/${id}`, { method: 'DELETE', credentials: 'include' });
    const json = await res.json();
    if (!res.ok) return alert(json?.error || 'Failed');
    fetchList();
  }

  async function handleUpdate(id: string, newName: string, avatarUrl?: string) {
    const body: any = { name: newName };
    if (avatarUrl !== undefined) body.avatar_url = avatarUrl;
    const res = await fetch(`/api/preachers/${id}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json = await res.json();
    if (!res.ok) return alert(json?.error || 'Failed to update');
    fetchList();
  }

  function Avatar({ p }: { p: any }) {
    if (!p?.avatar_url) return <div className="w-12 h-12 bg-white/6 rounded-full flex items-center justify-center text-sm text-white">No</div>;
    return <img src={p.avatar_url} alt="avatar" className="w-12 h-12 rounded-full object-cover" />;
  }

  function getInitials(name: any) {
    if (!name || typeof name !== 'string') return null;
    const hasLetters = /[A-Za-zА-Яа-яЁёІіЇїЄє]/.test(name);
    if (!hasLetters) return null;
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return null;
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  return (
    <div className="max-w-4xl mx-auto card-vhs p-4 rounded-lg mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold vhs-heading">Preachers</h2>
        <div>
          <button className="btn btn-primary" onClick={() => { setModalPreacher(null); setModalOpen(true); }}>Create</button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {preachers.map((p) => (
          <button key={p.id} onClick={() => { setModalPreacher(p); setModalOpen(true); }} className="group bg-transparent border border-white/6 rounded-md p-3 flex flex-col items-center gap-2 hover:shadow-lg transition-shadow">
              {p.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.avatar_url} alt={p.name} className="w-28 h-28 rounded-md object-cover" />
            ) : (
              <div className="w-28 h-28 rounded-md bg-white/6 flex items-center justify-center text-lg font-semibold">{getInitials(p.name ?? '?') ?? '?'}</div>
            )}
            <div className="text-sm text-white font-medium truncate max-w-[10rem]">{p.name}</div>
          </button>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setModalOpen(false)} />
          <div className="relative max-w-md w-full card-vhs p-4 rounded">
            <h3 className="font-semibold mb-2">{modalPreacher ? 'Edit preacher' : 'Create preacher'}</h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                {modalPreacher?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={modalPreacher.avatar_url} alt="avatar" className="w-16 h-16 rounded-md object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-md bg-white/6 flex items-center justify-center text-lg font-semibold">{getInitials(modalPreacher?.name ?? name ?? '?') ?? '?'}</div>
                )}
                <input className="bg-transparent border border-white/10 text-white p-2 rounded flex-1" value={modalPreacher?.name ?? name} onChange={(e) => setModalPreacher((prev: any) => ({ ...(prev ?? {}), name: e.target.value }))} placeholder="Name" />
              </div>
              <input className="bg-transparent border border-white/10 text-white p-2 rounded" value={modalPreacher?.avatar_url ?? ''} onChange={(e) => setModalPreacher((prev: any) => ({ ...(prev ?? {}), avatar_url: e.target.value }))} placeholder="Avatar URL" />

              <div className="flex items-center justify-end gap-2 mt-2">
                {modalPreacher && (
                  <button className="btn btn-sm btn-danger" onClick={async () => { await handleDelete(modalPreacher.id); setModalOpen(false); }}>Delete</button>
                )}
                <button className="btn btn-sm btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                <button className="btn btn-sm btn-primary" onClick={async () => {
                  // save
                  const p = modalPreacher;
                  if (!p?.name) return alert('Enter name');
                  if (p?.id) {
                    await handleUpdate(p.id, p.name, p.avatar_url ?? undefined);
                  } else {
                    // create
                    setLoading(true);
                    try {
                      const res = await fetch('/api/preachers', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: p.name, avatar_url: p.avatar_url ?? undefined }) });
                      const json = await res.json();
                      if (!res.ok) return alert(json?.error || 'Failed');
                    } catch (e) { alert('Failed'); }
                    setLoading(false);
                  }
                  setModalOpen(false);
                  fetchList();
                }}>{modalPreacher?.id ? 'Save' : 'Create'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function PreacherRow({ p, onDelete, onUpdate, Avatar }: any) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(p.name);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setName(p.name); }, [p.name]);

  return (
    <li className="p-2 border border-white/6 rounded bg-transparent">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar p={p} />
          <div className="min-w-0">
            <div className="font-medium text-white truncate max-w-[18rem]">{p.name}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {editing ? (
            <div className="flex flex-wrap items-center gap-2">
              <input className="bg-transparent border border-white/10 text-white p-1 rounded max-w-xs w-40" value={name} onChange={(e) => setName(e.target.value)} />
              <input className="bg-transparent border border-white/10 text-white p-1 rounded max-w-xs w-56" placeholder="Avatar URL" defaultValue={p.avatar_url ?? ''} onChange={(e) => (p._newAvatar = e.target.value)} />
              <button className="btn btn-sm btn-accent" onClick={async () => { setSaving(true); try { await onUpdate(p.id, name, p._newAvatar ?? undefined); setEditing(false); } finally { setSaving(false); } }} disabled={saving}>Save</button>
              <button className="btn btn-sm btn-ghost" onClick={() => { setEditing(false); setName(p.name); }}>Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button className="btn btn-sm btn-accent" onClick={() => setEditing(true)}>Edit</button>
              <button className="btn btn-sm btn-danger" onClick={() => onDelete(p.id)}>Delete</button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
