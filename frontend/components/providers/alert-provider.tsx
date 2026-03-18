"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { ToastAlert } from "@/components/ui/alert"
import { AnimatePresence, motion } from "framer-motion"

type AlertVariant = "default" | "destructive" | "success" | "warning" | "info"

interface Alert {
  id: string
  variant: AlertVariant
  title?: string
  description?: string
  duration?: number
}

interface AlertContextType {
  alerts: Alert[]
  showAlert: (alert: Omit<Alert, "id">) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  removeAlert: (id: string) => void
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>([])

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id))
  }, [])

  const showAlert = useCallback((alert: Omit<Alert, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newAlert = { ...alert, id }
    
    setAlerts((prev) => [...prev, newAlert])

    // Auto-remove after duration (default 5 seconds)
    const duration = alert.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => {
        removeAlert(id)
      }, duration)
    }
  }, [removeAlert])

  const success = useCallback((title: string, description?: string) => {
    showAlert({ variant: "success", title, description })
  }, [showAlert])

  const error = useCallback((title: string, description?: string) => {
    showAlert({ variant: "destructive", title, description })
  }, [showAlert])

  const info = useCallback((title: string, description?: string) => {
    showAlert({ variant: "info", title, description })
  }, [showAlert])

  const warning = useCallback((title: string, description?: string) => {
    showAlert({ variant: "warning", title, description })
  }, [showAlert])

  return (
    <AlertContext.Provider
      value={{ alerts, showAlert, success, error, info, warning, removeAlert }}
    >
      {children}
      {/* Global Alert Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm">
        <AnimatePresence mode="popLayout">
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              layout
            >
              <ToastAlert
                variant={alert.variant}
                title={alert.title}
                description={alert.description}
                onClose={() => removeAlert(alert.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </AlertContext.Provider>
  )
}

export function useAlerts() {
  const context = useContext(AlertContext)
  if (context === undefined) {
    throw new Error("useAlerts must be used within an AlertProvider")
  }
  return context
}
