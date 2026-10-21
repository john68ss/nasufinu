import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Generates placeholder PNG icons (navy tile + blue/cyan "pearl"). Replace with real artwork any time.
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");
mkdirSync(OUT, { recursive: true });

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

function png(size, { maskable = false, rounded = true } = {}) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const c = size / 2;
  const radius = size * (maskable ? 0.24 : 0.3);
  const corner = size * 0.22;
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const o = y * (size * 4 + 1) + 1 + x * 4;
      let r = 4, g = 8, b = 19, a = 255;
      const t = y / size;
      r = 4 + 10 * t; g = 8 + 18 * t; b = 19 + 40 * t;
      if (rounded && !maskable) {
        const dx = Math.max(Math.abs(x - c) - (c - corner), 0);
        const dy = Math.max(Math.abs(y - c) - (c - corner), 0);
        if (Math.hypot(dx, dy) > corner) a = 0;
      }
      const d = Math.hypot(x - c, y - c);
      if (d < radius) {
        const lx = (x - (c - radius * 0.35)) / radius;
        const ly = (y - (c - radius * 0.4)) / radius;
        const glow = Math.max(0, 1 - Math.hypot(lx, ly) * 0.9);
        r = 37 + 190 * glow; g = 99 + 140 * glow; b = 235 + 20 * glow;
      } else if (d < radius * 1.18) {
        const k = 1 - (d - radius) / (radius * 0.18);
        r += (34 - r) * k * 0.5; g += (211 - g) * k * 0.5; b += (238 - b) * k * 0.5;
      }
      raw[o] = Math.min(255, r); raw[o + 1] = Math.min(255, g); raw[o + 2] = Math.min(255, b); raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

writeFileSync(join(OUT, "icon-192.png"), png(192));
writeFileSync(join(OUT, "icon-512.png"), png(512));
writeFileSync(join(OUT, "icon-maskable-512.png"), png(512, { maskable: true }));
// iOS applies its own rounded mask, so the apple icon is a full-bleed square.
writeFileSync(join(OUT, "apple-touch-icon.png"), png(180, { rounded: false }));
console.log("Icons written to public/icons");
