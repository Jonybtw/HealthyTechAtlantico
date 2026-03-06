"use client";

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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-navy-950/80 backdrop-blur-xl animate-fade-in"
        style={{ animationDuration: "0.4s" }}
        onClick={onCancel}
      />
      {/* Card with Spring Physics */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-desc"
        className="relative bg-card/85 glass rounded-2xl border border-border/50 shadow-float
                      max-w-sm w-full p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-500 will-change-transform"
        style={{
          animationTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 1.275)"
        }}>
        {/* Variant accent line */}
        <div className={`absolute top-0 left-0 right-0 h-[3px] opacity-90 ${variant === "danger" ? "bg-gradient-to-r from-danger-400 to-danger-600" : "bg-gradient-to-r from-navy-500 to-navy-800"
          }`} />
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-white opacity-40 blur-[1px]" />

        <div className="pt-1">
          <h3 id="modal-title" className="text-base font-bold text-foreground">{title}</h3>
          <p id="modal-desc" className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{message}</p>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-muted/50 text-muted-foreground
                       hover:bg-muted/80 hover:text-foreground active:scale-95 transition-all duration-300"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 rounded-xl text-sm font-semibold text-white
                        active:scale-[0.98] active:translate-y-[1px] transition-all duration-300 shadow-sm hover:-translate-y-[1px] ring-1 inset-shadow-sm ${variant === "danger"
                ? "bg-gradient-to-b from-danger-500 to-danger-700 hover:from-danger-400 hover:to-danger-600 shadow-[0_4px_14px_rgba(220,38,38,0.39)] active:shadow-[inset_0_3px_6px_rgba(0,0,0,0.4)] ring-danger-800"
                : "bg-gradient-to-b from-navy-700 to-navy-900 hover:from-navy-600 hover:to-navy-800 shadow-[0_4px_14px_rgba(20,48,76,0.39)] active:shadow-[inset_0_3px_6px_rgba(0,0,0,0.4)] ring-navy-900"
              }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
