import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { TONE_TEXT, type Tone } from "./badge";

/** Placeholder shown when an API does not provide a value. Never a fake number. */
export function Unavailable({ className, label = "Date indisponibile" }: { className?: string; label?: string }) {
  return <span className={cn("text-sm font-medium text-subtle", className)}>{label}</span>;
}

export function Stat({
  label,
  value,
  tone = "neutral",
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  tone?: Tone;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="text-xs text-muted">{label}</div>
      <div className={cn("tabular truncate text-sm font-semibold", TONE_TEXT[tone])}>{value}</div>
      {hint ? <div className="truncate text-[11px] text-subtle">{hint}</div> : null}
    </div>
  );
}
