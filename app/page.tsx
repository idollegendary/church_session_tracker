import Link from 'next/link';
import dynamic from 'next/dynamic';

const Collapsible = dynamic(() => import('../components/Collapsible')) as any;

export default function Page() {
  return (
    <div className="prose max-w-none">
      <div className="mb-4">
        <div className="text-sm">Contacts:</div>
        <div className="text-sm">
          Telegram: <a href="https://t.me/idollegendary" className="text-blue-400">@idollegendary</a> &nbsp;•&nbsp; Instagram: <a href="https://instagram.com/cyberchurch72" className="text-blue-400">@cyberchurch72</a>
        </div>
      </div>

      <h1 className="text-2xl font-semibold mb-4">Session Tracker</h1>
      <p>
        This project is a lightweight session/time tracker intended to record sermon durations and simplify
        timekeeping for organizers. It stores sessions and preachers in a Postgres database and provides
        a minimal admin interface to start/stop sessions in real time.
      </p>

      <h2 className="mt-4">About</h2>
      <p>
        Purpose: track sermon durations, provide quick reports, and enable simple realtime updates across
        devices. Developed by the project maintainer for internal use; contributions welcome.
      </p>

      <h2 className="mt-4">Technologies</h2>
      <p>This site is built with the following stack:</p>
      <ul>
        <li><strong>Frontend:</strong> React, Next.js (App Router), TypeScript, Tailwind CSS</li>
        <li><strong>State & Forms:</strong> zustand, react-hook-form, zod</li>
        <li><strong>Date & Charts:</strong> dayjs, recharts</li>
        <li><strong>Backend / Database:</strong> Supabase (Postgres, Realtime, Auth), server-side API routes, SQL migrations</li>
        <li><strong>Auth:</strong> custom `admins` table with PBKDF2 password hashing and HMAC-signed admin cookie</li>
        <li><strong>Dev / Deployment:</strong> Node scripts for migrations and admin creation, Docker (local dev), deploy to Vercel</li>
      </ul>

      <h2 className="mt-4">Built From</h2>
      <p>The site combines a Next.js frontend with Supabase as a hosted Postgres + realtime backend. Lightweight server helpers (in <code>lib/</code>) handle password hashing, JWT signing, and the Supabase service-role operations for migrations and admin creation.</p>

      <Collapsible title="Changelog" defaultOpen={false}>
        <ul>
          <li><strong>2026-01-28</strong> — Reworked admin auth to httpOnly cookie; added admin login/logout endpoints; replaced client magic-link flow.</li>
          <li><strong>2026-01-28</strong> — Fixed timer UI to use admin auth, guarded realtime subscriptions, and implemented cross-window auth events.</li>
          <li><strong>2026-01-28</strong> — Implemented singleton Supabase client to avoid duplicate GoTrue instances and reduced websocket/401 noise.</li>
          <li><strong>2026-01-28</strong> — Added profile fields for admins and migration scripts; created admin creation utility.</li>
          <li><strong>2026-01-29</strong> — Moved Preachers creation into modal and rendered preachers as responsive cards; clicking a card opens edit/delete modal.</li>
          <li><strong>2026-01-29</strong> — Fixed double delete confirmation in Preachers modal (centralized confirm in server-delete handler).</li>
          <li><strong>2026-01-29</strong> — Added mobile hamburger menu to header (mobile nav only); removed per-page mobile menu to keep header consistent.</li>
          <li><strong>2026-01-29</strong> — Avatar fallback now uses initials from the first letters of the first two words (or first two letters of single name); applied to Preachers and Sessions views.</li>
          <li><strong>2026-01-29</strong> — Persist running session across reloads; recent sessions now show preacher name and avatar; session durations formatted HH:MM:SS.</li>
          <li><strong>2026-01-29</strong> — Dark theme / UI polish: removed white boxes on inputs, improved contrast on cards and charts, and made pages more mobile-friendly.</li>
        </ul>
      </Collapsible>
    </div>
  );
}
