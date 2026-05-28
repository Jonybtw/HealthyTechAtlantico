"use client";

import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const isDanger = variant === "danger";
  const Icon = isDanger ? ShieldAlert : AlertTriangle;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent hideClose>
        <div
          className={`absolute inset-x-0 top-0 h-1 ${
            isDanger
              ? "bg-gradient-to-r from-danger-500 via-rose-500 to-danger-700"
              : "bg-gradient-to-r from-gold-300 via-gold-500 to-navy-800"
          }`}
        />
        <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-gold-300/10 blur-3xl" />

        <div className="relative space-y-4">
          <DialogHeader className="flex-row items-start gap-4 text-left">
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-[8px] ring-1 ${
                isDanger
                  ? "bg-danger-100/80 text-danger-700 ring-danger-500/20 dark:bg-danger-500/10 dark:text-danger-300"
                  : "bg-gold-100/80 text-gold-700 ring-gold-500/20 dark:bg-gold-400/10 dark:text-gold-300"
              }`}
            >
              <Icon className="size-5" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="font-display text-xl font-semibold tracking-tight">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                {message}
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={isDanger ? "danger" : "primary"}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
