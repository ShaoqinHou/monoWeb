import { useState, useEffect, useCallback, useRef } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

// ── Toast types ──

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  variant: ToastVariant;
  message: string;
}

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

// ── Global toast event bus ──

type ToastListener = (toast: Omit<ToastMessage, 'id'>) => void;

const listeners = new Set<ToastListener>();
let toastIdCounter = 0;

export function showToast(variant: ToastVariant, message: string): void {
  for (const listener of listeners) {
    listener({ variant, message });
  }
}

// ── ToastItem ──

const ICON_MAP: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const BG_MAP: Record<ToastVariant, string> = {
  success: 'bg-[#14b8a6]',
  error: 'bg-[#ef4444]',
  warning: 'bg-[#f59e0b]',
  info: 'bg-[#0078c8]',
};

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const Icon = ICON_MAP[toast.variant];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-white shadow-lg ${BG_MAP[toast.variant]}`}
      role="alert"
      data-testid={`toast-${toast.variant}`}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span className="text-sm font-medium flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-full p-0.5 hover:bg-white/20 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

// ── ToastContainer ──

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastsRef = useRef(toasts);
  toastsRef.current = toasts;

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const listener: ToastListener = ({ variant, message }) => {
      const id = `toast-${++toastIdCounter}`;
      setToasts((prev) => [...prev, { id, variant, message }]);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm"
      data-testid="toast-container"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  );
}
