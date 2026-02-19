"use client";

import { useEffect, useState } from "react";
import { CheckCircle, FlaskConical } from "lucide-react";

export type ToastType = "sim" | "live";

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "5rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 300,
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: number) => void }) {
  const [visible, setVisible] = useState(false);

  const isSim = toast.type === "sim";
  const color = isSim ? "#f59e0b" : "#34d399";
  const border = isSim ? "rgba(245,158,11,0.3)" : "rgba(52,211,153,0.3)";
  const bg = isSim ? "rgba(245,158,11,0.08)" : "rgba(52,211,153,0.08)";
  const Icon = isSim ? FlaskConical : CheckCircle;

  useEffect(() => {
    // Fade in
    const showTimer = requestAnimationFrame(() => setVisible(true));
    // Auto-dismiss after 2.5s
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 300);
    }, 2500);
    return () => {
      cancelAnimationFrame(showTimer);
      clearTimeout(hideTimer);
    };
  }, [toast.id, onDismiss]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.625rem",
        padding: "0.625rem 1rem",
        background: `color-mix(in srgb, var(--dropdown-bg) 90%, transparent)`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${border}`,
        borderRadius: "10px",
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${border}`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(8px) scale(0.97)",
        transition: "opacity 0.25s ease, transform 0.25s ease",
        pointerEvents: "auto",
        whiteSpace: "nowrap",
        backgroundColor: "var(--dropdown-bg)",
      }}
    >
      <div
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "6px",
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={13} color={color} />
      </div>
      <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--fg1)" }}>
        {toast.message}
      </span>
      <span
        style={{
          fontSize: "0.625rem",
          fontWeight: 700,
          color,
          padding: "0.1rem 0.4rem",
          borderRadius: "9999px",
          background: bg,
          border: `1px solid ${border}`,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        {isSim ? "Demo" : "Live"}
      </span>
    </div>
  );
}
