import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export function SheetContent({
  className,
  children,
  title,
  side = "bottom",
}: {
  className?: string;
  children: React.ReactNode;
  title: string;
  side?: "bottom" | "right";
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40" />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-50 bg-surface shadow-[0_0_0_1px_rgba(28,25,21,0.08),0_-8px_32px_rgba(28,25,21,0.12)]",
          side === "bottom" &&
            "inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]",
          side === "right" &&
            "top-0 right-0 h-full w-80 overflow-y-auto p-5",
          className,
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <DialogPrimitive.Title className="font-display text-lg font-medium">
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Close asChild>
            <Button variant="ghost" size="iconSm" aria-label="Fermer">
              <X />
            </Button>
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
