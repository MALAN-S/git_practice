import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Check, X, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

let globalToastHandler = null;

export const toast = {
  success: (msg, duration = 3800) => {
    if (globalToastHandler) {
      globalToastHandler(msg, 'success', duration);
    } else {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: msg, type: 'success', duration } }));
    }
  },
  error: (msg, duration = 4500) => {
    if (globalToastHandler) {
      globalToastHandler(msg, 'error', duration);
    } else {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: msg, type: 'error', duration } }));
    }
  },
  info: (msg, duration = 3800) => {
    if (globalToastHandler) {
      globalToastHandler(msg, 'info', duration);
    } else {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: msg, type: 'info', duration } }));
    }
  }
};

if (typeof window !== 'undefined') {
  window.toast = toast;
}

/* ── Individual Toast Item (Pure isolated component with memo & zero parent re-renders) ── */
const ToastItem = React.memo(function ToastItem({ toastItem, onDismiss }) {
  const [isExiting, setIsExiting] = useState(false);
  const [isItemHovered, setIsItemHovered] = useState(false);
  const exitTimeoutRef = useRef(null);

  const handleClose = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    // 360ms matches slide-out (0.24s) + staggered height collapse (0.14s delay + 0.20s duration)
    exitTimeoutRef.current = setTimeout(() => {
      onDismiss(toastItem.id);
    }, 360);
  }, [isExiting, onDismiss, toastItem.id]);

  useEffect(() => {
    if (isItemHovered || isExiting) return;
    const timer = setTimeout(() => {
      handleClose();
    }, toastItem.duration || 3800);
    return () => clearTimeout(timer);
  }, [isItemHovered, isExiting, handleClose, toastItem.duration]);

  useEffect(() => {
    return () => {
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    };
  }, []);

  const isError = toastItem.type === 'error';

  return (
    <div className={`toast-row-wrapper ${isExiting ? 'is-leaving' : ''}`}>
      <div className="toast-row-content pl-2 pb-2.5 pt-0.5 pr-0.5">
        <div
          onMouseEnter={() => setIsItemHovered(true)}
          onMouseLeave={() => setIsItemHovered(false)}
          className={`pointer-events-auto relative flex items-center gap-3.5 px-4 py-3 rounded-2xl w-[390px] min-w-[390px] max-w-[390px] min-h-[52px] select-none ${
            isExiting ? 'toast-item-exit' : 'toast-item-enter'
          } ${isError ? 'toast-card-error' : 'toast-card-blue'}`}
        >
          {/* Circular Badge Icon */}
          {isError ? (
            <div className="w-8 h-8 rounded-full bg-[#e11d48] text-white flex items-center justify-center shrink-0 shadow-sm">
              <AlertCircle className="w-4 h-4 stroke-[2.5]" />
            </div>
          ) : toastItem.type === 'info' ? (
            <div className="w-8 h-8 rounded-full bg-[#0066ff] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Info className="w-4 h-4 stroke-[2.8]" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#0066ff] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
          )}

          {/* Message Text */}
          <span
            className={`text-[13.5px] font-semibold leading-snug tracking-tight flex-1 pr-1 break-words ${
              isError ? 'text-[#881337]' : 'text-[#1e3a8a]'
            }`}
          >
            {toastItem.message}
          </span>

          {/* Close Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition shrink-0 cursor-pointer ${
              isError
                ? 'text-[#881337] hover:bg-rose-200/60 hover:text-rose-950'
                : 'text-[#1e3a8a] hover:bg-blue-200/60 hover:text-[#0066ff]'
            }`}
            title="Close notification"
          >
            <X className="w-4 h-4 stroke-[2.4]" />
          </button>
        </div>
      </div>
    </div>
  );
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'success', duration = 3800) => {
    if (!message) return;
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  useEffect(() => {
    globalToastHandler = addToast;
    const handleCustomToast = (e) => {
      if (e.detail?.message) {
        addToast(e.detail.message, e.detail.type || 'success', e.detail.duration || 3800);
      }
    };
    window.addEventListener('app-toast', handleCustomToast);
    return () => {
      globalToastHandler = null;
      window.removeEventListener('app-toast', handleCustomToast);
    };
  }, [addToast]);

  const contextValue = useMemo(() => ({ addToast, removeToast }), [addToast, removeToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast Notification Container (Top Right Corner with fixed width) */}
      <div className="fixed top-6 right-6 z-[99999] flex flex-col pointer-events-none items-end w-[410px] no-print">
        {toasts.map((t) => (
          <ToastItem
            key={t.id}
            toastItem={t}
            onDismiss={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
