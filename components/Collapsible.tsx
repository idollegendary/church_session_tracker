"use client";

import { useState, PropsWithChildren } from 'react';

export default function Collapsible({ title, defaultOpen = false, children }: PropsWithChildren<{ title: string; defaultOpen?: boolean }>) {
  const [open, setOpen] = useState<boolean>(!!defaultOpen);
  return (
    <div className="mb-4">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen(v => !v); }}
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-white/6 transition-colors"
        aria-expanded={open}
      >
        <div className="font-semibold select-none">{title}</div>
        <div className="flex items-center">
          <span className="text-sm muted mr-2">{open ? 'Hide' : 'Show'}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 transform transition-transform duration-200 ${open ? 'rotate-180' : 'rotate-0'}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.832l3.71-3.6a.75.75 0 111.04 1.08l-4.24 4.12a.75.75 0 01-1.04 0L5.21 8.31a.75.75 0 01.02-1.1z" clipRule="evenodd"/>
          </svg>
        </div>
      </div>
      {open ? <div className="mt-3 pl-2">{children}</div> : null}
    </div>
  );
}
