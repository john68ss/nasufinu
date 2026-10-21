import { randomBytes } from "node:crypto";

console.log(`SETTINGS_SECRET=${randomBytes(48).toString("base64url")}`);
