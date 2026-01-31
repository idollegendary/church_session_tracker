"use client";

import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

function formatSeconds(sec: number) {
  if (sec === undefined || sec === null) return '-';
  const s = Math.max(0, Math.floor(Number(sec)));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

function elapsedSeconds(session: any) {
  if (!session?.started_at) return 0;
  if (session.ended_at) return Math.floor((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 1000);
  return Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);
}

function getInitials(name: any) {
  if (!name || typeof name !== 'string') return null;
  // prefer alphabetic characters; avoid returning numeric ids like 1 or 0
  const hasLetters = /[A-Za-zА-Яа-яЁёІіЇїЄє]/.test(name);
  if (!hasLetters) return null;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [preachers, setPreachers] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      await fetchPreachers();
      await fetchSessions();
    })();
  }, []);

  async function fetchPreachers() {
    try {
      const res = await fetch('/api/preachers', { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) return setPreachers([]);
      setPreachers(json.preachers ?? []);
    } catch (e) {
      setPreachers([]);
    }
  }

  async function fetchSessions() {
    try {
      const res = await fetch('/api/sessions', { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) return setSessions([]);
      setSessions(json.sessions ?? []);
    } catch (err) {
      setSessions([]);
    }
  }

  return (
    <div className="max-w-3xl mx-auto card-vhs p-6 rounded-lg mt-6">
      <h2 className="text-xl font-semibold mb-4 vhs-heading">All sessions</h2>
      <ul className="space-y-2">
        {sessions.map((s) => {
          // prefer resolving preacher from the preachers list (by id), fall back to relation in session
          const preacherFromList = preachers.find((p: any) => p.id === s.preacher_id || p.id === String(s.preacher_id));
          const related = preacherFromList ?? s?.preachers ?? s?.preacher ?? null;
          const preacherName = related?.name ?? (Array.isArray(related) ? related?.[0]?.name : null) ?? s?.preacher_name ?? s.preacher_id;
          const avatar = preacherFromList?.avatar_url ?? related?.avatar_url ?? (Array.isArray(related) ? related?.[0]?.avatar_url : null) ?? s?.preacher_avatar_url ?? null;
          return (
            <li key={s.id} className="p-3 border border-white/6 rounded bg-transparent">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-shrink-0">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatar} alt={preacherName ?? 'avatar'} className="w-12 h-12 rounded-full object-cover" />
                    ) : (() => {
                    const initials = getInitials(preacherName);
                    if (initials) return <div className="w-12 h-12 rounded-full bg-white/6 flex items-center justify-center text-sm font-semibold">{initials}</div>;
                    return (
                      <div className="w-12 h-12 rounded-full bg-white/6 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white/60">
                          <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.4c-3.3 0-9.8 1.7-9.8 5v1.5c0 .4.3.8.8.8h18c.5 0 .8-.4.8-.8V19.4c0-3.3-6.5-5-9.8-5z" />
                        </svg>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">{preacherName}</div>
                  <div className="mt-1 text-sm muted">
                    <div className="text-xs text-white/80 font-medium">Start</div>
                    <div className="truncate">{s.started_at ? dayjs(s.started_at).format('YYYY-MM-DD HH:mm:ss') : '-'}</div>
                    <div className="mt-2 text-xs text-white/80 font-medium">Stop</div>
                    <div className="truncate">{s.ended_at ? dayjs(s.ended_at).format('YYYY-MM-DD HH:mm:ss') : 'running'}</div>
                  </div>
                </div>

                <div className="mt-3 sm:mt-0 sm:ml-4 flex flex-col items-start sm:items-end">
                  <div className="text-xs muted">Total</div>
                  <div className="text-sm text-white font-mono">{s.duration ? formatSeconds(s.duration) : (s.started_at ? formatSeconds(elapsedSeconds(s)) : '-')}</div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
