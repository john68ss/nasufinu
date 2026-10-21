import { z } from "zod";
import { jsonResponse, withErrorHandling } from "@/lib/api/respond";
import { getPearlHistory } from "@/lib/services/coingecko";

export const dynamic = "force-dynamic";

const querySchema = z.object({ range: z.enum(["24h", "7d", "30d", "90d"]).default("7d") });

export const GET = withErrorHandling(async (request) => {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) return jsonResponse({ error: "invalid_range" }, 400);
  return jsonResponse(await getPearlHistory(parsed.data.range));
});
