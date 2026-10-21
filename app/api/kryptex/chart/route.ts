import { z } from "zod";
import { jsonResponse, withAuth } from "@/lib/api/respond";
import { getKryptexHashrate } from "@/lib/services/kryptex";

export const dynamic = "force-dynamic";

const querySchema = z.object({ range: z.enum(["day", "week"]).default("day") });

export const GET = withAuth(async (request) => {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) return jsonResponse({ error: "invalid_range" }, 400);
  return jsonResponse(await getKryptexHashrate(parsed.data.range));
});
