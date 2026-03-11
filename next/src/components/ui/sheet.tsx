"use client";

import * as React from "react";
import { DialogTitle } from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";

// Sheet is built on top of Dialog but slides in from a side.
// Re-export Dialog primitives with Sheet naming.

const Sheet = Dialog;
const SheetTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof import("@radix-ui/react-dialog").Trigger>
>((props, ref) => {
  const Trigger = React.lazy(() =>
    import("@radix-ui/react-dialog").then((mod) => ({ default: mod.Trigger }))
  );
  return (
    <React.Suspense fallback={null}>
      <Trigger ref={ref} {...props} />
    </React.Suspense>
  );
});
SheetTrigger.displayName = "SheetTrigger";

const SheetClose = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof import("@radix-ui/react-dialog").Close>
>((props, ref) => {
  const Close = React.lazy(() =>
    import("@radix-ui/react-dialog").then((mod) => ({ default: mod.Close }))
  );
  return (
    <React.Suspense fallback={null}>
      <Close ref={ref} {...props} />
    </React.Suspense>
  );
});
SheetClose.displayName = "SheetClose";

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<"div"> {
  side?: "top" | "right" | "bottom" | "left";
  onClose?: () => void;
}

const sideVariants = {
  top: "inset-x-0 top-0 border-b rounded-b-[28px] data-[state=closed]:-translate-y-full data-[state=open]:translate-y-0",
  bottom:
    "inset-x-0 bottom-0 border-t rounded-t-[28px] data-[state=closed]:translate-y-full data-[state=open]:translate-y-0",
  left: "inset-y-0 left-0 h-full w-3/4 max-w-sm border-r rounded-r-[28px] data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0",
  right:
    "inset-y-0 right-0 h-full w-3/4 max-w-sm border-l rounded-l-[28px] data-[state=closed]:translate-x-full data-[state=open]:translate-x-0",
};

import * as DialogPrimitive from "@radix-ui/react-dialog";

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ side = "right", className, children, ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content asChild>
        <div
          ref={ref}
          className={cn(
            "fixed z-50 gap-4 bg-card/95 p-6 shadow-float backdrop-blur-xl transition-transform duration-300 ease-in-out",
            sideVariants[side],
            className
          )}
          {...props}
        >
          <DialogTitle className="sr-only">Menu</DialogTitle>
          {children}
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring">
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </div>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
);
SheetContent.displayName = "SheetContent";

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
  );
}

function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("font-display text-lg font-semibold text-foreground", className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription };
