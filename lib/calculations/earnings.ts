import { DAY_MS, utcDayStart } from "@/lib/utils/time";
import type { EarningsSummary, KryptexData } from "@/types/earnings";

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/**
 * Derives earnings figures from the pool's daily reward chart.
 * "Today" is only reported when the pool already has a point for the current UTC day.
 */
export function summarizeEarnings(data: KryptexData | null, now = Date.now()): EarningsSummary | null {
  if (!data) return null;
  const days = data.dailyRewards ?? [];
  const today = utcDayStart(now);

  const todayPoint = days.find((d) => d.day === today);
  const completed = days.filter((d) => d.day < today).slice(-7);
  const yesterday = days.find((d) => d.day === today - DAY_MS);
  const last7 = days.filter((d) => d.day > today - 8 * DAY_MS && d.day < today);
  const avgDaily = completed.length > 0 ? sum(completed.map((d) => d.reward)) / completed.length : null;

  return {
    todayPrl: todayPoint?.reward ?? null,
    yesterdayPrl: yesterday?.reward ?? null,
    // Prefer the pool's own totals; fall back to summing the chart.
    last7dPrl: data.rewardWeek ?? (last7.length > 0 ? sum(last7.map((d) => d.reward)) : null),
    last30dPrl: data.rewardMonth ?? (days.length > 0 ? sum(days.map((d) => d.reward)) : null),
    avgDailyPrl: avgDaily,
    estMonthlyPrl: avgDaily != null ? avgDaily * 30 : null,
  };
}
