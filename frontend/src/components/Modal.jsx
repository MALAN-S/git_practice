import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ isOpen, onClose, children, maxWidth = 'max-w-xl' }) {
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen z-[9999] bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div
        className={`relative w-full ${maxWidth} bg-white/95 backdrop-blur-xl rounded-[32px] pt-5 pb-6 px-6 sm:pt-6 sm:pb-7 sm:px-8 shadow-[0_25px_60px_-15px_rgba(99,102,241,0.2),0_15px_30px_-10px_rgba(0,0,0,0.1)] border border-white/80 space-y-5`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Purple Gradient Glow Contained */}
        <div className="absolute inset-0 rounded-[32px] overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-72 h-72 bg-gradient-to-bl from-purple-500/35 via-violet-400/25 to-transparent rounded-full blur-2xl" />
          <div className="absolute -top-12 left-0 w-64 h-36 bg-gradient-to-b from-indigo-300/20 via-purple-300/10 to-transparent rounded-full blur-2xl" />
          <div className="absolute -bottom-16 -left-16 w-60 h-60 bg-gradient-to-tr from-indigo-300/15 via-purple-300/10 to-transparent rounded-full blur-3xl" />
        </div>

        {children}
      </div>
    </div>,
    document.body
  );
}

