import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export type Tone = "neutral" | "ok" | "warn" | "danger" | "accent";

export const TONE_TEXT: Record<Tone, string> = {
  neutral: "text-foreground",
  ok: "text-ok",
  warn: "text-warn",
  danger: "text-danger",
  accent: "text-cyan",
};

const TONE_BADGE: Record<Tone, string> = {
  neutral: "border-line-strong bg-surface-2 text-muted",
  ok: "border-ok/30 bg-ok/10 text-ok",
  warn: "border-warn/30 bg-warn/10 text-warn",
  danger: "border-danger/30 bg-danger/10 text-danger",
  accent: "border-accent/30 bg-accent/10 text-cyan",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONE_BADGE[tone],
        className,
      )}
      {...props}
    />
  );
}

export function StatusDot({ tone, pulse = false, className }: { tone: Tone; pulse?: boolean; className?: string }) {
  const color: Record<Tone, string> = {
    neutral: "bg-subtle",
    ok: "bg-ok",
    warn: "bg-warn",
    danger: "bg-danger",
    accent: "bg-cyan",
  };
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2 rounded-full", color[tone], pulse && "animate-pulse-dot", className)}
    />
  );
}
