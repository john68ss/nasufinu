"use client";

import { cn } from "@/lib/utils/cn";

interface Option<T extends string> {
  value: T;
  label: string;
}

/** Touch-friendly segmented control (radio group semantics). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border border-line bg-surface-2 p-0.5">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "min-h-8 min-w-9 rounded-md px-2.5 text-[11px] font-semibold transition-colors",
              "focus-visible:outline-2 focus-visible:outline-accent",
              active ? "bg-accent-strong text-white" : "text-muted hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
