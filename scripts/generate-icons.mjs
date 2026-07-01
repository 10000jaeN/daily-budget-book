import { deflateSync } from "zlib";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// CRC32
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++)
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeB = Buffer.from(type);
  const crcInput = Buffer.concat([typeB, data]);
  const crcB = Buffer.alloc(4);
  crcB.writeUInt32BE(crc32(crcInput));
  return Buffer.concat([len, typeB, data, crcB]);
}

function createPNG(size, drawFn) {
  const rgba = new Uint8Array(size * size * 4);
  drawFn(rgba, size);

  const rows = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    rows[y * (1 + size * 4)] = 0;
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 4;
      const dst = y * (1 + size * 4) + 1 + x * 4;
      rows[dst] = rgba[src];
      rows[dst + 1] = rgba[src + 1];
      rows[dst + 2] = rgba[src + 2];
      rows[dst + 3] = rgba[src + 3];
    }
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA

  return Buffer.concat([
    sig,
    makeChunk("IHDR", ihdr),
    makeChunk("IDAT", deflateSync(rows)),
    makeChunk("IEND", Buffer.alloc(0)),
  ]);
}

function setPixel(rgba, w, x, y, r, g, b, a = 255) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= w || y >= w) return;
  const i = (y * w + x) * 4;
  rgba[i] = r;
  rgba[i + 1] = g;
  rgba[i + 2] = b;
  rgba[i + 3] = a;
}

function fillCircle(rgba, w, cx, cy, r, R, G, B) {
  const r2 = r * r;
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r2) setPixel(rgba, w, x, y, R, G, B);
    }
  }
}

function drawThickLine(rgba, w, x1, y1, x2, y2, thick, R, G, B) {
  const dx = x2 - x1,
    dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.max(Math.ceil(len * 2), 1);
  const hr = thick / 2;
  const hr2 = hr * hr;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const cx = x1 + dx * t,
      cy = y1 + dy * t;
    for (let py = Math.floor(cy - hr); py <= Math.ceil(cy + hr); py++) {
      for (let px = Math.floor(cx - hr); px <= Math.ceil(cx + hr); px++) {
        if ((px - cx) ** 2 + (py - cy) ** 2 <= hr2)
          setPixel(rgba, w, px, py, R, G, B);
      }
    }
  }
}

// Rounded rectangle check
function inRRect(px, py, x, y, w, h, r) {
  if (px < x || py < y || px >= x + w || py >= y + h) return false;
  const nearL = px < x + r, nearR = px >= x + w - r;
  const nearT = py < y + r, nearB = py >= y + h - r;
  if (nearL && nearT) return (px - (x + r)) ** 2 + (py - (y + r)) ** 2 <= r * r;
  if (nearR && nearT) return (px - (x + w - r)) ** 2 + (py - (y + r)) ** 2 <= r * r;
  if (nearL && nearB) return (px - (x + r)) ** 2 + (py - (y + h - r)) ** 2 <= r * r;
  if (nearR && nearB) return (px - (x + w - r)) ** 2 + (py - (y + h - r)) ** 2 <= r * r;
  return true;
}

function drawIcon(rgba, size) {
  const cx = size / 2,
    cy = size / 2;
  const radius = size * 0.22; // iOS-style corner radius

  // Transparent background
  rgba.fill(0);

  // Indigo rounded rect background (#4F46E5 = 79, 70, 229)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (inRRect(x, y, 0, 0, size, size, radius)) {
        setPixel(rgba, size, x, y, 79, 70, 229);
      }
    }
  }

  // White coin circle
  const coinR = size * 0.34;
  fillCircle(rgba, size, cx, cy, coinR, 255, 255, 255);

  // Light indigo ring inside coin
  const ringR = coinR - size * 0.03;
  fillCircle(rgba, size, cx, cy, ringR, 238, 237, 251);

  // Draw ₩ symbol in indigo
  const s = size / 192;
  const thick = Math.max(2, 11 * s);
  const barThick = Math.max(2, 8 * s);

  const hw = coinR * 0.52; // half-width of symbol
  const hh = coinR * 0.44; // half-height

  const lx = cx - hw,
    rx = cx + hw;
  const ty = cy - hh,
    by = cy + hh;
  const miy = cy - hh * 0.15; // inner V peak y

  // W strokes
  drawThickLine(rgba, size, lx, ty, cx - hw * 0.28, by, thick, 79, 70, 229);
  drawThickLine(rgba, size, cx - hw * 0.28, by, cx, miy, thick, 79, 70, 229);
  drawThickLine(rgba, size, cx, miy, cx + hw * 0.28, by, thick, 79, 70, 229);
  drawThickLine(rgba, size, cx + hw * 0.28, by, rx, ty, thick, 79, 70, 229);

  // Two horizontal bars (₩)
  const bar1y = cy - hh * 0.1;
  const bar2y = cy + hh * 0.28;
  const bx1 = cx - hw * 0.82,
    bx2 = cx + hw * 0.82;
  drawThickLine(rgba, size, bx1, bar1y, bx2, bar1y, barThick, 79, 70, 229);
  drawThickLine(rgba, size, bx1, bar2y, bx2, bar2y, barThick, 79, 70, 229);
}

for (const size of [192, 512]) {
  const png = createPNG(size, drawIcon);
  const outPath = join(__dirname, "..", "public", `icon-${size}.png`);
  writeFileSync(outPath, png);
  console.log(`✓ icon-${size}.png (${png.length} bytes)`);
}
