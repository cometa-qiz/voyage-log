"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useToastImpl } from "@/hooks/useToast";
import { ToastList } from "@/components/ToastList";

type ToastContextValue = ReturnType<typeof useToastImpl>;

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useToastImpl();
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastList toasts={toast.toasts} onDismiss={toast.dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToastContext(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToastContext must be used within a ToastProvider");
  }
  return ctx;
}
