"use client";

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import dayjs from 'dayjs';

type Session = {
  id: string;
  started_at: string;
  ended_at?: string | null;
  duration?: number | null;
};

function aggregateByDay(sessions: Session[]) {
  const map: Record<string, number> = {};
  sessions.forEach((s) => {
    const day = dayjs(s.started_at).format('YYYY-MM-DD');
    const dur = s.duration ?? (s.ended_at ? Math.floor((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000) : 0);
    map[day] = (map[day] || 0) + dur;
  });
  return Object.keys(map)
    .sort()
    .map((k) => ({ day: k, seconds: map[k] }));
}

export default function SessionsChart({ sessions }: { sessions: Session[] }) {
  const data = aggregateByDay(sessions).map((d) => ({ ...d, minutes: Math.round(d.seconds / 60) }));

  if (!data.length) {
    return <div className="text-sm text-gray-500">No data for chart.</div>;
  }

  return (
    <div style={{ width: '100%', height: 240 }} className="mt-4">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }} style={{ background: 'transparent' }}>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#cbd5e1' }} />
          <YAxis tick={{ fill: '#cbd5e1' }} />
          <Tooltip wrapperStyle={{ background: '#071020', border: '1px solid rgba(255,255,255,0.06)' }} formatter={(value: any) => `${value} min`} />
          <Bar dataKey="minutes" fill="#7c3aed" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
