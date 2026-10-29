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

const images = {
  'Farm.png': decodePng('./public/assets/pack/Farm.png'),
  'Dungeon_Tiles.png': decodePng('./public/assets/pack/Dungeon_Tiles.png'),
  'Walls.png': decodePng('./public/assets/pack/Walls.png'),
  'Roofs.png': decodePng('./public/assets/pack/Roofs.png'),
  'Rocks.png': decodePng('./public/assets/pack/Rocks.png'),
  'Props.png': decodePng('./public/assets/pack/Props.png'),
  'Vegetation.png': decodePng('./public/assets/pack/Vegetation.png'),
  'Esoteric.png': decodePng('./public/assets/pack/Esoteric.png'),
  'Dungeon_Props.png': decodePng('./public/assets/pack/Dungeon_Props.png')
};

const regions = {
  terrain_grass: { file: 'Farm.png', x: 160, y: 0, width: 16, height: 16 },
  terrain_dirt: { file: 'Farm.png', x: 160, y: 16, width: 16, height: 16 },
  terrain_cobble: { file: 'Farm.png', x: 128, y: 144, width: 16, height: 16 },
  wall_stone_blocks: { file: 'Walls.png', x: 16, y: 16, width: 32, height: 32 },
  wall_stone_dark: { file: 'Walls.png', x: 112, y: 16, width: 32, height: 32 },
  roof_shingle_bronze: { file: 'Roofs.png', x: 48, y: 32, width: 32, height: 32 },
  roof_shingle_copper: { file: 'Roofs.png', x: 144, y: 32, width: 32, height: 32 },
  dungeon_slab_dark: { file: 'Dungeon_Tiles.png', x: 0, y: 0, width: 32, height: 32 },
  dungeon_slab_spectral: { file: 'Dungeon_Tiles.png', x: 64, y: 0, width: 32, height: 32 },
  dungeon_slab_clean: { file: 'Dungeon_Tiles.png', x: 0, y: 64, width: 32, height: 32 },
  dungeon_wall_brick: { file: 'Dungeon_Tiles.png', x: 0, y: 96, width: 32, height: 32 },
  rock_chiseled: { file: 'Rocks.png', x: 0, y: 16, width: 32, height: 32 },
  wood_props_crate: { file: 'Props.png', x: 0, y: 32, width: 32, height: 32 },
  bark_trunk: { file: 'Vegetation.png', x: 0, y: 48, width: 32, height: 32 },
  foliage_leaf: { file: 'Vegetation.png', x: 32, y: 16, width: 32, height: 32 },
  esoteric_rune_column: { file: 'Esoteric.png', x: 0, y: 16, width: 32, height: 64 },
  esoteric_arcane_seal: { file: 'Esoteric.png', x: 0, y: 96, width: 64, height: 64 },
  dungeon_urn: { file: 'Dungeon_Props.png', x: 96, y: 0, width: 32, height: 32 },
  dungeon_altar_relic: { file: 'Dungeon_Props.png', x: 0, y: 48, width: 48, height: 32 },
};

for (const [key, reg] of Object.entries(regions)) {
  const png = images[reg.file];
  let opaqueCount = 0;
  let total = reg.width * reg.height;
  for (let py = 0; py < reg.height; py++) {
    for (let px = 0; px < reg.width; px++) {
      const idx = ((reg.y + py) * png.width + (reg.x + px)) * 4;
      if (png.pixels[idx + 3] > 10) opaqueCount++;
    }
  }
  const pct = Math.round((opaqueCount / total) * 100);
  console.log(`Region [${key}] in ${reg.file}: ${opaqueCount}/${total} non-transparent pixels (${pct}%)`);
}
