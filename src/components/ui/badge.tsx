import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "neutral",
  children,
}: {
  className?: string;
  tone?: "neutral" | "ok" | "danger" | "warn" | "cover";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone === "neutral" && "bg-surface-2 text-muted",
        tone === "ok" && "bg-ok/10 text-ok",
        tone === "danger" && "bg-danger/10 text-danger",
        tone === "warn" && "bg-warn/10 text-warn",
        tone === "cover" && "bg-cover/10 text-cover",
        className,
      )}
    >
      {children}
    </span>
  );
}
