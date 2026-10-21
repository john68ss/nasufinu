import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";

// Valid bcrypt hash of a random string; compared against when the username is wrong so timing stays similar.
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO5G7pKkq0bq5p7J3m1D5E7lH1h5yQw2y";

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function verifyCredentials(
  input: { username: string; password: string },
  expected: { username: string; passwordHash: string },
): Promise<boolean> {
  const usernameOk = safeEqual(input.username, expected.username);
  const passwordOk = await bcrypt.compare(input.password, usernameOk ? expected.passwordHash : DUMMY_HASH);
  return usernameOk && passwordOk;
}
