"use client"

import * as React from "react"
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react"

import { cn } from "@/lib/utils"

type ToastType = "success" | "error" | "info" | "warning"

interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

interface ToastProviderProps {
  children: React.ReactNode
}

export function ToastProvider({ children }: ToastProviderProps): React.ReactNode {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const removeToast = React.useCallback(function removeToast(id: string): void {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const addToast = React.useCallback(
    function addToast(toast: Omit<Toast, "id">): void {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const duration = toast.duration ?? 5000

      setToasts((prev) => [...prev, { ...toast, id }])

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }
    },
    [removeToast]
  )

  const success = React.useCallback(
    function success(title: string, description?: string): void {
      addToast({ type: "success", title, description })
    },
    [addToast]
  )

  const error = React.useCallback(
    function error(title: string, description?: string): void {
      addToast({ type: "error", title, description, duration: 7000 })
    },
    [addToast]
  )

  const info = React.useCallback(
    function info(title: string, description?: string): void {
      addToast({ type: "info", title, description })
    },
    [addToast]
  )

  const warning = React.useCallback(
    function warning(title: string, description?: string): void {
      addToast({ type: "warning", title, description })
    },
    [addToast]
  )

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, info, warning }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps): React.ReactNode {
  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-3"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

const TOAST_ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
} as const

const TOAST_COLORS = {
  success: "bg-brutal-green",
  error: "bg-brutal-red",
  info: "bg-brutal-blue",
  warning: "bg-brutal-yellow",
} as const

const TOAST_TEXT_COLORS = {
  success: "text-black",
  error: "text-white",
  info: "text-white",
  warning: "text-black",
} as const

interface ToastItemProps {
  toast: Toast
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps): React.ReactNode {
  const Icon = TOAST_ICONS[toast.type]

  return (
    <div
      className={cn(
        "animate-in slide-in-from-right-full fade-in duration-200",
        "flex w-[360px] max-w-[calc(100vw-2rem)] items-start gap-3",
        "border-3 border-black p-4",
        "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
        TOAST_COLORS[toast.type],
        TOAST_TEXT_COLORS[toast.type]
      )}
      role="alert"
    >
      <Icon
        className="mt-0.5 h-5 w-5 flex-shrink-0"
        strokeWidth={2.5}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="font-bold">{toast.title}</p>
        {toast.description && (
          <p className="mt-1 text-sm opacity-90">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className={cn(
          "flex-shrink-0 rounded-none p-1 transition-opacity hover:opacity-70",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
        )}
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
      </button>
    </div>
  )
}
