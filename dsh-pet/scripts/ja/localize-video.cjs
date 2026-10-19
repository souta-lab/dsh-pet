// Recompose model-generated Japanese lettering onto ORIGINAL animation frames.
// Requires sharp and ffmpeg. Character pixels are never sent through generation.
const sharp = require('sharp');
const fs = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');
const [kind, source, output, work] = process.argv.slice(2);
if (!['eat', 'think'].includes(kind) || !work)
  throw Error('Usage: node localize-video.cjs eat|think source.webm output.webm workdir');
fs.mkdirSync(work, { recursive: true });
const W = 640,
  H = 360,
  N = W * H,
  STRIDE = N * 4;
function components(buf, grayOnly = false) {
  const hit = (i) => {
    const j = i * 4;
    if (buf[j + 3] < 12) return false;
    return (
      !grayOnly ||
      ((i % W < 245 || i % W > (kind === 'eat' ? 420 : 365)) &&
        ((i / W) | 0) < 225 &&
        Math.max(buf[j], buf[j + 1], buf[j + 2]) - Math.min(buf[j], buf[j + 1], buf[j + 2]) < 30 &&
        Math.max(buf[j], buf[j + 1], buf[j + 2]) > 60)
    );
  };
  const labels = new Int32Array(N),
    q = new Int32Array(N),
    out = [];
  let id = 0;
  for (let p = 0; p < N; p++) {
    if (labels[p] || !hit(p)) continue;
    id++;
    let a = 0,
      b = 1;
    q[0] = p;
    labels[p] = id;
    let x0 = W,
      y0 = H,
      x1 = 0,
      y1 = 0,
      gray = 0;
    while (a < b) {
      const i = q[a++],
        x = i % W,
        y = (i / W) | 0,
        j = i * 4;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
      if (Math.max(buf[j], buf[j + 1], buf[j + 2]) - Math.min(buf[j], buf[j + 1], buf[j + 2]) < 30) gray++;
      for (const k of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1])
        if (k >= 0 && !labels[k] && hit(k)) {
          labels[k] = id;
          q[b++] = k;
        }
    }
    out.push({ id, x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, area: b, gray: gray / b });
  }
  return { labels, out };
}
async function letters() {
  const file = path.resolve(__dirname, '../../assets/ja-lettering', kind + '.png');
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const rows = [];
  for (let y = 0; y < info.height; y++) {
    let n = 0;
    for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 30) n++;
    if (n > 3) rows.push(y);
  }
  const groups = [];
  let start = rows[0],
    last = start;
  for (const y of rows.slice(1)) {
    if (y - last > 20) {
      groups.push([start, last]);
      start = y;
    }
    last = y;
  }
  groups.push([start, last]);
  if (groups.length !== (kind === 'eat' ? 2 : 3))
    throw Error('Unexpected caption row count: ' + JSON.stringify(groups));
  return Promise.all(
    groups.map(async ([y0, y1]) =>
      sharp(
        await sharp(file)
          .extract({ left: 0, top: y0, width: info.width, height: y1 - y0 + 1 })
          .png()
          .toBuffer(),
      )
        .trim()
        .png()
        .toBuffer(),
    ),
  );
}
(async () => {
  const templates = await letters(),
    cache = new Map();
  const dec = spawnSync(
    'ffmpeg',
    ['-v', 'error', '-c:v', 'libvpx-vp9', '-i', source, '-f', 'rawvideo', '-pix_fmt', 'rgba', 'pipe:1'],
    { maxBuffer: 300 * 1024 * 1024 },
  );
  if (dec.status) throw Error(dec.stderr.toString());
  const raw = dec.stdout;
  const frames = raw.length / STRIDE;
  if (!Number.isInteger(frames)) throw Error('Invalid raw frame size');
  const dst = Buffer.alloc(raw.length);
  let bubbles = 0,
    edits = 0,
    characterChanges = 0;
  for (let f = 0; f < frames; f++) {
    const src = raw.subarray(f * STRIDE, (f + 1) * STRIDE),
      frame = Buffer.from(src),
      { labels, out } = components(src, true);
    const allowed = new Uint8Array(N);
    for (const c of out) {
      if (
        c.area < 400 ||
        c.w < 65 ||
        c.w < c.h * 0.85 ||
        c.h > 140 ||
        c.y > 210 ||
        (c.x + c.w / 2 > 255 && c.x + c.w / 2 < 390)
      )
        continue;
      const values = [];
      for (let y = c.y + 6; y < c.y + c.h - 6; y++)
        for (let x = c.x + 6; x < c.x + c.w - 6; x++) {
          const i = y * W + x;
          if (labels[i] === c.id) values.push(Math.max(src[i * 4], src[i * 4 + 1], src[i * 4 + 2]));
        }
      values.sort((a, b) => a - b);
      const cutoff = Math.max(150, (values[Math.floor(values.length * 0.7)] || 180) - 10);
      const mask = new Uint8Array(N);
      let x0 = W,
        y0 = H,
        x1 = -1,
        y1 = -1,
        rs = 0,
        gs = 0,
        bs = 0,
        num = 0,
        opacity = 0;
      // Erode the bubble to exclude its contour and tail; only old glyphs are inpainted.
      for (let y = c.y + 5; y < c.y + c.h - 5; y++)
        for (let x = c.x + 5; x < c.x + c.w - 5; x++) {
          const i = y * W + x,
            j = i * 4;
          if (
            labels[i] !== c.id ||
            labels[i - 4] !== c.id ||
            labels[i + 4] !== c.id ||
            labels[i - 4 * W] !== c.id ||
            labels[i + 4 * W] !== c.id
          )
            continue;
          const lo = Math.min(src[j], src[j + 1], src[j + 2]),
            hi = Math.max(src[j], src[j + 1], src[j + 2]);
          if (hi < cutoff && hi - lo < 30) {
            mask[i] = 1;
            x0 = Math.min(x0, x);
            x1 = Math.max(x1, x);
            y0 = Math.min(y0, y);
            y1 = Math.max(y1, y);
            rs += src[j];
            gs += src[j + 1];
            bs += src[j + 2];
            num++;
            opacity = Math.max(opacity, src[j + 3]);
          }
        }
      if (num < 15 || x1 - x0 < 15 || y1 - y0 < 5) continue;
      // One pixel of antialias fringe belongs to the glyph too.
      const expanded = mask.slice();
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          const i = y * W + x;
          if (mask[i])
            for (let dy = -1; dy <= 1; dy++)
              for (let dx = -1; dx <= 1; dx++) {
                const k = i + dy * W + dx;
                if (labels[k] === c.id) expanded[k] = 1;
              }
        }
      for (let y = y0 - 1; y <= y1 + 1; y++)
        for (let x = x0 - 1; x <= x1 + 1; x++) {
          const i = y * W + x;
          if (!expanded[i]) continue;
          let r = 0,
            g = 0,
            b = 0,
            n = 0;
          for (let dy = -8; dy <= 8; dy += 2)
            for (let dx = -12; dx <= 12; dx += 2) {
              const k = i + dy * W + dx,
                j = k * 4;
              if (
                k < 0 ||
                k >= N ||
                expanded[k] ||
                labels[k] !== c.id ||
                Math.max(src[j], src[j + 1], src[j + 2]) < 165
              )
                continue;
              r += src[j];
              g += src[j + 1];
              b += src[j + 2];
              n++;
            }
          if (n) {
            allowed[i] = 1;
            frame[i * 4] = Math.round(r / n);
            frame[i * 4 + 1] = Math.round(g / n);
            frame[i * 4 + 2] = Math.round(b / n);
            edits++;
          }
        }
      let ti = 0;
      if (kind === 'eat') ti = c.x > W / 2 && f < 24 * 5 ? 1 : 0;
      else ti = c.x > W / 2 ? (c.y < 110 ? 1 : 2) : c.y < 120 ? 0 : 2;
      const targetW = Math.max(10, Math.floor(c.w * 0.82)),
        targetH = Math.max(8, Math.min(22, y1 - y0 + 2));
      const key = ti + ',' + targetW + ',' + targetH;
      if (!cache.has(key))
        cache.set(
          key,
          await sharp(templates[ti])
            .resize(targetW, targetH, { fit: 'inside' })
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true }),
        );
      const { data: t, info: tm } = cache.get(key);
      const left = Math.round(c.x + (c.w - tm.width) / 2),
        top = Math.round((y0 + y1 + 1 - tm.height) / 2);
      for (let y = 0; y < tm.height; y++)
        for (let x = 0; x < tm.width; x++) {
          const k = y * tm.width + x,
            a = t[k * 4 + 3] / 255;
          if (a <= 0) continue;
          const i = (top + y) * W + left + x;
          if (i < 0 || i >= N || labels[i] !== c.id) continue;
          allowed[i] = 1;
          const j = i * 4;
          frame[j] = Math.round(frame[j] * (1 - a) + (rs / num) * a);
          frame[j + 1] = Math.round(frame[j + 1] * (1 - a) + (gs / num) * a);
          frame[j + 2] = Math.round(frame[j + 2] * (1 - a) + (bs / num) * a);
          edits++;
        }
      bubbles++;
    }
    for (let i = 0; i < N; i++)
      if (
        !allowed[i] ||
        ((i / W) | 0) > 220 ||
        Math.max(src[i * 4], src[i * 4 + 1], src[i * 4 + 2]) - Math.min(src[i * 4], src[i * 4 + 1], src[i * 4 + 2]) > 30
      )
        for (let ch = 0; ch < 4; ch++) if (src[i * 4 + ch] !== frame[i * 4 + ch]) characterChanges++;
    frame.copy(dst, f * STRIDE);
  }
  if (characterChanges) throw Error('Character pixel preservation failed: ' + characterChanges);
  const rawPath = path.join(work, kind + '.rgba');
  fs.writeFileSync(rawPath, dst);
  const enc = spawnSync(
    'ffmpeg',
    [
      '-v',
      'error',
      '-y',
      '-f',
      'rawvideo',
      '-pix_fmt',
      'rgba',
      '-s',
      '640x360',
      '-r',
      '24',
      '-i',
      rawPath,
      '-c:v',
      'libvpx-vp9',
      '-pix_fmt',
      'yuva420p',
      '-lossless',
      '1',
      '-auto-alt-ref',
      '0',
      output,
    ],
    { encoding: 'utf8' },
  );
  if (enc.status) throw Error(enc.stderr);
  const proof = path.join(work, kind + '-frame.png');
  await sharp(dst.subarray(24 * 6 * STRIDE, (24 * 6 + 1) * STRIDE), { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toFile(proof);
  console.log(
    JSON.stringify({
      kind,
      frames,
      bubbles,
      editedGlyphPixels: edits,
      characterRGBAChanges: characterChanges,
      output,
      proof,
    }),
  );
})();
