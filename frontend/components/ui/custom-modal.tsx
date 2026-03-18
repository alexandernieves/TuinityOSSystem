import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "./dialog"
import { cn } from "@/lib/utils"

export interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  scrollable?: boolean;
  children: React.ReactNode;
}

const sizeClasses = {
  sm: "sm:max-w-[425px]",
  md: "sm:max-w-[600px]",
  lg: "sm:max-w-[800px]",
  xl: "sm:max-w-[1000px]",
  full: "w-full h-full max-w-full m-0 rounded-none",
};

export function CustomModal({
  isOpen,
  onClose,
  size = "md",
  scrollable = false,
  children,
}: CustomModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          sizeClasses[size],
          scrollable && "max-h-[90vh] flex flex-col overflow-hidden"
        )}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}

export function CustomModalHeader({
  children,
  onClose, // Deprecated: Dialog handles close natively, keeping for compatibility
  className,
}: {
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}) {
  return (
    <DialogHeader className={cn("text-lg font-semibold", className)}>
      <DialogTitle asChild>
        <div>{children}</div>
      </DialogTitle>
    </DialogHeader>
  )
}

export function CustomModalBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex-1 overflow-y-auto py-2 pr-1", className)}>
      {children}
    </div>
  )
}

export function CustomModalFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <DialogFooter className={cn("pt-4 items-center sm:justify-end gap-2", className)}>
      {children}
    </DialogFooter>
  )
}
