import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { cn } from "../../lib/cn";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

/* ─── Types ─── */
export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastData {
  id: string;
  variant: ToastVariant;
  message: string;
  duration?: number;
}

export interface ToastOptions {
  variant: ToastVariant;
  message: string;
  duration?: number;
}

/* ─── Context ─── */
interface ToastContextValue {
  toasts: ToastData[];
  addToast: (options: ToastOptions) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

/* ─── Provider ─── */
export interface ToastProviderProps {
  children: ReactNode;
}

let toastCounter = 0;

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (options: ToastOptions): string => {
      const id = `toast-${++toastCounter}`;
      const toast: ToastData = {
        id,
        variant: options.variant,
        message: options.message,
        duration: options.duration ?? 5000,
      };
      setToasts((prev) => [...prev, toast]);
      return id;
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

/* ─── Container ─── */
interface ToastContainerProps {
  toasts: ToastData[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2"
      aria-live="polite"
      data-testid="toast-container"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

/* ─── Individual Toast ─── */
const variantStyles: Record<ToastVariant, string> = {
  success: "border-[#14b8a6] bg-[#14b8a6]/5",
  error: "border-[#ef4444] bg-[#ef4444]/5",
  info: "border-[#0078c8] bg-[#0078c8]/5",
  warning: "border-[#f59e0b] bg-[#f59e0b]/5",
};

const variantIcons: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-[#14b8a6]" />,
  error: <AlertCircle className="h-5 w-5 text-[#ef4444]" />,
  info: <Info className="h-5 w-5 text-[#0078c8]" />,
  warning: <AlertTriangle className="h-5 w-5 text-[#f59e0b]" />,
};

interface ToastItemProps {
  toast: ToastData;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      timerRef.current = setTimeout(() => {
        onRemove(toast.id);
      }, toast.duration);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border bg-white px-4 py-3 shadow-lg min-w-[320px] max-w-[420px]",
        variantStyles[toast.variant],
      )}
      role="alert"
      data-testid={`toast-${toast.id}`}
    >
      <span className="mt-0.5 shrink-0">{variantIcons[toast.variant]}</span>
      <p className="flex-1 text-sm text-[#1a1a2e]">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 rounded-sm p-0.5 text-[#6b7280] hover:bg-gray-100 hover:text-[#1a1a2e] transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
