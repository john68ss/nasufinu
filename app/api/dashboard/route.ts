import { getDashboardData } from "@/lib/dashboard/get-dashboard-data";
import { jsonResponse, withErrorHandling } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async () => jsonResponse(await getDashboardData()));
