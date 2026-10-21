import { Fan, Flame, Gauge, Thermometer, Zap, Leaf } from "lucide-react";
import type { ReactNode } from "react";
import { Badge, StatusDot, TONE_TEXT, type Tone } from "@/components/ui/badge";
import { memTempLevel, tempLevel, gpuStatus } from "@/lib/calculations/gpu";
import { cn } from "@/lib/utils/cn";
import { formatEfficiency, formatHashrate, formatPercent, formatTemp, formatWatts } from "@/lib/utils/format";
import type { Thresholds } from "@/types/dashboard";
import type { Gpu, GpuLevel, GpuStatus } from "@/types/mining";

const LEVEL_TONE: Record<GpuLevel, Tone> = { ok: "ok", warning: "warn", critical: "danger", unknown: "neutral" };

const STATUS_VIEW: Record<GpuStatus, { label: string; tone: Tone }> = {
  ok: { label: "OK", tone: "ok" },
  warning: { label: "Cald", tone: "warn" },
  critical: { label: "Critic", tone: "danger" },
  idle: { label: "Inactiv", tone: "warn" },
  offline: { label: "Offline", tone: "neutral" },
};

const BORDER: Record<GpuStatus, string> = {
  ok: "border-line",
  warning: "border-warn/40",
  critical: "border-danger/50 shadow-[0_0_24px_-12px_var(--color-danger)]",
  idle: "border-warn/30",
  offline: "border-line opacity-70",
};

function Metric({ icon, label, value, tone = "neutral" }: { icon: ReactNode; label: string; value: ReactNode; tone?: Tone }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1 text-[10px] text-muted [&>svg]:size-3">
        {icon}
        <span>{label}</span>
      </div>
      <div className={cn("tabular truncate text-xs font-semibold", TONE_TEXT[tone])}>{value}</div>
    </div>
  );
}

export function GpuCard({ gpu, rigOnline, thresholds }: { gpu: Gpu; rigOnline: boolean | null; thresholds: Thresholds }) {
  const status = gpuStatus(gpu, rigOnline, thresholds);
  const view = STATUS_VIEW[status];
  const temp = tempLevel(gpu.tempC, thresholds);
  const mem = memTempLevel(gpu.memTempC, thresholds);

  return (
    <article
      aria-label={`GPU ${String(gpu.index + 1).padStart(2, "0")}`}
      className={cn("rounded-xl border bg-surface p-2.5 shadow-card transition-colors", BORDER[status])}
    >
      <header className="mb-2 flex items-start justify-between gap-1.5">
        <div className="min-w-0">
          <h3 className="text-xs font-semibold tracking-tight">GPU {String(gpu.index + 1).padStart(2, "0")}</h3>
          <p className="truncate text-[11px] text-muted">{gpu.model ?? "Model indisponibil"}</p>
        </div>
        <Badge tone={view.tone} className="shrink-0 px-1.5 py-0 text-[10px]">
          <StatusDot tone={view.tone} className="size-1.5" />
          {view.label}
        </Badge>
      </header>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        <Metric icon={<Gauge />} label="Hashrate" value={formatHashrate(gpu.hashrateHs)} />
        <Metric icon={<Leaf />} label="Eficiență" value={formatEfficiency(gpu.efficiency)} />
        <Metric icon={<Thermometer />} label="Temp." value={formatTemp(gpu.tempC)} tone={LEVEL_TONE[temp]} />
        <Metric icon={<Flame />} label="Memorie" value={gpu.memTempC != null ? formatTemp(gpu.memTempC) : "N/D"} tone={LEVEL_TONE[mem]} />
        <Metric icon={<Fan />} label="Ventilator" value={formatPercent(gpu.fanPercent)} />
        <Metric icon={<Zap />} label="Putere" value={formatWatts(gpu.powerW)} />
      </div>
    </article>
  );
}
