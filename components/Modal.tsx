"use client";

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

type Props = {
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
};

export default function Modal({ children, onClose, className }: Props) {
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={className ?? 'relative z-10'}>{children}</div>
    </div>,
    document.body
  );
}
