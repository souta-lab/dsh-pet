const sharp = require('sharp'),
  fs = require('fs'),
  path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
process.chdir(ROOT);
const DEST = process.argv[2];
if (!DEST) throw Error('Usage: node dsh-pet/scripts/ja/rebuild-memes.cjs /absolute/output-directory');
const { execFileSync } = require('child_process');
(async () => {
  const manifest = JSON.parse(fs.readFileSync('localization/meme-regions.json')),
    results = Object.fromEntries(
      Object.keys(manifest).map((name) => [name, path.join(ROOT, 'dsh-pet/assets/ja-lettering/memes', name + '.png')]),
    );
  fs.mkdirSync(DEST, { recursive: true });
  const report = [];
  for (const [name, file] of Object.entries(results)) {
    const m = manifest[name],
      original = execFileSync(
        'git',
        ['show', '97f13966e2a2f8aa43462f630a61c7b97a89ffe7:dsh-pet/assets/memes/' + name + '.png'],
        { maxBuffer: 10e6 },
      );
    const meta = await sharp(original).metadata();
    const modelSheet = await sharp(file).resize(m.sheet.width, m.sheet.height, { fit: 'fill' }).png().toBuffer();
    const { data: sheetData, info: sheetInfo } = await sharp(modelSheet)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const rows = [];
    for (let y = 0; y < sheetInfo.height; y++) {
      let n = 0;
      for (let x = 0; x < sheetInfo.width; x++) {
        const j = (y * sheetInfo.width + x) * 3;
        if (Math.min(sheetData[j], sheetData[j + 1], sheetData[j + 2]) < 224) n++;
      }
      if (n > 1) rows.push(y);
    }
    const gaps = [];
    for (let i = 1; i < rows.length; i++)
      if (rows[i] - rows[i - 1] > 1) gaps.push({ gap: rows[i] - rows[i - 1], before: rows[i - 1], after: rows[i] });
    const cuts = gaps
      .sort((a, b) => b.gap - a.gap)
      .slice(0, m.panels.length - 1)
      .sort((a, b) => a.after - b.after);
    const spans = [];
    let begin = rows[0];
    for (const cut of cuts) {
      spans.push([begin, cut.before]);
      begin = cut.after;
    }
    spans.push([begin, rows.at(-1)]);
    if (spans.length !== m.panels.length) throw Error('Panel count mismatch: ' + name);
    const ops = await Promise.all(
      m.panels.map(async (p, i) => {
        const region = m.regions[i],
          span = spans[i];
        const cropped = await sharp(modelSheet)
          .extract({
            left: 0,
            top: Math.max(0, span[0] - 1),
            width: sheetInfo.width,
            height: Math.min(sheetInfo.height, span[1] + 2) - Math.max(0, span[0] - 1),
          })
          .png()
          .toBuffer();
        let trimmed = await sharp(cropped).trim({ background: '#ffffff', threshold: 18 }).png().toBuffer();
        if (m.trimBottomFraction) {
          const z = await sharp(trimmed).metadata();
          trimmed = await sharp(trimmed)
            .extract({ left: 0, top: 0, width: z.width, height: Math.floor(z.height * (1 - m.trimBottomFraction)) })
            .png()
            .toBuffer();
        }
        const { data: b, info: bi } = await sharp(trimmed)
          .resize(region[2], region[3], {
            fit: m.panels.length === 1 && !m.preserveBackground ? 'contain' : 'fill',
            background: '#ffffff',
          })
          .ensureAlpha()
          .raw()
          .toBuffer({ resolveWithObject: true });
        const feather = m.feather || 0;
        if (feather)
          for (let y = 0; y < bi.height; y++)
            for (let x = 0; x < bi.width; x++) {
              const d = Math.min(x, y, bi.width - 1 - x, bi.height - 1 - y);
              b[(y * bi.width + x) * 4 + 3] = Math.round(255 * Math.min(1, d / feather));
            }
        return { input: await sharp(b, { raw: bi }).png().toBuffer(), left: region[0], top: region[1] };
      }),
    );
    for (const [left, top, width, height] of m.clearAreas || [])
      ops.unshift({
        input: await sharp({ create: { width, height, channels: 4, background: '#ffffff' } })
          .png()
          .toBuffer(),
        left,
        top,
      });
    const { data, info } = await sharp(original)
      .ensureAlpha()
      .composite(ops)
      .raw()
      .toBuffer({ resolveWithObject: true });
    const source = await sharp(original).ensureAlpha().raw().toBuffer();
    let outsideChanges = 0;
    for (let y = 0; y < meta.height; y++)
      for (let x = 0; x < meta.width; x++) {
        if (
          [...m.regions, ...(m.clearAreas || [])].some(
            ([xx, yy, w, h]) => x >= xx && x < xx + w && y >= yy && y < yy + h,
          )
        )
          continue;
        const i = (y * meta.width + x) * 4;
        for (let c = 0; c < 3; c++) if (data[i + c] !== source[i + c]) outsideChanges++;
      }
    let transparent = 0;
    if (!m.preserveBackground) {
      const n = meta.width * meta.height,
        seen = new Uint8Array(n),
        q = new Int32Array(n);
      let a = 0,
        b = 0;
      const add = (i) => {
        if (i < 0 || i >= n || seen[i]) return;
        const j = i * 4;
        if (
          data[j] >= (name === '大师这个区是什么意思' ? 220 : 244) &&
          data[j + 1] >= (name === '大师这个区是什么意思' ? 220 : 244) &&
          data[j + 2] >= (name === '大师这个区是什么意思' ? 220 : 244)
        ) {
          seen[i] = 1;
          q[b++] = i;
        }
      };
      for (let x = 0; x < meta.width; x++) {
        add(x);
        add((meta.height - 1) * meta.width + x);
      }
      for (let y = 0; y < meta.height; y++) {
        add(y * meta.width);
        add(y * meta.width + meta.width - 1);
      }
      while (a < b) {
        const i = q[a++];
        data[i * 4 + 3] = 0;
        const x = i % meta.width;
        if (x > 0) add(i - 1);
        if (x < meta.width - 1) add(i + 1);
        add(i - meta.width);
        add(i + meta.width);
      }
      transparent = b;
    }
    const target = path.join(DEST, name + '.png');
    await sharp(data, { raw: info }).png().toFile(target);
    report.push({
      name,
      outsideCaptionRGBChanges: outsideChanges,
      transparentPixels: transparent,
      width: meta.width,
      height: meta.height,
    });
  }
  fs.writeFileSync(path.join(DEST, 'verification.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
})();
