import { jsonResponse, withErrorHandling } from "@/lib/api/respond";
import { getPearlMarket } from "@/lib/services/coingecko";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async () => jsonResponse(await getPearlMarket()));
