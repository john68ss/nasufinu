import { getDashboardData } from "@/lib/dashboard/get-dashboard-data";
import { jsonResponse, withAuth } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

export const GET = withAuth(async () => jsonResponse(await getDashboardData()));
