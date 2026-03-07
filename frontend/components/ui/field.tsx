"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

function FieldGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn("space-y-3", className)}
      {...props}
    />
  )
}

function Field({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & { orientation?: "vertical" | "horizontal" }) {
  return (
    <div
      data-slot="field"
      className={cn(
        "group flex gap-2",
        orientation === "horizontal" ? "flex-row items-start" : "flex-col",
        className,
      )}
      {...props}
    />
  )
}

function FieldContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      className={cn("flex flex-col gap-0.5", className)}
      {...props}
    />
  )
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn("text-sm font-medium", className)}
      {...props}
    />
  )
}

function FieldTitle({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="field-title"
      className={cn(
        "text-sm font-medium text-gray-900 dark:text-white",
        className,
      )}
      {...props}
    />
  )
}

function FieldDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        "text-xs text-gray-500 dark:text-[#888]",
        className,
      )}
      {...props}
    />
  )
}

export {
  FieldGroup,
  Field,
  FieldContent,
  FieldLabel,
  FieldTitle,
  FieldDescription,
}
