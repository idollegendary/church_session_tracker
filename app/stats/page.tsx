"use client";

import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';

const PALETTE = ["#60a5fa","#34d399","#f59e0b","#f97316","#ef4444","#8b5cf6","#06b6d4","#ec4899"];

function formatDuration(sec: number) {
  if (!sec) return '0s';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function StatisticsPage() {
  const [days, setDays] = useState(30);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => { fetchStats(); }, [days, limit]);

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await fetch(`/api/preachers/stats?days=${days}&limit=${limit}`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed');
      const rows = (json.stats ?? []).map((r: any) => ({
        name: r.name ?? r.preacher_id,
        avatar_url: r.avatar_url,
        total_seconds: r.total_seconds,
        session_count: r.session_count,
      }));
      setData(rows);
    } catch (err) {
      setData([]);
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-4xl mx-auto card-vhs p-4 rounded-lg mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold vhs-heading">Statistics</h2>
        <div className="flex items-center gap-2">
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="bg-transparent border border-white/10 p-1 rounded">
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
            <option value={365}>365 days</option>
          </select>
          <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="bg-transparent border border-white/10 p-1 rounded">
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
          </select>
          <button className="btn btn-sm btn-ghost" onClick={fetchStats} disabled={loading}>Refresh</button>
        </div>
      </div>

      <div style={{ height: 280 }} className="mb-4 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.map((d) => ({ name: d.name, value: d.total_seconds }))}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={4}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: any) => formatDuration(v)} />
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <div className="text-sm muted">Total</div>
          <div className="text-lg font-semibold">{formatDuration(data.reduce((s, r) => s + (r.total_seconds || 0), 0))}</div>
        </div>
      </div>

      <div className="mt-3">
        {data.length === 0 ? (
          <div className="text-sm muted">No data</div>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {(() => {
              const total = data.reduce((s, r) => s + (r.total_seconds || 0), 0);
              return data.map((r, i) => {
                const value = r.total_seconds || 0;
                const pct = total ? Math.round((value / total) * 100) : 0;
                return (
                  <li key={i} className="p-3 bg-transparent border border-white/6 rounded flex items-center gap-3">
                    <div className="w-3 h-3 rounded-sm" style={{ background: PALETTE[i % PALETTE.length] }} />
                    {r.avatar_url ? <img src={r.avatar_url} className="w-10 h-10 rounded-full object-cover" alt={r.name} /> : <div className="w-10 h-10 rounded-full bg-white/6 flex items-center justify-center">{(r.name||'')[0]}</div>}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{r.name}</div>
                      <div className="text-sm muted">{r.session_count} sessions • {formatDuration(value)}</div>
                    </div>
                    <div className="text-sm muted text-right">
                      <div>{pct}%</div>
                      <div className="text-xs">{dayjs().subtract(days, 'day').format('MMM D')}–{dayjs().format('MMM D')}</div>
                    </div>
                  </li>
                );
              });
            })()}
          </ul>
        )}
      </div>
    </div>
  );
}
