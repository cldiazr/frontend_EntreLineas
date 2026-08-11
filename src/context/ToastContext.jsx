import { createContext, useCallback, useMemo, useState } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";

export const ToastContext = createContext(null);

let nextId = 1;

const styles = {
  success: "border-emerald-300 bg-emerald-50 text-emerald-800",
  error: "border-red-300 bg-red-50 text-red-800",
  info: "border-sky-300 bg-sky-50 text-sky-800",
};

const icons = {
  success: <CheckCircle2 className="h-5 w-5 shrink-0" />,
  error: <XCircle className="h-5 w-5 shrink-0" />,
  info: <Info className="h-5 w-5 shrink-0" />,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (type, text) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, type, text }]);
      setTimeout(() => remove(id), 5000);
    },
    [remove]
  );

  const value = useMemo(
    () => ({
      success: (text) => show("success", text),
      error: (text) => show("error", text),
      info: (text) => show("info", text),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-full max-w-sm flex-col gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg ${styles[toast.type]}`}
            role="status"
          >
            {icons[toast.type]}
            <span className="flex-1">{toast.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
