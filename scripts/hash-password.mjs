import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import bcrypt from "bcryptjs";

// Usage: npm run hash-password   (the password is typed hidden and never stored or logged)
const mutable = new Writable({
  write(chunk, _enc, cb) {
    if (!mutable.muted) process.stdout.write(chunk);
    cb();
  },
});
mutable.muted = false;

const rl = createInterface({ input: process.stdin, output: mutable, terminal: true });

function ask(question, muted) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    mutable.muted = muted;
    rl.question("", (answer) => {
      mutable.muted = false;
      if (muted) process.stdout.write("\n");
      resolve(answer);
    });
  });
}

const password = await ask("Password: ", true);
const confirm = await ask("Repeat password: ", true);
rl.close();

if (password.length < 12) {
  console.error("Use at least 12 characters.");
  process.exit(1);
}
if (password !== confirm) {
  console.error("Passwords do not match.");
  process.exit(1);
}
if (Buffer.byteLength(password) > 72) {
  console.error("bcrypt only uses the first 72 bytes; choose a shorter password.");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
console.log("\nVercel (Environment Variables) — paste as-is:");
console.log(`AUTH_PASSWORD_HASH=${hash}`);
console.log("\n.env.local — the $ characters must be escaped:");
console.log(`AUTH_PASSWORD_HASH=${hash.replaceAll("$", "\\$")}`);
