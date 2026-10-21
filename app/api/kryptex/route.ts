import { jsonResponse, withAuth } from "@/lib/api/respond";
import { getKryptex } from "@/lib/services/kryptex";

export const dynamic = "force-dynamic";

export const GET = withAuth(async () => jsonResponse(await getKryptex()));
