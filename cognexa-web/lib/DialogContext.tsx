"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastKind = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface DialogContextValue {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
  notify: (message: string, kind?: ToastKind) => void;
}

const DialogContext = createContext<DialogContextValue>({
  confirm: async () => false,
  notify: () => {},
});

export function useDialog() {
  return useContext(DialogContext);
}

let toastId = 0;

export default function DialogProvider({ children }: { children: React.ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions | string) => {
    const normalized: ConfirmOptions =
      typeof options === "string" ? { message: options } : options;

    setConfirmState(normalized);

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const notify = useCallback((message: string, kind: ToastKind = "info") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  function handleClose(result: boolean) {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setConfirmState(null);
  }

  return (
    <DialogContext.Provider value={{ confirm, notify }}>
      {children}

      {confirmState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl animate-fade-in border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {confirmState.title ?? "Are you sure?"}
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {confirmState.message}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => handleClose(false)}
                className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {confirmState.cancelLabel ?? "Cancel"}
              </button>
              <button
                onClick={() => handleClose(true)}
                className={`rounded-xl px-4 py-2 text-sm font-medium text-white shadow-md transition hover:shadow-lg ${
                  confirmState.danger
                    ? "bg-red-600 hover:bg-red-700 shadow-red-500/20"
                    : "bg-gradient-to-r from-indigo-600 to-fuchsia-600 shadow-indigo-500/20"
                }`}
              >
                {confirmState.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-fade-in rounded-xl px-4 py-3 text-sm font-medium shadow-lg border ${
              toast.kind === "success"
                ? "bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                : toast.kind === "error"
                ? "bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </DialogContext.Provider>
  );
}
