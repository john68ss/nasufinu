// Lists your farm and worker IDs using only HIVEOS_API_TOKEN (no token is printed).
// Usage: npm run discover:hiveos
const token = process.env.HIVEOS_API_TOKEN;
if (!token) {
  console.error("Set HIVEOS_API_TOKEN in .env.local first.");
  process.exit(1);
}

const base = "https://api2.hiveos.farm/api/v2";
async function get(path) {
  const response = await fetch(`${base}${path}`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15000),
  });
  if (response.status === 401) throw new Error("HiveOS rejected the token (401). Create a new Personal Access Token.");
  if (!response.ok) throw new Error(`HiveOS returned HTTP ${response.status} for ${path}`);
  return response.json();
}

try {
  const farms = (await get("/farms")).data ?? [];
  if (farms.length === 0) console.log("No farms found for this token.");
  for (const farm of farms) {
    console.log(`\nFarm: ${farm.name}  ->  HIVEOS_FARM_ID=${farm.id}`);
    const workers = (await get(`/farms/${farm.id}/workers`)).data ?? [];
    for (const worker of workers) {
      console.log(`  Worker: ${worker.name}  ->  HIVEOS_WORKER_ID=${worker.id}`);
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "Request failed.");
  process.exit(1);
}
