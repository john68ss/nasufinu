import { jsonResponse, withAuth } from "@/lib/api/respond";
import { getPearlMarket } from "@/lib/services/coingecko";

export const dynamic = "force-dynamic";

export const GET = withAuth(async () => jsonResponse(await getPearlMarket()));
