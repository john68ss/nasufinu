import { jsonResponse, withErrorHandling } from "@/lib/api/respond";
import { getRig } from "@/lib/services/hiveos";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async () => jsonResponse(await getRig()));
