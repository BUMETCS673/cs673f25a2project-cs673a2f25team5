"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import { Transition } from "@headlessui/react";

type ToastType = "success" | "error" | "info";

type ToastRecord = {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  duration: number;
};

export type ToastOptions = {
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
};

type ToastContextValue = {
  showToast: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TYPE_STYLES: Record<ToastType, string> = {
  success:
    "border-emerald-300/70 bg-emerald-500/10 text-emerald-900 dark:border-emerald-300/40 dark:bg-emerald-400/10 dark:text-emerald-100",
  error:
    "border-red-300/70 bg-red-500/10 text-red-900 dark:border-red-300/40 dark:bg-red-400/10 dark:text-red-100",
  info: "border-neutral-300/70 bg-white/95 text-neutral-900 dark:border-white/15 dark:bg-neutral-900/85 dark:text-neutral-100",
};

const DEFAULT_DURATION = 4000;

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastRecord;
  onDismiss: (id: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));
    const timeout = window.setTimeout(
      () => setIsVisible(false),
      toast.duration,
    );

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [toast.duration]);

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <Transition
      appear
      show={isVisible}
      enter="transition ease-out duration-150"
      enterFrom="translate-x-3 opacity-0"
      enterTo="translate-x-0 opacity-100"
      leave="transition ease-in duration-200"
      leaveFrom="translate-x-0 opacity-100"
      leaveTo="translate-x-3 opacity-0"
      afterLeave={() => onDismiss(toast.id)}
    >
      <div
        className={`pointer-events-auto w-full max-w-sm rounded-2xl border px-4 py-3 shadow-lg shadow-black/10 backdrop-blur-sm ${TYPE_STYLES[toast.type]}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold">{toast.title}</p>
            {toast.description ? (
              <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                {toast.description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-current/20 text-xs font-semibold text-current transition hover:scale-105 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-current"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      </div>
    </Transition>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({
      title,
      description,
      type = "info",
      duration = DEFAULT_DURATION,
    }: ToastOptions) => {
      const id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      setToasts((prev) => [
        ...prev,
        { id, title, description, type, duration },
      ]);
    },
    [],
  );

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed bottom-6 left-6 z-50 flex max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
