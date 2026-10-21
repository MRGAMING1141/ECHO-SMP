import fs from "fs";
import path from "path";
import zlib from "zlib";

const OUT_DIRS = [
  path.resolve(process.cwd(), "public/items"),
  path.resolve(process.cwd(), "items"),
];
for (const d of OUT_DIRS) {
  fs.mkdirSync(d, { recursive: true });
}

function writePng(width, height, rgba, filePaths) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const t = Buffer.from(type, "ascii");
    const crcBuf = Buffer.concat([t, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcBuf), 0);
    return Buffer.concat([len, t, data, crc]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const png = Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);

  for (const fp of filePaths) {
    fs.writeFileSync(fp, png);
  }
}

const clamp = (v, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const mix = (a, b, t) => a + (b - a) * clamp(t, 0, 1);
const smoothstep = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
};
const hypot = Math.hypot;

function hash2(x, y) {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return h - Math.floor(h);
}

function noise2(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  return mix(mix(a, b, ux), mix(c, d, ux), uy);
}

function fbm(x, y, oct = 4) {
  let v = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < oct; i++) {
    v += amp * noise2(x * freq, y * freq);
    freq *= 2.04;
    amp *= 0.5;
  }
  return v;
}

function sdCircle(x, y, r) {
  return hypot(x, y) - r;
}

function sdBox(x, y, bx, by, r = 0) {
  const dx = Math.abs(x) - bx + r;
  const dy = Math.abs(y) - by + r;
  return hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) - r;
}

function sdSegment(px, py, ax, ay, bx, by, r = 0) {
  const pax = px - ax, pay = py - ay;
  const bax = bx - ax, bay = by - ay;
  const h = clamp((pax * bax + pay * bay) / (bax * bax + bay * bay || 1e-6), 0, 1);
  return hypot(pax - bax * h, pay - bay * h) - r;
}

function sdPolygon(px, py, pts) {
  let d = (px - pts[0][0]) ** 2 + (py - pts[0][1]) ** 2;
  let s = 1;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i++) {
    const ex = pts[j][0] - pts[i][0];
    const ey = pts[j][1] - pts[i][1];
    const wx = px - pts[i][0];
    const wy = py - pts[i][1];
    const b = clamp((wx * ex + wy * ey) / (ex * ex + ey * ey || 1e-6), 0, 1);
    const bx = wx - ex * b;
    const by = wy - ey * b;
    d = Math.min(d, bx * bx + by * by);
    const c1 = py >= pts[i][1];
    const c2 = py < pts[j][1];
    const c3 = ex * wy > ey * wx;
    if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
  }
  return s * Math.sqrt(d);
}

// Smooth 3D pillow dome height from signed distance d (< 0 inside)
function domeHeight(d, maxDepth = 0.25, scale = 0.28) {
  const t = clamp(-d / maxDepth, 0, 1);
  return Math.sqrt(Math.max(0, 1 - (1 - t) * (1 - t))) * scale;
}

const MAT = {
  obsidian: { base: [0.11, 0.13, 0.18], spec: [0.65, 0.72, 0.88], rough: 0.20, metal: 0.72 },
  darkSteel: { base: [0.24, 0.28, 0.35], spec: [0.85, 0.90, 0.98], rough: 0.15, metal: 0.88 },
  silver: { base: [0.72, 0.80, 0.90], spec: [1.0, 1.0, 1.0], rough: 0.10, metal: 0.95 },
  gold: { base: [0.95, 0.68, 0.14], spec: [1.0, 0.92, 0.58], rough: 0.11, metal: 0.96 },
  emerald: { base: [0.08, 0.88, 0.38], spec: [0.90, 1.0, 0.94], rough: 0.05, metal: 0.32, glow: [0.16, 0.98, 0.46] },
  diamond: { base: [0.16, 0.84, 1.0], spec: [0.95, 1.0, 1.0], rough: 0.04, metal: 0.38, glow: [0.22, 0.90, 1.0] },
  ruby: { base: [0.94, 0.10, 0.24], spec: [1.0, 0.85, 0.90], rough: 0.06, metal: 0.30, glow: [1.0, 0.18, 0.34] },
  amethyst: { base: [0.70, 0.22, 0.98], spec: [0.96, 0.85, 1.0], rough: 0.06, metal: 0.34, glow: [0.78, 0.32, 1.0] },
  celestial: { base: [1.0, 0.95, 0.72], spec: [1.0, 1.0, 0.98], rough: 0.05, metal: 0.55, glow: [1.0, 0.92, 0.55] },
  magma: { base: [1.0, 0.34, 0.05], spec: [1.0, 0.88, 0.42], rough: 0.08, metal: 0.2, glow: [1.0, 0.44, 0.08] },
  sculk: { base: [0.05, 0.18, 0.26], spec: [0.35, 0.90, 0.96], rough: 0.16, metal: 0.62 },
  echoCrystal: { base: [0.08, 0.95, 0.90], spec: [0.92, 1.0, 1.0], rough: 0.04, metal: 0.40, glow: [0.12, 0.98, 0.94] },
  grass: { base: [0.26, 0.78, 0.22], spec: [0.65, 0.94, 0.55], rough: 0.28, metal: 0.15 },
  dirt: { base: [0.48, 0.32, 0.18], spec: [0.62, 0.46, 0.30], rough: 0.36, metal: 0.10 },
  velvet: { base: [0.68, 0.08, 0.18], spec: [0.90, 0.40, 0.48], rough: 0.32, metal: 0.12 },
};

function isoCube(px, py, cx, cy, size) {
  const x = (px - cx) / size;
  const y = (py - cy) / size;
  const w = 0.866;
  const topPts = [
    [0, -1.0],
    [w, -0.5],
    [0, 0.0],
    [-w, -0.5],
  ];
  const leftPts = [
    [-w, -0.5],
    [0, 0.0],
    [0, 1.0],
    [-w, 0.5],
  ];
  const rightPts = [
    [0, 0.0],
    [w, -0.5],
    [w, 0.5],
    [0, 1.0],
  ];
  const dTop = sdPolygon(x, y, topPts);
  const dLeft = sdPolygon(x, y, leftPts);
  const dRight = sdPolygon(x, y, rightPts);
  const d = Math.min(dTop, dLeft, dRight) * size;
  let face = "top";
  if (dLeft < dTop && dLeft <= dRight) face = "left";
  else if (dRight < dTop && dRight < dLeft) face = "right";
  const edgeDist = Math.min(Math.abs(dTop), Math.abs(dLeft), Math.abs(dRight));
  // 3D tilted plane height per isometric face so lighting naturally differentiates top/left/right
  const tilt =
    face === "top"
      ? 0.42 - y * 0.14
      : face === "left"
      ? 0.28 - x * 0.22 - y * 0.08
      : 0.18 + x * 0.18 - y * 0.10;
  const bevel = smoothstep(0.0, 0.08, edgeDist) * 0.05;
  const h = tilt + bevel;
  return { d, face, h, localX: x, localY: y, edgeDist };
}

function evalItemScene(id, x, y) {
  const ax = Math.abs(x);
  const r = hypot(x, y);
  const ang = Math.atan2(y, x);
  const nGrain = fbm(x * 14 + 3.1, y * 14 + 7.4, 3);
  const facetPattern = Math.sin(x * 12 + y * 8) * Math.cos(x * 8 - y * 12);

  if (id === "master") {
    const s1 = sdSegment(x, y, -0.68, 0.68, 0.68, -0.68, 0.075);
    const s2 = sdSegment(x, y, 0.68, 0.68, -0.68, -0.68, 0.075);
    const guard1 = sdSegment(x, y, -0.52, 0.22, -0.22, 0.52, 0.048);
    const guard2 = sdSegment(x, y, 0.52, 0.22, 0.22, 0.52, 0.048);
    const swordsD = Math.min(s1, s2, guard1, guard2);

    const hexPts = [];
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 - Math.PI / 2;
      hexPts.push([Math.cos(a) * 0.56, Math.sin(a) * 0.56]);
    }
    const outerHex = sdPolygon(x, y, hexPts);
    const innerHex = outerHex + 0.13;
    const gemD = sdPolygon(x, y, [
      [0, -0.32],
      [0.24, 0],
      [0, 0.32],
      [-0.24, 0],
    ]);

    if (gemD < 0) {
      const pyrH = 0.52 + (0.32 - (ax * 1.2 + Math.abs(y))) * 0.75 + facetPattern * 0.04;
      return { d: gemD, h: pyrH, mat: MAT.emerald, emit: 0.55 };
    }
    if (outerHex < 0) {
      if (innerHex < 0) {
        const chev = Math.sin(r * 42) * 0.025;
        return { d: outerHex, h: 0.28 + domeHeight(innerHex, 0.3, 0.12) + chev, mat: MAT.obsidian, emit: 0.06 };
      }
      return { d: outerHex, h: 0.24 + domeHeight(outerHex, 0.14, 0.26), mat: MAT.gold, emit: 0.08 };
    }
    if (Math.min(guard1, guard2) < Math.min(s1, s2)) {
      return { d: swordsD, h: 0.24 + domeHeight(swordsD, 0.06, 0.18), mat: MAT.gold, emit: 0.05 };
    }
    return { d: swordsD, h: 0.18 + domeHeight(swordsD, 0.08, 0.22), mat: MAT.silver, emit: 0.04 };
  }

  if (id === "elite") {
    const wx = Math.max(0, ax - 0.22);
    const wingY = y + Math.pow(wx, 1.4) * 0.75 - 0.04;
    const wingD = sdBox(ax - 0.48, wingY, 0.26, 0.34, 0.12) + Math.sin(y * 24) * 0.018;
    const shieldPts = [
      [0, -0.62],
      [0.46, -0.46],
      [0.42, 0.16],
      [0, 0.66],
      [-0.42, 0.16],
      [-0.46, -0.46],
    ];
    const shieldD = sdPolygon(x, y, shieldPts);
    const innerShield = shieldD + 0.12;
    const starR = hypot(x, y + 0.02);
    const starD = starR - (0.23 + 0.09 * Math.cos(ang * 4));

    if (starD < 0) {
      return { d: starD, h: 0.58 - starR * 0.9 + facetPattern * 0.06, mat: MAT.diamond, emit: 0.65 };
    }
    if (shieldD < 0) {
      if (innerShield < 0) {
        const chevron = Math.abs(y - ax * 0.7 + 0.08) < 0.06;
        if (chevron) {
          return { d: shieldD, h: 0.44 - ax * 0.15, mat: MAT.silver, emit: 0.12 };
        }
        return { d: shieldD, h: 0.28 + domeHeight(innerShield, 0.35, 0.16) - ax * 0.1, mat: MAT.obsidian, emit: 0.08 };
      }
      return { d: shieldD, h: 0.26 + domeHeight(shieldD, 0.13, 0.26), mat: MAT.silver, emit: 0.10 };
    }
    const feather = Math.sin((y - ax * 0.5) * 30) * 0.055;
    return { d: wingD, h: 0.22 + domeHeight(wingD, 0.18, 0.22) + feather, mat: MAT.silver, emit: 0.12 };
  }

  if (id === "emperor") {
    const medalD = sdCircle(x, y, 0.62);
    const innerD = sdCircle(x, y, 0.44);
    const crownPts = [
      [-0.28, 0.18],
      [-0.34, -0.16],
      [-0.16, 0.0],
      [0.0, -0.28],
      [0.16, 0.0],
      [0.34, -0.16],
      [0.28, 0.18],
    ];
    const crownD = Math.min(sdPolygon(x, y, crownPts), sdBox(x, y - 0.23, 0.28, 0.05, 0.02));
    const centerRuby = sdCircle(x, y - 0.04, 0.095);
    const sideRuby = sdCircle(ax - 0.18, y + 0.03, 0.055);

    if (centerRuby < 0 || sideRuby < 0) {
      const gd = Math.min(centerRuby, sideRuby);
      return { d: gd, h: 0.56 + domeHeight(gd, 0.09, 0.22), mat: MAT.ruby, emit: 0.6 };
    }
    if (crownD < 0) {
      return { d: crownD, h: 0.40 + domeHeight(crownD, 0.14, 0.24) - x * 0.08, mat: MAT.gold, emit: 0.16 };
    }
    if (innerD < 0) {
      const rays = Math.sin(ang * 18) * 0.03;
      return { d: medalD, h: 0.26 + domeHeight(innerD, 0.44, 0.14) + rays, mat: MAT.velvet, emit: 0.06 };
    }
    const laurel = Math.sin(ang * 24 + r * 14) * 0.048;
    const rimGem = Math.min(sdCircle(ax - 0.53, y, 0.055), sdCircle(x, Math.abs(y) - 0.53, 0.055));
    if (rimGem < 0) {
      return { d: medalD, h: 0.48 + domeHeight(rimGem, 0.055, 0.16), mat: MAT.ruby, emit: 0.48 };
    }
    return { d: medalD, h: 0.26 + domeHeight(medalD, 0.18, 0.26) + laurel, mat: MAT.gold, emit: 0.12 };
  }

  if (id === "titan") {
    const hx = Math.max(0, ax - 0.22);
    const hornY = y + 0.16 - Math.pow(hx, 1.7) * 1.45;
    const hornD = sdBox(ax - 0.46, hornY, 0.20, Math.max(0.03, 0.12 - hx * 0.18), 0.05);
    const helmPts = [
      [0, -0.60],
      [0.44, -0.36],
      [0.48, 0.26],
      [0.24, 0.62],
      [0, 0.50],
      [-0.24, 0.62],
      [-0.48, 0.26],
      [-0.44, -0.36],
    ];
    const helmD = sdPolygon(x, y, helmPts);
    const visorH = sdBox(x, y + 0.08, 0.30, 0.065, 0.02);
    const visorV = sdBox(x, y - 0.16, 0.065, 0.26, 0.02);
    const visorD = Math.min(visorH, visorV);
    const browGem = sdPolygon(x, y + 0.34, [
      [0, -0.15],
      [0.11, 0],
      [0, 0.15],
      [-0.11, 0],
    ]);

    if (browGem < 0) {
      return { d: browGem, h: 0.58 + domeHeight(browGem, 0.11, 0.22) + facetPattern * 0.05, mat: MAT.amethyst, emit: 0.72 };
    }
    if (visorD < 0 && helmD < -0.06) {
      return { d: visorD, h: 0.24 + domeHeight(visorD, 0.06, 0.08), mat: MAT.amethyst, emit: 0.88 };
    }
    if (helmD < 0) {
      const cheekTrim = helmD > -0.10 || (ax < 0.055 && y < -0.18);
      const sphereH = 0.28 + domeHeight(helmD, 0.45, 0.32) - x * 0.06;
      if (cheekTrim) {
        return { d: helmD, h: sphereH + 0.05, mat: MAT.gold, emit: 0.12 };
      }
      return { d: helmD, h: sphereH + facetPattern * 0.04, mat: MAT.diamond, emit: 0.24 };
    }
    return {
      d: hornD,
      h: 0.26 + domeHeight(hornD, 0.12, 0.24) + Math.sin(ax * 32) * 0.035,
      mat: MAT.amethyst,
      emit: 0.45,
    };
  }

  if (id === "divine") {
    const haloR = hypot(x, (y + 0.46) * 1.8);
    const haloD = Math.abs(haloR - 0.34) - 0.055;
    const wy = y - 0.06 + Math.sin(ax * 4.2) * 0.22 - ax * 0.42;
    const wingD = sdBox(ax - 0.38, wy, 0.34, Math.max(0.06, 0.26 - ax * 0.15), 0.10);
    const coreD = sdPolygon(x, y - 0.04, [
      [0, -0.36],
      [0.26, 0],
      [0, 0.36],
      [-0.26, 0],
    ]);
    const innerStar = sdPolygon(x, y - 0.04, [
      [0, -0.22],
      [0.15, 0],
      [0, 0.22],
      [-0.15, 0],
    ]);

    if (haloD < 0) {
      return { d: haloD, h: 0.52 + domeHeight(haloD, 0.055, 0.20), mat: MAT.celestial, emit: 0.85 };
    }
    if (innerStar < 0) {
      return { d: innerStar, h: 0.58 + domeHeight(innerStar, 0.15, 0.25), mat: MAT.celestial, emit: 0.92 };
    }
    if (coreD < 0) {
      return { d: coreD, h: 0.44 + domeHeight(coreD, 0.24, 0.24), mat: MAT.gold, emit: 0.30 };
    }
    const featherGroove = Math.sin((y + ax * 0.8) * 34) * 0.055;
    const isGoldTip = wingD > -0.065;
    return {
      d: wingD,
      h: 0.26 + domeHeight(wingD, 0.22, 0.24) + featherGroove,
      mat: isGoldTip ? MAT.gold : MAT.darkSteel,
      emit: isGoldTip ? 0.22 : 0.04,
    };
  }

  if (id === "knight") {
    const s1 = sdSegment(x, y, -0.70, 0.66, 0.68, -0.68, 0.068);
    const s2 = sdSegment(x, y, 0.70, 0.66, -0.68, -0.68, 0.068);
    const swordsD = Math.min(s1, s2);
    const helmD = sdBox(x, y - 0.02, 0.38, 0.48, 0.16);
    const eyeSlit = sdBox(ax - 0.16, y + 0.08, 0.11, 0.032, 0.008);
    const crossV = sdBox(x, y - 0.04, 0.055, 0.44, 0.01);
    const crossH = sdBox(x, y + 0.08, 0.35, 0.055, 0.01);
    const crossD = Math.min(crossV, crossH);
    const centerGem = sdCircle(x, y + 0.08, 0.078);

    if (helmD < 0) {
      const cylH = 0.32 + Math.sqrt(Math.max(0, 0.20 - x * x)) * 0.55 - y * 0.06;
      if (centerGem < 0) {
        return { d: centerGem, h: cylH + 0.18 + domeHeight(centerGem, 0.08, 0.16), mat: MAT.emerald, emit: 0.68 };
      }
      if (eyeSlit < 0) {
        return { d: helmD, h: 0.16, mat: MAT.emerald, emit: 0.85 };
      }
      if (crossD < 0) {
        return { d: helmD, h: cylH + 0.08 + domeHeight(crossD, 0.05, 0.08), mat: MAT.gold, emit: 0.14 };
      }
      return { d: helmD, h: cylH + nGrain * 0.025, mat: MAT.darkSteel, emit: 0.04 };
    }
    return { d: swordsD, h: 0.20 + domeHeight(swordsD, 0.07, 0.22), mat: MAT.silver, emit: 0.16 };
  }

  if (id === "royal") {
    const velvetD = sdCircle(x, y + 0.04, 0.42);
    const crownPts = [
      [-0.48, 0.34],
      [-0.58, -0.18],
      [-0.28, 0.06],
      [0.0, -0.44],
      [0.28, 0.06],
      [0.58, -0.18],
      [0.48, 0.34],
    ];
    const crownBody = sdPolygon(x, y, crownPts);
    const baseBand = sdBox(x, y - 0.34, 0.50, 0.11, 0.04);
    const topOrb = sdCircle(x, y + 0.52, 0.085);
    const sideOrb = sdCircle(ax - 0.58, y + 0.22, 0.065);
    const crownD = Math.min(crownBody, baseBand, topOrb, sideOrb);

    const centerGem = sdPolygon(x, y - 0.08, [
      [0, -0.14],
      [0.11, 0],
      [0, 0.14],
      [-0.11, 0],
    ]);
    const bandSapphire = sdCircle(ax - 0.26, y - 0.34, 0.058);
    const bandEmerald = sdCircle(x, y - 0.34, 0.065);

    if (centerGem < 0) return { d: centerGem, h: 0.58 + domeHeight(centerGem, 0.12, 0.22), mat: MAT.diamond, emit: 0.72 };
    if (bandEmerald < 0) return { d: bandEmerald, h: 0.54 + domeHeight(bandEmerald, 0.065, 0.18), mat: MAT.emerald, emit: 0.65 };
    if (bandSapphire < 0) return { d: bandSapphire, h: 0.54 + domeHeight(bandSapphire, 0.058, 0.18), mat: MAT.amethyst, emit: 0.65 };
    if (topOrb < 0 || sideOrb < 0) {
      const od = Math.min(topOrb, sideOrb);
      return { d: od, h: 0.52 + domeHeight(od, 0.08, 0.20), mat: MAT.ruby, emit: 0.65 };
    }

    if (crownD < 0) {
      const pearlRidge = Math.sin(x * 36) * 0.03;
      const archCurve = Math.sqrt(Math.max(0, 0.36 - x * x)) * 0.22;
      return {
        d: crownD,
        h: 0.32 + domeHeight(crownD, 0.18, 0.24) + archCurve + pearlRidge,
        mat: MAT.gold,
        emit: 0.16,
      };
    }
    return {
      d: velvetD,
      h: 0.24 + domeHeight(velvetD, 0.42, 0.26) + nGrain * 0.03,
      mat: MAT.velvet,
      emit: 0.06,
    };
  }

  if (id === "founder") {
    const pedD = sdBox(x, y - 0.54, 0.52, 0.09, 0.04);
    const shardCenter = sdPolygon(x, y + 0.42, [
      [0, -0.28],
      [0.14, 0],
      [0, 0.22],
      [-0.14, 0],
    ]);
    const shardSide = sdPolygon(ax - 0.44, y + 0.22, [
      [0, -0.22],
      [0.11, 0],
      [0, 0.18],
      [-0.11, 0],
    ]);
    const crownPts = [
      [-0.50, 0.30],
      [-0.64, -0.22],
      [-0.32, 0.04],
      [-0.18, -0.32],
      [0.0, -0.04],
      [0.18, -0.32],
      [0.32, 0.04],
      [0.64, -0.22],
      [0.50, 0.30],
    ];
    const crownD = Math.min(sdPolygon(x, y - 0.04, crownPts), sdBox(x, y - 0.30, 0.52, 0.10, 0.04));
    const coreGem = sdPolygon(x, y - 0.12, [
      [0, -0.16],
      [0.13, 0],
      [0, 0.16],
      [-0.13, 0],
    ]);
    const sideGem = sdCircle(ax - 0.30, y - 0.28, 0.06);

    if (coreGem < 0) return { d: coreGem, h: 0.60 + domeHeight(coreGem, 0.14, 0.24), mat: MAT.echoCrystal, emit: 0.88 };
    if (sideGem < 0) return { d: sideGem, h: 0.56 + domeHeight(sideGem, 0.06, 0.18), mat: MAT.emerald, emit: 0.72 };
    if (shardCenter < 0 || shardSide < 0) {
      const sd = Math.min(shardCenter, shardSide);
      return {
        d: sd,
        h: 0.52 + domeHeight(sd, 0.14, 0.22) + facetPattern * 0.06,
        mat: MAT.echoCrystal,
        emit: 0.82,
      };
    }
    if (crownD < 0) {
      const isGoldEdge = crownD > -0.065 || Math.abs(y - 0.30) < 0.04;
      const cyl = Math.sqrt(Math.max(0, 0.42 - x * x)) * 0.20;
      return {
        d: crownD,
        h: 0.32 + domeHeight(crownD, 0.16, 0.24) + cyl,
        mat: isGoldEdge ? MAT.gold : MAT.obsidian,
        emit: isGoldEdge ? 0.24 : 0.06,
      };
    }
    const runeGlow = Math.abs(Math.sin(x * 22)) < 0.25 && Math.abs(y - 0.54) < 0.035;
    return {
      d: pedD,
      h: 0.28 + domeHeight(pedD, 0.09, 0.18),
      mat: runeGlow ? MAT.echoCrystal : MAT.darkSteel,
      emit: runeGlow ? 0.82 : 0.06,
    };
  }

  if (id === "legendary-key" || id === "magma-key" || id === "op-key" || id === "echo-key") {
    const c = Math.SQRT1_2;
    const kx = (x - y) * c;
    const ky = (x + y) * c;
    const akx = Math.abs(kx);

    const bowOuter = sdCircle(kx, ky + 0.36, 0.30);
    const bowWing = sdBox(akx - 0.24, ky + 0.36, 0.14, 0.12, 0.05);
    const bowCrown = sdPolygon(kx, ky + 0.52, [
      [-0.22, 0.12],
      [-0.26, -0.10],
      [0, -0.20],
      [0.26, -0.10],
      [0.22, 0.12],
    ]);
    const bowGem = sdPolygon(kx, ky + 0.36, [
      [0, -0.16],
      [0.14, 0],
      [0, 0.16],
      [-0.14, 0],
    ]);
    const shaft = sdBox(kx, ky - 0.26, 0.068, 0.42, 0.03);
    const collar1 = sdBox(kx, ky + 0.02, 0.12, 0.045, 0.02);
    const collar2 = sdBox(kx, ky - 0.18, 0.10, 0.038, 0.02);
    const tooth1 = sdBox(kx - 0.15, ky - 0.38, 0.13, 0.05, 0.015);
    const tooth2 = sdBox(kx - 0.19, ky - 0.51, 0.17, 0.055, 0.015);
    const tooth3 = sdBox(kx + 0.13, ky - 0.45, 0.11, 0.05, 0.015);

    const keyD = Math.min(bowOuter, bowWing, bowCrown, shaft, collar1, collar2, tooth1, tooth2, tooth3);
    const baseH = 0.28 + domeHeight(keyD, 0.14, 0.28);

    if (id === "legendary-key") {
      if (bowGem < 0) return { d: bowGem, h: 0.58 + domeHeight(bowGem, 0.14, 0.24), mat: MAT.emerald, emit: 0.7 };
      const flute = Math.cos(kx * 34) * 0.035;
      return { d: keyD, h: baseH + flute, mat: MAT.gold, emit: 0.16 };
    }

    if (id === "magma-key") {
      if (bowGem < 0) return { d: bowGem, h: 0.58 + domeHeight(bowGem, 0.14, 0.24), mat: MAT.magma, emit: 0.92 };
      const lavaCrack = Math.abs(Math.sin(kx * 22 + fbm(kx * 8, ky * 8) * 5) * Math.cos(ky * 18)) < 0.16;
      if (lavaCrack && keyD < -0.025) {
        return { d: keyD, h: baseH - 0.04, mat: MAT.magma, emit: 0.95 };
      }
      return { d: keyD, h: baseH + nGrain * 0.04, mat: MAT.obsidian, emit: 0.10 };
    }

    if (id === "op-key") {
      if (bowGem < 0) return { d: bowGem, h: 0.60 + domeHeight(bowGem, 0.14, 0.24), mat: MAT.diamond, emit: 0.88 };
      const rune = Math.abs(kx) < 0.028 && Math.sin(ky * 36) > 0.1;
      if (rune) return { d: keyD, h: baseH + 0.08, mat: MAT.diamond, emit: 0.92 };
      const isEdge = keyD > -0.045;
      return {
        d: keyD,
        h: baseH + facetPattern * 0.04,
        mat: isEdge ? MAT.silver : MAT.amethyst,
        emit: isEdge ? 0.22 : 0.54,
      };
    }

    if (id === "echo-key") {
      if (bowGem < 0) return { d: bowGem, h: 0.60 + domeHeight(bowGem, 0.14, 0.24), mat: MAT.echoCrystal, emit: 0.94 };
      const sculkVein = Math.abs(Math.sin((kx + ky) * 19 + nGrain * 6)) < 0.18;
      if (sculkVein && keyD < -0.02) {
        return { d: keyD, h: baseH + 0.05, mat: MAT.echoCrystal, emit: 0.88 };
      }
      return { d: keyD, h: baseH + nGrain * 0.03, mat: MAT.sculk, emit: 0.14 };
    }
  }

  if (id === "claim-10k") {
    const cube = isoCube(x, y, 0, 0.06, 0.56);
    const shieldBadge = sdPolygon(x, y + 0.04, [
      [0, -0.22],
      [0.18, -0.12],
      [0.15, 0.10],
      [0, 0.24],
      [-0.15, 0.10],
      [-0.18, -0.12],
    ]);
    if (shieldBadge < 0) {
      return {
        d: shieldBadge,
        h: 0.54 + domeHeight(shieldBadge, 0.16, 0.22),
        mat: shieldBadge > -0.04 ? MAT.gold : MAT.emerald,
        emit: 0.62,
      };
    }
    const isGoldBorder = cube.edgeDist < 0.085;
    const isGrassTop = cube.face === "top" || cube.localY < -0.15;
    return {
      d: cube.d,
      h: cube.h + nGrain * 0.04,
      mat: isGoldBorder ? MAT.gold : isGrassTop ? MAT.grass : MAT.dirt,
      emit: isGoldBorder ? 0.28 : 0.06,
    };
  }

  if (id === "claim-30k") {
    const cTop = isoCube(x, y, 0, -0.20, 0.38);
    const cLeft = isoCube(x, y, -0.28, 0.22, 0.36);
    const cRight = isoCube(x, y, 0.28, 0.22, 0.36);
    let best = cTop;
    let matChoice = MAT.emerald;
    if (cLeft.d < best.d) {
      best = cLeft;
      matChoice = MAT.gold;
    }
    if (cRight.d < best.d) {
      best = cRight;
      matChoice = MAT.diamond;
    }
    const isTrim = best.edgeDist < 0.09;
    return {
      d: best.d,
      h: best.h + facetPattern * 0.04,
      mat: isTrim ? MAT.gold : matChoice,
      emit: isTrim ? 0.24 : 0.52,
    };
  }

  if (id === "claim-50k") {
    const boxD = sdBox(x, y - 0.10, 0.52, 0.38, 0.08);
    const lockShield = sdPolygon(x, y - 0.06, [
      [0, -0.18],
      [0.15, -0.09],
      [0.12, 0.09],
      [0, 0.20],
      [-0.12, 0.09],
      [-0.15, -0.09],
    ]);
    const gem1 = isoCube(x, y, -0.22, -0.26, 0.22);
    const gem2 = isoCube(x, y, 0.22, -0.26, 0.22);
    const gem3 = isoCube(x, y, 0.0, -0.34, 0.25);
    const gemsD = Math.min(gem1.d, gem2.d, gem3.d);

    if (lockShield < 0) {
      return {
        d: lockShield,
        h: 0.56 + domeHeight(lockShield, 0.14, 0.22),
        mat: lockShield > -0.04 ? MAT.gold : MAT.emerald,
        emit: 0.65,
      };
    }
    if (gemsD < 0 && y < -0.08) {
      return { d: gemsD, h: 0.48 + domeHeight(gemsD, 0.15, 0.22) + facetPattern * 0.05, mat: MAT.emerald, emit: 0.72 };
    }
    const isBand = Math.abs(x) > 0.38 || Math.abs(y - 0.10) > 0.28 || Math.abs(y + 0.02) < 0.045;
    return {
      d: boxD,
      h: 0.30 + domeHeight(boxD, 0.25, 0.24) + nGrain * 0.03,
      mat: isBand ? MAT.gold : MAT.darkSteel,
      emit: isBand ? 0.22 : 0.05,
    };
  }

  if (id === "claim-100k") {
    const island = isoCube(x, y, 0, 0.26, 0.52);
    const centerTower = sdBox(x, y + 0.10, 0.18, 0.34, 0.03);
    const leftTower = sdBox(x + 0.32, y + 0.02, 0.11, 0.24, 0.02);
    const rightTower = sdBox(x - 0.32, y + 0.02, 0.11, 0.24, 0.02);
    const roofC = sdPolygon(x, y + 0.48, [
      [-0.22, 0.06],
      [0, -0.20],
      [0.22, 0.06],
    ]);
    const roofS = sdPolygon(ax - 0.32, y + 0.30, [
      [-0.14, 0.05],
      [0, -0.14],
      [0.14, 0.05],
    ]);
    const crystalOrb = sdPolygon(x, y - 0.04, [
      [0, -0.15],
      [0.11, 0],
      [0, 0.15],
      [-0.11, 0],
    ]);

    if (crystalOrb < 0) {
      return { d: crystalOrb, h: 0.62 + domeHeight(crystalOrb, 0.12, 0.22), mat: MAT.echoCrystal, emit: 0.88 };
    }
    if (roofC < 0 || roofS < 0) {
      const rd = Math.min(roofC, roofS);
      return { d: rd, h: 0.46 + domeHeight(rd, 0.12, 0.20), mat: MAT.gold, emit: 0.32 };
    }
    const towersD = Math.min(centerTower, leftTower, rightTower);
    if (towersD < 0 && y < 0.20) {
      const cylTower = domeHeight(towersD, 0.14, 0.22);
      return { d: towersD, h: 0.38 + cylTower, mat: MAT.silver, emit: 0.10 };
    }
    const isEmeraldCore = island.edgeDist < 0.09 || island.face === "top";
    return {
      d: island.d,
      h: island.h,
      mat: isEmeraldCore ? MAT.emerald : MAT.obsidian,
      emit: isEmeraldCore ? 0.55 : 0.08,
    };
  }

  return { d: sdCircle(x, y, 0.5), h: 0.3, mat: MAT.gold, emit: 0.2 };
}

const AURA = {
  master: [0.12, 0.85, 0.42],
  elite: [0.18, 0.78, 1.0],
  emperor: [1.0, 0.65, 0.15],
  titan: [0.68, 0.28, 1.0],
  divine: [1.0, 0.88, 0.42],
  knight: [0.22, 0.88, 0.52],
  royal: [1.0, 0.35, 0.52],
  founder: [0.10, 0.96, 0.86],
  "legendary-key": [0.98, 0.78, 0.18],
  "magma-key": [1.0, 0.35, 0.06],
  "op-key": [0.75, 0.28, 1.0],
  "echo-key": [0.06, 0.92, 0.92],
  "claim-10k": [0.28, 0.88, 0.36],
  "claim-30k": [0.18, 0.92, 0.62],
  "claim-50k": [0.95, 0.76, 0.22],
  "claim-100k": [0.16, 0.96, 0.78],
};

function renderIcon(id, size = 256) {
  const rgba = Buffer.alloc(size * size * 4);
  const aura = AURA[id] || [0.2, 0.8, 0.5];
  const eps = 2.2 / size;

  const L1 = [-0.52, -0.62, 0.58];
  const L2 = [0.60, 0.45, 0.66];
  const V = [0, 0, 1];

  const particles = [];
  for (let i = 0; i < 18; i++) {
    const a = i * 2.39996 + id.charCodeAt(0) * 0.5;
    const rad = 0.52 + (i % 5) * 0.085;
    particles.push({
      px: Math.cos(a) * rad,
      py: Math.sin(a) * rad,
      pr: 0.018 + (i % 3) * 0.011,
      bright: 0.55 + (i % 4) * 0.15,
    });
  }

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const x = ((px + 0.5) / size) * 2 - 1;
      const y = ((py + 0.5) / size) * 2 - 1;
      const r = hypot(x, y);

      const vignette = smoothstep(1.15, 0.15, r);
      const hexGrid = Math.abs(Math.sin(x * 18) * Math.sin((x * 0.5 + y * 0.866) * 18)) < 0.08 ? 0.04 : 0;
      let bgR = (0.045 + hexGrid * aura[0]) * vignette + aura[0] * Math.exp(-r * r * 2.8) * 0.34;
      let bgG = (0.065 + hexGrid * aura[1]) * vignette + aura[1] * Math.exp(-r * r * 2.8) * 0.34;
      let bgB = (0.075 + hexGrid * aura[2]) * vignette + aura[2] * Math.exp(-r * r * 2.8) * 0.34;

      if (id.startsWith("claim-") || id === "echo-key" || id === "founder") {
        const domeR = 0.76;
        const ringDist = Math.abs(r - domeR);
        const domeGlow = Math.exp(-ringDist * ringDist * 420) * 0.45;
        bgR += aura[0] * domeGlow;
        bgG += aura[1] * domeGlow;
        bgB += aura[2] * domeGlow;
      }

      const s = evalItemScene(id, x, y);
      const sShadow = evalItemScene(id, x - 0.045, y - 0.065);
      const shadowMask = smoothstep(0.08, -0.04, sShadow.d);
      bgR *= 1 - shadowMask * 0.68;
      bgG *= 1 - shadowMask * 0.68;
      bgB *= 1 - shadowMask * 0.68;

      const bloom = Math.exp(-Math.max(0, s.d) * 9.5) * 0.42;
      bgR += aura[0] * bloom;
      bgG += aura[1] * bloom;
      bgB += aura[2] * bloom;

      let outR = bgR;
      let outG = bgG;
      let outB = bgB;

      if (s.d < 0.015) {
        const sx = evalItemScene(id, x + eps, y);
        const sy = evalItemScene(id, x, y + eps);
        const dx = (sx.h - s.h) / eps;
        const dy = (sy.h - s.h) / eps;
        let nx = -dx * 0.45;
        let ny = -dy * 0.45;
        let nz = 1.0;
        const nLen = Math.hypot(nx, ny, nz) || 1;
        nx /= nLen;
        ny /= nLen;
        nz /= nLen;

        const mat = s.mat;
        const ndl1 = Math.max(0, nx * L1[0] + ny * L1[1] + nz * L1[2]);
        const ndl2 = Math.max(0, nx * L2[0] + ny * L2[1] + nz * L2[2]);

        let hx = L1[0] + V[0], hy = L1[1] + V[1], hz = L1[2] + V[2];
        const hLen = Math.hypot(hx, hy, hz) || 1;
        hx /= hLen; hy /= hLen; hz /= hLen;
        const ndh = Math.max(0, nx * hx + ny * hy + nz * hz);
        const shininess = Math.max(8, (1 - mat.rough) * 96);
        const spec1 = Math.pow(ndh, shininess) * (1.45 - mat.rough);

        let hx2 = L2[0] + V[0], hy2 = L2[1] + V[1], hz2 = L2[2] + V[2];
        const hLen2 = Math.hypot(hx2, hy2, hz2) || 1;
        hx2 /= hLen2; hy2 /= hLen2; hz2 /= hLen2;
        const ndh2 = Math.max(0, nx * hx2 + ny * hy2 + nz * hz2);
        const spec2 = Math.pow(ndh2, shininess * 0.6) * 0.55;

        const fresnel = Math.pow(1 - clamp(nz, 0, 1), 2.2) * 0.72 + smoothstep(-0.045, 0.0, s.d) * 0.45;
        const envBand = 0.5 + 0.5 * Math.sin(ny * 6.0 - nx * 3.0);
        const envFactor = mat.metal * 0.42 * envBand;

        const diff = 0.26 + ndl1 * 0.90 + ndl2 * 0.36;
        let objR = mat.base[0] * diff + mat.spec[0] * (spec1 + envFactor) + aura[0] * (spec2 + fresnel * 0.55);
        let objG = mat.base[1] * diff + mat.spec[1] * (spec1 + envFactor) + aura[1] * (spec2 + fresnel * 0.55);
        let objB = mat.base[2] * diff + mat.spec[2] * (spec1 + envFactor) + aura[2] * (spec2 + fresnel * 0.55);

        if (mat.glow || s.emit > 0) {
          const gCol = mat.glow || aura;
          objR += gCol[0] * s.emit * 0.72;
          objG += gCol[1] * s.emit * 0.72;
          objB += gCol[2] * s.emit * 0.72;
        }

        const cov = smoothstep(0.015, -0.012, s.d);
        outR = mix(bgR, objR, cov);
        outG = mix(bgG, objG, cov);
        outB = mix(bgB, objB, cov);
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const pd = hypot(x - p.px, y - p.py);
        if (pd < p.pr * 2.6) {
          const pg = Math.exp(-(pd * pd) / (p.pr * p.pr * 0.65)) * p.bright;
          outR += mix(aura[0], 1.0, 0.55) * pg;
          outG += mix(aura[1], 1.0, 0.55) * pg;
          outB += mix(aura[2], 1.0, 0.55) * pg;
        }
      }

      const borderD = sdBox(x, y, 0.94, 0.94, 0.18);
      const borderLine = Math.exp(-borderD * borderD * 900) * 0.28;
      outR += aura[0] * borderLine;
      outG += aura[1] * borderLine;
      outB += aura[2] * borderLine;

      const tone = (c) => {
        const val = Number.isFinite(c) ? c : 0;
        const mapped = (val * (2.51 * val + 0.03)) / (val * (2.43 * val + 0.59) + 0.14);
        return Math.round(clamp(Math.pow(clamp(mapped, 0, 1), 1 / 1.1), 0, 1) * 255);
      };

      const idx = (py * size + px) * 4;
      rgba[idx] = tone(outR);
      rgba[idx + 1] = tone(outG);
      rgba[idx + 2] = tone(outB);
      rgba[idx + 3] = 255;
    }
  }

  const outPaths = OUT_DIRS.map((d) => path.join(d, `${id}.png`));
  writePng(size, size, rgba, outPaths);
}

const ITEMS = [
  "master",
  "elite",
  "emperor",
  "titan",
  "divine",
  "knight",
  "royal",
  "founder",
  "legendary-key",
  "magma-key",
  "op-key",
  "echo-key",
  "claim-10k",
  "claim-30k",
  "claim-50k",
  "claim-100k",
];

for (const id of ITEMS) {
  renderIcon(id, 256);
  console.log(`Rendered realistic 3D icon: ${id}.png`);
}
