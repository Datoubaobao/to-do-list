"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: "left" | "right" | "top" | "bottom";
  className?: string;
}

export function Sheet({
  open,
  onOpenChange,
  children,
  side = "left",
  className,
}: SheetProps) {
  // 处理 ESC 键关闭
  React.useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    // 防止背景滚动
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const sideClasses = {
    left: "left-0 top-0 h-full",
    right: "right-0 top-0 h-full",
    top: "top-0 left-0 w-full",
    bottom: "bottom-0 left-0 w-full",
  };

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      {/* Sheet 内容 */}
      <div
        className={cn(
          "fixed z-50 bg-background shadow-lg transition-transform duration-300 md:hidden",
          sideClasses[side],
          side === "left" && "w-64",
          side === "right" && "w-full max-w-sm",
          side === "top" && "h-96",
          side === "bottom" && "h-[90dvh] max-h-[90dvh] rounded-t-lg",
          className
        )}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>
  );
}

interface SheetContentProps {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
  className?: string;
}

export function SheetContent({
  children,
  onClose,
  title,
  className,
}: SheetContentProps) {
  const hasHeader = title || onClose;
  
  return (
    <div className={cn("h-full flex flex-col", className)}>
      {hasHeader && (
        <div className="flex items-center justify-between p-4 border-b">
          {title && <h2 className="font-semibold text-lg">{title}</h2>}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="关闭"
              className="h-10 w-10"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      )}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
