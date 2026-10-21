import { jsonResponse, withAuth } from "@/lib/api/respond";
import { getRig } from "@/lib/services/hiveos";

export const dynamic = "force-dynamic";

export const GET = withAuth(async () => jsonResponse(await getRig()));
