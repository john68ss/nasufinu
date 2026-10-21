import { jsonResponse, withErrorHandling } from "@/lib/api/respond";
import { getKryptex } from "@/lib/services/kryptex";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async () => jsonResponse(await getKryptex()));
