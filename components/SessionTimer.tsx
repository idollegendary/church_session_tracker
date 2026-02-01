"use client";

import { useEffect, useState } from 'react';
import Modal from './Modal';
import dayjs from 'dayjs';
// SessionsChart removed from timer view — moved elsewhere

function elapsedSeconds(session: any) {
  if (!session?.started_at) return 0;
  if (session.ended_at) return Math.floor((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 1000);
  return Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);
}

function formatSeconds(sec: number) {
  if (!sec && sec !== 0) return '';
  const s = Math.max(0, Math.floor(sec));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
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

export default function SessionTimer() {
  const [runningSession, setRunningSession] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [page, setPage] = useState<number>(1);
  const perPage = 10;
  const [total, setTotal] = useState<number>(0);
  const [preachers, setPreachers] = useState<any[]>([]);
  const [selectedPreacher, setSelectedPreacher] = useState<string | null>(null);
  useEffect(() => {
    // only fetch preachers on mount; restore running session and sessions so UI persists across reloads
    (async () => {
      await fetchPreachers();
      await fetchRunningSession();
      await fetchSessions();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // update elapsed display every second when running
    let t: any = null;
    if (runningSession) {
      t = setInterval(() => setRunningSession((rs: any) => ({ ...rs })), 1000);
    }
    function handleVisibility() {
      if (document.visibilityState === 'visible') fetchRunningSession();
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', handleVisibility); };
  }, [runningSession]);

  // no auth UI in timer — login handled elsewhere

  async function start() {
    // no client-side auth required in UI; server will use admin cookie
    if (!selectedPreacher) return alert('Select preacher');
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', preacher_id: selectedPreacher })
      });
      const data = await res.json();
      if (!res.ok) return alert(data?.error || 'Failed to start session');
      setRunningSession(data.session);
      // ensure selected preacher matches started session
      if (data.session?.preacher_id) setSelectedPreacher(data.session.preacher_id);
      // refresh paginated list (keep current page) and separately refresh running session
      await fetchSessions(page);
      await fetchRunningSession();
    } catch (err: any) {
      alert(err.message ?? String(err));
    }
  }

  async function stop() {
    if (!runningSession) return;
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop', session_id: runningSession.id })
      });
      const data = await res.json();
      if (!res.ok) return alert(data?.error || 'Failed to stop session');
      setRunningSession(null);
      await fetchSessions(page);
      await fetchRunningSession();
    } catch (err: any) {
      alert(err.message ?? String(err));
    }
  }

  async function fetchSessions(p: number = page) {
    try {
      const res = await fetch(`/api/sessions?page=${p}&per_page=${perPage}`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) return setSessions([]);
      const mine = (json.sessions ?? []).sort((a: any, b: any) => (new Date(b.started_at).getTime() - new Date(a.started_at).getTime()));
      setSessions(mine);
      setTotal(json.total ?? 0);
    } catch (err) {
      setSessions([]);
    }
  }

  async function fetchRunningSession() {
    try {
      const res = await fetch(`/api/sessions?running=true&page=1&per_page=1`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) return setRunningSession(null);
      const r = (json.sessions ?? [])[0] ?? null;
      setRunningSession(r);
      if (r && r.preacher_id) setSelectedPreacher(r.preacher_id);
    } catch (e) {
      setRunningSession(null);
    }
  }

  async function fetchPreachers() {
    try {
      const res = await fetch('/api/preachers', { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) return setPreachers([]);
      setPreachers(json.preachers ?? []);
      if ((json.preachers ?? []).length && !selectedPreacher) setSelectedPreacher(json.preachers[0].id);
    } catch (err) {
      setPreachers([]);
    }
  }

  // CRUD helpers: modal-based create/update, and delete
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSession, setModalSession] = useState<any | null>(null);
  const [modalPreacherId, setModalPreacherId] = useState<string | null>(null);
  const [modalStart, setModalStart] = useState<string>('');
  const [modalEnd, setModalEnd] = useState<string>('');

  function openCreateModal() {
    setModalSession(null);
    setModalPreacherId(preachers.length ? preachers[0].id : null);
    setModalStart('');
    setModalEnd('');
    setModalOpen(true);
  }

  function openEditModal(session: any) {
    setModalSession(session);
    setModalPreacherId(String(session.preacher_id ?? ''));
    setModalStart(session.started_at ? dayjs(session.started_at).format('YYYY-MM-DDTHH:mm') : '');
    setModalEnd(session.ended_at ? dayjs(session.ended_at).format('YYYY-MM-DDTHH:mm') : '');
    setModalOpen(true);
  }

  async function handleDelete(sessionId: string) {
    if (!confirm('Delete this session?')) return;
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', session_id: sessionId })
      });
      const json = await res.json();
      if (!res.ok) return alert(json?.error || 'Failed to delete');
      await fetchSessions(page);
      await fetchRunningSession();
    } catch (err: any) {
      alert(err.message ?? String(err));
    }
  }

  async function handleSaveModal(e?: any) {
    if (e) e.preventDefault();
    if (!modalPreacherId || !modalStart) return alert('Preacher and start required');
    try {
      if (modalSession?.id) {
        // update
        const payload: any = { action: 'update', session_id: modalSession.id };
        if (modalPreacherId) payload.preacher_id = modalPreacherId;
        if (modalStart) payload.started_at = new Date(modalStart).toISOString();
        if (modalEnd === '') payload.ended_at = undefined; else payload.ended_at = modalEnd ? new Date(modalEnd).toISOString() : null;
        const res = await fetch('/api/sessions', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const json = await res.json();
        if (!res.ok) return alert(json?.error || 'Failed to update');
      } else {
        // create
        const res = await fetch('/api/sessions', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', preacher_id: modalPreacherId, started_at: new Date(modalStart).toISOString(), ended_at: modalEnd ? new Date(modalEnd).toISOString() : null }) });
        const json = await res.json();
        if (!res.ok) return alert(json?.error || 'Failed to create');
      }
      setModalOpen(false);
      await fetchSessions(page);
      await fetchRunningSession();
    } catch (err: any) {
      alert(err.message ?? String(err));
    }
  }

  return (
    <div className="card-vhs p-4 rounded-lg">
      <div className="mb-4">
        <div className="text-sm muted">Select a preacher and press Start to begin tracking.</div>
      </div>

      <div className="mb-4">
        <div className="flex flex-col sm:flex-row gap-2 items-stretch">
          <select
            className="bg-transparent border border-white/10 text-white p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            value={selectedPreacher ?? ''}
            onChange={(e) => setSelectedPreacher(e.target.value)}
            disabled={!preachers.length || !!runningSession}
          >
            {preachers.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <div className="flex gap-2 w-full sm:w-auto">
            <button className="btn btn-primary w-full sm:w-auto py-3" onClick={start} disabled={!!runningSession}>
              Start
            </button>
            <button className="btn btn-danger w-full sm:w-auto py-3" onClick={stop} disabled={!runningSession}>
              Stop
            </button>
            <button className="btn btn-accent w-full sm:w-auto py-3" onClick={openCreateModal}>
              Create
            </button>
          </div>
        </div>
      </div>
      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)}>
          <div className="max-w-md w-full card-vhs p-4 rounded">
            <h3 className="font-semibold mb-2">{modalSession?.id ? 'Edit session' : 'Create session'}</h3>
            <form onSubmit={handleSaveModal} className="flex flex-col gap-2">
              <select className="bg-transparent border border-white/10 text-white p-2 rounded" value={modalPreacherId ?? ''} onChange={(e) => setModalPreacherId(e.target.value)}>
                {preachers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input className="bg-transparent border border-white/10 text-white p-2 rounded" type="datetime-local" value={modalStart} onChange={(e) => setModalStart(e.target.value)} />
              <input className="bg-transparent border border-white/10 text-white p-2 rounded" type="datetime-local" value={modalEnd} onChange={(e) => setModalEnd(e.target.value)} />
              <div className="flex items-center justify-end gap-2 mt-2">
                {modalSession?.id && <button type="button" className="btn btn-sm btn-danger" onClick={async () => { await handleDelete(modalSession.id); setModalOpen(false); }}>Delete</button>}
                <button type="button" className="btn btn-sm btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-sm btn-primary">Save</button>
              </div>
            </form>
          </div>
        </Modal>
      )}
      {runningSession ? (
        <div className="mb-4 p-3 rounded bg-white/6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="font-medium vhs-heading">Running — <span className="neon">LIVE</span></div>
              <div className="text-sm muted">Preacher: {runningSession?.preachers?.name ?? runningSession?.preachers?.[0]?.name ?? runningSession?.preacher_id}</div>
              <div className="text-sm muted">Started at: {dayjs(runningSession.started_at).format('YYYY-MM-DD HH:mm:ss')}</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl text-white font-mono font-semibold">{formatSeconds(elapsedSeconds(runningSession))}</div>
              <div className="text-xs muted">Elapsed</div>
            </div>
          </div>
        </div>
      ) : null}

      <div>
        <h3 className="font-semibold mb-2">Recent sessions</h3>
        <ul className="space-y-2">
          {sessions.map((s) => {
                  const preacher = preachers.find((p: any) => p.id === s.preacher_id || p.id === String(s.preacher_id)) ?? null;
              const preacherName = preacher?.name ?? s?.preachers?.name ?? s?.preachers?.[0]?.name ?? s?.preacher?.name ?? s?.preacher_name ?? s.preacher_id;
              const avatar = preacher?.avatar_url ?? s?.preachers?.avatar_url ?? s?.preacher?.avatar_url ?? null;
              return (
                <li key={s.id} className="p-2 border border-white/6 rounded bg-transparent">
                  <div className="flex items-center gap-3">
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatar} alt={preacherName ?? 'avatar'} className="w-8 h-8 rounded-full object-cover" />
                    ) : (() => {
                      const initials = getInitials(preacherName);
                      if (initials) return <div className="w-8 h-8 rounded-full bg-white/6 flex items-center justify-center text-sm font-semibold">{initials}</div>;
                      return (
                        <div className="w-8 h-8 rounded-full bg-white/6 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white/60">
                            <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.4c-3.3 0-9.8 1.7-9.8 5v1.5c0 .4.3.8.8.8h18c.5 0 .8-.4.8-.8V19.4c0-3.3-6.5-5-9.8-5z" />
                          </svg>
                        </div>
                      );
                    })()}
                    <div className="flex-1">
                      <div className="text-sm text-white font-medium">{preacherName}</div>
                      <div className="text-sm muted">{dayjs(s.started_at).format('YYYY-MM-DD HH:mm:ss')} — {s.ended_at ? dayjs(s.ended_at).format('YYYY-MM-DD HH:mm:ss') : 'running'}</div>
                    </div>
                  </div>
                  <div className="text-sm text-white mt-1 font-mono">{s.duration ? formatSeconds(s.duration) : (s.started_at ? formatSeconds(elapsedSeconds(s)) : '')}</div>
                <div className="mt-2 flex gap-2">
                  <button className="btn btn-sm btn-ghost" onClick={() => openEditModal(s)}>Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.id)}>Delete</button>
                </div>
                </li>
              );
            })}
        </ul>
        {/* SessionsChart removed from timer page — render charts in analytics view instead */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm muted">Showing {(page - 1) * perPage + 1} - {Math.min(total, page * perPage)} of {total}</div>
          <div className="flex gap-2">
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => {
                if (page > 1) {
                  const np = page - 1;
                  setPage(np);
                  fetchSessions(np);
                }
              }}
              disabled={page <= 1}
            >
              Prev
            </button>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => {
                const max = Math.max(1, Math.ceil(total / perPage));
                if (page < max) {
                  const np = page + 1;
                  setPage(np);
                  fetchSessions(np);
                }
              }}
              disabled={page >= Math.max(1, Math.ceil(total / perPage))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmailSignIn({ onSignIn }: { onSignIn: (email: string) => void }) {
  return <div />;
}

function AuthForm({ supabase }: { supabase: any | null }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!email || !password) return alert('Email and password required');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) return alert(data?.error || 'Signup failed');
      alert('Account created. You can now sign in.');
      setMode('signin');
    } catch (err: any) {
      alert(err.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn() {
    if (!supabase) return alert('Supabase not configured');
    if (!email || !password) return alert('Email and password required');
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return alert(error.message);
      // auth state change will handle user update
    } catch (err: any) {
      alert(err.message ?? String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button className={`btn btn-sm ${mode === 'signin' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('signin')}>
          Sign in
        </button>
        <button className={`btn btn-sm ${mode === 'signup' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMode('signup')}>
          Sign up
        </button>
      </div>
      <input className="bg-transparent border border-white/10 text-white p-2 rounded w-full" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      <input type="password" className="bg-transparent border border-white/10 text-white p-2 rounded w-full" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" />
      <div className="flex gap-2">
        {mode === 'signup' ? (
          <button className="btn btn-primary" onClick={handleSignUp} disabled={loading}>
            Create account
          </button>
        ) : (
          <button className="btn btn-accent" onClick={handleSignIn} disabled={loading}>
            Sign in
          </button>
        )}
      </div>
    </div>
  );
}
