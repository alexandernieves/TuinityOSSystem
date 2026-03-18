import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react"

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "bg-red-50 border-red-500/50 text-red-700 dark:bg-red-950/20 dark:border-red-500/30 dark:text-red-400 [&>svg]:text-red-500",
        success: "bg-emerald-50 border-emerald-500/50 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-500/30 dark:text-emerald-400 [&>svg]:text-emerald-500",
        warning: "bg-amber-50 border-amber-500/50 text-amber-700 dark:bg-amber-950/20 dark:border-amber-500/30 dark:text-amber-400 [&>svg]:text-amber-500",
        info: "bg-blue-50 border-blue-500/50 text-blue-700 dark:bg-blue-950/20 dark:border-blue-500/30 dark:text-blue-400 [&>svg]:text-blue-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

const AlertAction = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute right-2 top-2 flex items-center gap-2",
      className
    )}
    {...props}
  />
))
AlertAction.displayName = "AlertAction"

// Toast Alert Component - For inline toast-like notifications
interface ToastAlertProps extends VariantProps<typeof alertVariants> {
  title?: string
  description?: string
  onClose?: () => void
  className?: string
  icon?: React.ComponentType<{ className?: string }>
}

function ToastAlert({
  variant = "default",
  title,
  description,
  onClose,
  className,
  icon: CustomIcon,
}: ToastAlertProps) {
  const IconComponent = CustomIcon || {
    default: Info,
    destructive: AlertCircle,
    success: CheckCircle2,
    warning: AlertTriangle,
    info: Info,
  }[variant || "default"]

  return (
    <Alert variant={variant} className={cn("shadow-sm", className)}>
      <IconComponent className="h-4 w-4" />
      {title && <AlertTitle>{title}</AlertTitle>}
      {description && <AlertDescription>{description}</AlertDescription>}
      {onClose && (
        <AlertAction>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </AlertAction>
      )}
    </Alert>
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction, ToastAlert }
