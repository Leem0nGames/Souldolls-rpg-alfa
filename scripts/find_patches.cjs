const fs = require('fs');
const zlib = require('zlib');

function decodePng(filePath) {
  const buf = fs.readFileSync(filePath);
  let offset = 8;
  let idatChunks = [];
  let width = 0, height = 0;
  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    if (type === 'IHDR') {
      width = buf.readUInt32BE(offset + 8);
      height = buf.readUInt32BE(offset + 12);
    } else if (type === 'IDAT') {
      idatChunks.push(buf.slice(offset + 8, offset + 8 + len));
    }
    offset += 12 + len;
  }
  const idat = Buffer.concat(idatChunks);
  const raw = zlib.inflateSync(idat);

  const stride = width * 4;
  const pixels = Buffer.alloc(width * height * 4);
  let rawOffset = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[rawOffset++];
    for (let x = 0; x < stride; x++) {
      let val = raw[rawOffset++];
      const a = x >= 4 ? pixels[y * stride + x - 4] : 0;
      const b = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const c = (x >= 4 && y > 0) ? pixels[(y - 1) * stride + x - 4] : 0;
      if (filter === 1) val = (val + a) & 0xff;
      else if (filter === 2) val = (val + b) & 0xff;
      else if (filter === 3) val = (val + Math.floor((a + b) / 2)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
        val = (val + pr) & 0xff;
      }
      pixels[y * stride + x] = val;
    }
  }
  return { width, height, pixels };
}

function findSolidPatches(png, name, w = 32, h = 32) {
  console.log(`\n=== Finding ${w}x${h} patches in ${name} ===`);
  const stride = png.width * 4;
  for (let y = 0; y <= png.height - h; y += 16) {
    for (let x = 0; x <= png.width - w; x += 16) {
      let transparent = 0;
      let rSum = 0, gSum = 0, bSum = 0;
      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          const idx = ((y + py) * png.width + (x + px)) * 4;
          const a = png.pixels[idx + 3];
          if (a < 200) {
            transparent++;
          } else {
            rSum += png.pixels[idx];
            gSum += png.pixels[idx + 1];
            bSum += png.pixels[idx + 2];
          }
        }
      }
      if (transparent === 0) {
        const total = w * h;
        const r = Math.round(rSum / total).toString(16).padStart(2, '0');
        const g = Math.round(gSum / total).toString(16).padStart(2, '0');
        const b = Math.round(bSum / total).toString(16).padStart(2, '0');
        console.log(`Solid patch at x:${x}, y:${y} (w:${w},h:${h}) -> avg color #${r}${g}${b}`);
      }
    }
  }
}

findSolidPatches(decodePng('./public/assets/pack/Dungeon_Tiles.png'), 'Dungeon_Tiles', 32, 32);
findSolidPatches(decodePng('./public/assets/pack/Walls.png'), 'Walls', 32, 32);
findSolidPatches(decodePng('./public/assets/pack/Roofs.png'), 'Roofs', 32, 32);
findSolidPatches(decodePng('./public/assets/pack/Farm.png'), 'Farm', 32, 32);
findSolidPatches(decodePng('./public/assets/pack/Vegetation.png'), 'Vegetation', 32, 32);
