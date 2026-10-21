// Prints the *shape* of your worker's HiveOS API response (key paths and types, no strings, no token)
// so you can confirm which fields your rig reports.  Usage: npm run inspect:hiveos
const { HIVEOS_API_TOKEN: token, HIVEOS_FARM_ID: farm, HIVEOS_WORKER_ID: worker } = process.env;

if (!token || !/^\d+$/.test(farm ?? "") || !/^\d+$/.test(worker ?? "")) {
  console.error("Set HIVEOS_API_TOKEN, HIVEOS_FARM_ID and HIVEOS_WORKER_ID in .env.local first.");
  process.exit(1);
}

const response = await fetch(`https://api2.hiveos.farm/api/v2/farms/${farm}/workers/${worker}`, {
  headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  signal: AbortSignal.timeout(15000),
});
console.log(`HTTP ${response.status}`);
if (!response.ok) process.exit(1);
const body = await response.json();

const SHOW_NUMBERS = new Set(["stats", "gpu_stats[0]", "gpu_info[0]"]);

function describe(value, path, showNumbers, depth = 0) {
  const pad = "  ".repeat(depth);
  if (Array.isArray(value)) {
    console.log(`${pad}${path || "(root)"}: array(${value.length})`);
    if (value.length > 0 && depth < 4) describe(value[0], `${path}[0]`, showNumbers || SHOW_NUMBERS.has(`${path}[0]`), depth + 1);
  } else if (value && typeof value === "object") {
    console.log(`${pad}${path || "(root)"}: object`);
    if (depth >= 4) return;
    for (const [k, v] of Object.entries(value)) {
      const child = path ? `${path}.${k}` : k;
      describe(v, child, showNumbers || SHOW_NUMBERS.has(child), depth + 1);
    }
  } else {
    const shown = typeof value === "number" && showNumbers ? ` = ${value}` : typeof value === "boolean" ? ` = ${value}` : "";
    console.log(`${pad}${path}: ${value === null ? "null" : typeof value}${shown}`);
  }
}

for (const key of ["id", "stats", "gpu_stats", "gpu_info", "miners_summary", "miners_stats", "hardware_power_draw"]) {
  describe(body[key], key, SHOW_NUMBERS.has(key));
}
