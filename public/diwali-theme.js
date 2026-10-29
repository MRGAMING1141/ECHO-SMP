/* ==========================================================================
   ECHO SMP - temporary Diwali decoration layer (2026)
   --------------------------------------------------------------------------
   VISUAL ONLY. This file never reads or changes cart, checkout, payment QR,
   orders, sales log, delivered/delete buttons, Supabase or Firebase calls.
   It only appends pointer-events:none decorations to the page.

   INSTALL   : <script src="/diwali-theme.js" defer></script>   (one line)
   SWITCH OFF: set DIWALI_ENABLED = false below, or delete the script line.
   EXPIRY    : automatic at the end of 12 Nov 2026, 23:59 IST (Diwali = 8 Nov).

   Crackers fire automatically in the background. No buttons, no sounds.
   NOTE: the page has *{background-image:none!important}; gradients here use
   !important so the glow, flames and marigolds actually render.
   ========================================================================== */
(() => {
  "use strict";

  const DIWALI_ENABLED = true; // <-- ONE-LINE ON/OFF SWITCH
  const EXPIRES_AT = new Date("2026-11-12T23:59:59+05:30").getTime();

  if (!DIWALI_ENABLED) return;
  if (Date.now() > EXPIRES_AT) return;
  if (window.__echoDiwali) return; // never double-inject
  window.__echoDiwali = true;

  const TAU = Math.PI * 2;
  const GOLD = ["#fff6d8", "#ffe9a8", "#ffd37a", "#ffb347", "#ff9a3c"];
  const FIERY = ["#fff6d8", "#ffe9a8", "#ffd37a", "#ffb347", "#ff9a3c", "#ff7a5c", "#ff5f8f"];
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = motionQuery.matches;

  /* --------------------------------------------------------------- styles */
  const style = document.createElement("style");
  style.id = "ed-styles";
  style.textContent = `
    #ed-diwali,#ed-diwali *{box-sizing:border-box}
    #ed-diwali{position:fixed;inset:0;z-index:3;pointer-events:none;overflow:hidden;contain:layout style paint}

    /* warm light: stronger at the top, pooling at the bottom corners */
    #ed-glow{position:fixed;inset:0;z-index:2;pointer-events:none;
      background:
        radial-gradient(125% 58% at 50% -9%,rgba(255,170,58,.32),rgba(255,170,58,0) 67%),
        radial-gradient(64% 48% at -6% 106%,rgba(255,116,30,.22),rgba(255,116,30,0) 72%),
        radial-gradient(64% 48% at 106% 106%,rgba(255,116,30,.22),rgba(255,116,30,0) 72%),
        radial-gradient(48% 34% at 50% 108%,rgba(255,196,100,.13),rgba(255,196,100,0) 72%)!important;
    }
    #ed-bokeh{position:fixed;inset:0;z-index:2;pointer-events:none;
      background:
        radial-gradient(circle at 11% 18%,rgba(255,186,80,.18),rgba(255,186,80,0) 11%),
        radial-gradient(circle at 88% 12%,rgba(255,126,58,.15),rgba(255,126,58,0) 9%),
        radial-gradient(circle at 74% 46%,rgba(255,206,120,.09),rgba(255,206,120,0) 13%),
        radial-gradient(circle at 22% 62%,rgba(255,160,60,.11),rgba(255,160,60,0) 12%),
        radial-gradient(circle at 52% 84%,rgba(255,190,90,.08),rgba(255,190,90,0) 10%),
        radial-gradient(circle at 94% 78%,rgba(255,140,50,.11),rgba(255,140,50,0) 11%)!important;
    }
    #ed-frame{position:fixed;inset:8px;z-index:3;pointer-events:none;border:1px solid rgba(255,196,100,.30);
      border-radius:18px;box-shadow:inset 0 0 0 1px rgba(255,140,40,.06),inset 0 0 110px rgba(255,150,50,.09)}
    #ed-diwali canvas{position:absolute;inset:0;display:block;width:100%;height:100%}

    /* marigold toran, hanging from the sticky nav */
    .ed-toran{position:absolute;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + var(--ed-nav,58px));height:58px}
    .ed-wire{position:absolute;left:0;right:0;top:6px;height:18px;border-top:1px solid rgba(255,214,150,.46);border-radius:50%}
    .ed-flower{position:absolute;display:block;width:16px;height:16px;border-radius:50%;
      background-color:#ff9f2e;
      background-image:repeating-conic-gradient(from 0deg,#ffe0a0 0 15deg,#ff9a2b 15deg 30deg)!important;
      box-shadow:0 0 9px 2px rgba(255,150,40,.38),inset 0 0 4px rgba(120,40,0,.4);
      transform:translate(-50%,-50%)}
    .ed-flower::after{content:"";position:absolute;left:50%;top:50%;width:5px;height:5px;margin:-2.5px 0 0 -2.5px;
      border-radius:50%;background-color:#fff3c4;box-shadow:0 0 6px rgba(255,235,170,.9)}
    .ed-leaf{position:absolute;width:10px;height:6px;margin:-3px 0 0 -5px;border-radius:60% 10% 60% 10%;
      background-color:#a9c96a;opacity:.82;transform:rotate(-26deg)}
    .ed-tassel{position:absolute;width:1px;height:16px;background-color:rgba(255,210,130,.78);transform:translateX(-50%)}
    .ed-tassel::after{content:"";position:absolute;left:50%;bottom:-4px;width:5px;height:5px;margin-left:-2.5px;
      border-radius:50%;background-color:#ffd37a;box-shadow:0 0 8px 2px rgba(255,170,60,.65)}
    .ed-bulb{position:absolute;display:block;width:7px;height:11px;margin-left:-3.5px;border-radius:50% 50% 46% 46%;
      background-color:#ffd37a;box-shadow:0 0 8px 2px rgba(255,170,60,.5),0 0 18px 6px rgba(255,140,40,.18);
      animation:ed-bulb 2.8s ease-in-out infinite alternate}
    .ed-bulb::before{content:"";position:absolute;left:2px;top:-4px;width:3px;height:5px;border-radius:1px;background-color:#c9a061}
    .ed-bulb:nth-child(4n+1){background-color:#ffb15c;box-shadow:0 0 8px 2px rgba(255,120,40,.46),0 0 18px 6px rgba(255,90,20,.16)}
    .ed-bulb:nth-child(4n+2){background-color:#ffe7a3}
    .ed-bulb:nth-child(4n+3){background-color:#ff8f5c}
    @keyframes ed-bulb{from{opacity:.65}to{opacity:1}}

    /* rangoli quarters in the four corners */
    .ed-rangoli{position:absolute;width:210px;height:210px;color:#ffc46a;opacity:.42;pointer-events:none;
      animation:ed-spin 110s linear infinite;transform-origin:50% 50%}
    .ed-rangoli svg{display:block;width:100%;height:100%;overflow:visible}
    .ed-rangoli.tl{top:calc(env(safe-area-inset-top,0px) + var(--ed-nav,58px) + 34px);left:-72px}
    .ed-rangoli.tr{top:calc(env(safe-area-inset-top,0px) + var(--ed-nav,58px) + 34px);right:-72px;animation-direction:reverse}
    .ed-rangoli.bl{bottom:-76px;left:-72px}
    .ed-rangoli.br{bottom:-76px;right:-72px;animation-direction:reverse}
    @keyframes ed-spin{to{transform:rotate(360deg)}}

    /* glowing diyas: top corners always, bottom corners on wide screens */
    .ed-diya{position:absolute;display:block;width:68px;height:46px;filter:drop-shadow(0 8px 18px rgba(255,140,40,.4));
      top:calc(env(safe-area-inset-top,0px) + var(--ed-nav,58px) + 52px)}
    .ed-diya.left{left:4px}
    .ed-diya.right{right:4px;transform:scaleX(-1)}
    .ed-diya.bl,.ed-diya.br{display:none;top:auto;bottom:18px}
    .ed-diya.bl{left:6px}
    .ed-diya.br{right:6px;transform:scaleX(-1) scale(.94)}
    @media(min-width:900px){.ed-diya.bl,.ed-diya.br{display:block}}
    .ed-halo{position:absolute;left:50%;top:-16px;width:104px;height:104px;margin-left:-52px;border-radius:50%;pointer-events:none;
      background-image:radial-gradient(circle,rgba(255,180,70,.32),rgba(255,140,40,.12) 44%,rgba(255,140,40,0) 70%)!important}
    .ed-bowl{position:absolute;left:3px;bottom:0;display:block;width:62px;height:23px;border-radius:6px 6px 30px 30px;
      background-color:#b0521f;
      background-image:linear-gradient(90deg,#6f2f13,#e08133 42%,#b0521f 70%,#7c3517)!important;
      box-shadow:inset 0 -2px 0 rgba(255,214,140,.55),inset 0 3px 6px rgba(255,190,110,.24),0 4px 12px rgba(0,0,0,.35)}
    .ed-bowl::after{content:"";position:absolute;left:9px;right:9px;bottom:5px;height:4px;border-radius:50%;background-color:rgba(255,210,120,.5)}
    .ed-flame{position:absolute;left:28px;bottom:18px;display:block;width:14px;height:27px;
      border-radius:50% 50% 50% 50%/62% 62% 38% 38%;
      background-image:radial-gradient(ellipse at 50% 72%,#fffbe0 0%,#ffd166 36%,#ff8a2b 64%,rgba(255,90,10,0) 100%)!important;
      box-shadow:0 0 18px 7px rgba(255,150,50,.42);transform-origin:50% 90%;
      animation:ed-flame 1.7s ease-in-out infinite alternate}
    @keyframes ed-flame{from{transform:scale(.94) rotate(-2.5deg)}to{transform:scale(1.06) rotate(2.5deg)}}

    /* greeting plaque, hanging from the toran */
    #ed-greeting{position:fixed;z-index:4;left:50%;transform:translateX(-50%);
      top:calc(env(safe-area-inset-top,0px) + var(--ed-nav,58px) + 4px);max-width:calc(100vw - 22px);
      padding:7px 15px;border-radius:999px;border:1px solid rgba(255,214,140,.7);
      background-color:rgba(48,25,10,.94);color:#fff0c9;
      font:700 13px/1.2 Figtree,system-ui,-apple-system,sans-serif;letter-spacing:.2px;text-align:center;
      white-space:nowrap;pointer-events:none;
      box-shadow:0 8px 26px rgba(0,0,0,.4),0 0 26px rgba(255,150,40,.24),inset 0 1px 0 rgba(255,235,190,.22)}

    @media (max-width:600px){
      #ed-frame{inset:6px;border-radius:14px;border-color:rgba(255,196,100,.26)}
      .ed-toran{height:48px}
      .ed-rangoli{width:150px;height:150px;opacity:.34}
      .ed-rangoli.tl,.ed-rangoli.tr{top:calc(env(safe-area-inset-top,0px) + var(--ed-nav,58px) + 28px)}
      .ed-rangoli.tl,.ed-rangoli.bl{left:-52px}
      .ed-rangoli.tr,.ed-rangoli.br{right:-52px}
      .ed-rangoli.bl,.ed-rangoli.br{bottom:-56px}
      .ed-diya{top:calc(env(safe-area-inset-top,0px) + var(--ed-nav,58px) + 44px);transform:scale(.84);transform-origin:top left}
      .ed-diya.right{transform:scaleX(-1) scale(.84);transform-origin:top right}
      #ed-greeting{font-size:11px;padding:6px 11px;letter-spacing:0}
    }
    @media (prefers-reduced-motion:reduce){
      .ed-bulb,.ed-flame,.ed-rangoli{animation:none}
      #ed-diwali canvas{display:none}
    }
  `;
  document.head.appendChild(style);

  /* ------------------------------------------------------------ structure */
  const glow = document.createElement("div");
  glow.id = "ed-glow";
  glow.setAttribute("aria-hidden", "true");

  const bokeh = document.createElement("div");
  bokeh.id = "ed-bokeh";
  bokeh.setAttribute("aria-hidden", "true");

  const frameEl = document.createElement("div");
  frameEl.id = "ed-frame";
  frameEl.setAttribute("aria-hidden", "true");

  const layer = document.createElement("div");
  layer.id = "ed-diwali";
  layer.setAttribute("aria-hidden", "true");

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  const c2d = canvas.getContext ? canvas.getContext("2d") : null;
  layer.appendChild(canvas);

  /* ------------------------------------------------------------- marigolds */
  const toran = document.createElement("div");
  toran.className = "ed-toran";
  toran.setAttribute("aria-hidden", "true");

  const wire = document.createElement("i");
  wire.className = "ed-wire";
  toran.appendChild(wire);

  const FLOWERS = 24;
  for (let i = 0; i < FLOWERS; i++) {
    const t = (i + 0.5) / FLOWERS;
    const x = 1 + t * 98;
    const lift = Math.sin(t * Math.PI) * 7;
    const size = 13 + Math.random() * 5;

    const flower = document.createElement("i");
    flower.className = "ed-flower";
    flower.style.left = x.toFixed(2) + "%";
    flower.style.top = (12 + lift).toFixed(1) + "px";
    flower.style.width = size.toFixed(1) + "px";
    flower.style.height = size.toFixed(1) + "px";
    flower.style.zIndex = "2";
    toran.appendChild(flower);

    if (i % 2 === 0 && i < FLOWERS - 1) {
      const leaf = document.createElement("i");
      leaf.className = "ed-leaf";
      leaf.style.left = (x + 1.1).toFixed(2) + "%";
      leaf.style.top = (14 + lift).toFixed(1) + "px";
      leaf.style.transform = "rotate(" + (-48 + Math.random() * 26).toFixed(0) + "deg)";
      toran.appendChild(leaf);
    }

    if (i % 4 === 1) {
      const tassel = document.createElement("i");
      tassel.className = "ed-tassel";
      tassel.style.left = x.toFixed(2) + "%";
      tassel.style.top = (23 + lift).toFixed(1) + "px";
      tassel.style.zIndex = "1";
      toran.appendChild(tassel);
    }
  }

  const BULBS = 14;
  for (let i = 0; i < BULBS; i++) {
    const t = (i + 0.5) / BULBS;
    const lift = Math.sin(t * Math.PI) * 4;
    const bulb = document.createElement("i");
    bulb.className = "ed-bulb";
    bulb.style.left = (2 + t * 96).toFixed(2) + "%";
    bulb.style.top = (33 + lift).toFixed(1) + "px";
    bulb.style.animationDelay = (Math.random() * 2.4).toFixed(2) + "s";
    bulb.style.animationDuration = (2.1 + Math.random() * 1.5).toFixed(2) + "s";
    toran.appendChild(bulb);
  }
  layer.appendChild(toran);

  /* -------------------------------------------------------------- rangoli */
  function rangoliMarkup() {
    let petals = "";
    for (let i = 0; i < 16; i++) {
      petals += '<ellipse cx="100" cy="47" rx="7" ry="21" transform="rotate(' + i * 22.5 + ' 100 100)"/>';
    }
    let dots = "";
    for (let i = 0; i < 24; i++) {
      const a = (i * TAU) / 24;
      dots += '<circle cx="' + (100 + Math.cos(a) * 86).toFixed(1) + '" cy="' + (100 + Math.sin(a) * 86).toFixed(1) + '" r="1.5"/>';
    }
    return '<svg viewBox="0 0 200 200" role="presentation" focusable="false">' +
      '<circle cx="100" cy="100" r="94" fill="currentColor" opacity=".05"/>' +
      '<g fill="none" stroke="currentColor" stroke-width="1.25">' +
        '<circle cx="100" cy="100" r="93" opacity=".4"/>' +
        '<circle cx="100" cy="100" r="72" opacity=".55"/>' +
        '<g opacity=".5">' + petals + '</g>' +
        '<g opacity=".55">' + dots + '</g>' +
        '<circle cx="100" cy="100" r="24" opacity=".65"/>' +
        '<circle cx="100" cy="100" r="9" opacity=".8"/>' +
      '</g>' +
      '<circle cx="100" cy="100" r="4" fill="currentColor" opacity=".6"/>' +
    '</svg>';
  }
  const RANGOLI = rangoliMarkup();
  ["tl", "tr", "bl", "br"].forEach((pos) => {
    const r = document.createElement("div");
    r.className = "ed-rangoli " + pos;
    r.setAttribute("aria-hidden", "true");
    r.innerHTML = RANGOLI;
    layer.appendChild(r);
  });

  /* ---------------------------------------------------------------- diyas */
  [
    ["left", "top"],
    ["right", "top"],
    ["bl", "bottom"],
    ["br", "bottom"]
  ].forEach(([side]) => {
    const diya = document.createElement("div");
    diya.className = "ed-diya " + side;
    diya.setAttribute("aria-hidden", "true");
    diya.innerHTML = '<i class="ed-halo"></i><i class="ed-flame"></i><i class="ed-bowl"></i>';
    layer.appendChild(diya);
  });

  const greeting = document.createElement("div");
  greeting.id = "ed-greeting";
  greeting.textContent = "\u{1FA94} Happy Diwali from Echo SMP \u2728";

  const mount = () => {
    document.body.appendChild(glow);
    document.body.appendChild(bokeh);
    document.body.appendChild(frameEl);
    document.body.appendChild(layer);
    document.body.appendChild(greeting);
    syncNav();
    resize();
    startEffects();
    bootShow();
  };
  /* --------------------------------------------------------------- layout */
  function syncNav() {
    const nav = document.querySelector("nav");
    const h = nav ? Math.round(nav.getBoundingClientRect().height) : 0;
    document.documentElement.style.setProperty("--ed-nav", (h > 20 && h < 180 ? h : 58) + "px");
  }

  let W = 0, H = 0;
  function resize() {
    W = window.innerWidth || document.documentElement.clientWidth;
    H = window.innerHeight || document.documentElement.clientHeight;
    if (!c2d) return;
    const dpr = Math.min(window.devicePixelRatio || 1, W < 700 ? 1.75 : 2);
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ------------------------------------------------------------- particles */
  const parts = [];
  const rockets = [];
  const rings = [];
  const emitters = [];
  const spinners = [];
  const cap = () => (W < 640 ? 180 : 300);
  let running = false;
  let rafId = 0;
  let lastT = 0;

  function kick() {
    if (running || reduced || document.hidden || !c2d) return;
    running = true;
    lastT = 0;
    rafId = requestAnimationFrame(frame);
  }

  function spawn(x, y, vx, vy, life, size, color, opts) {
    if (parts.length >= cap()) return;
    const p = {
      x: x, y: y, px: x, py: y, vx: vx, vy: vy, life: life, maxLife: life,
      size: size, color: color, grav: 0.035, drag: 0.992, trail: false
    };
    if (opts) {
      if (opts.grav != null) p.grav = opts.grav;
      if (opts.drag != null) p.drag = opts.drag;
      if (opts.trail != null) p.trail = opts.trail;
    }
    parts.push(p);
  }

  function burst(x, y, opts) {
    const o = opts || {};
    const palette = o.palette || FIERY;
    const scale = W < 640 ? 0.6 : 1;
    const count = Math.min(Math.round((o.count || 55) * scale), cap() - parts.length);
    const power = (o.power || 4.2) * (W < 640 ? 0.9 : 1);
    const pattern = o.pattern || "peony";
    for (let i = 0; i < count; i++) {
      let a, sp;
      if (pattern === "ring") {
        a = (i / count) * TAU;
        sp = power * (0.92 + Math.random() * 0.12);
      } else if (pattern === "willow") {
        a = Math.random() * TAU;
        sp = power * (0.28 + Math.random() * 0.62);
      } else {
        a = Math.random() * TAU;
        sp = power * (0.32 + Math.random() * 0.98);
      }
      spawn(
        x, y,
        Math.cos(a) * sp, Math.sin(a) * sp,
        42 + Math.random() * 58,
        1.05 + Math.random() * 1.6,
        palette[(Math.random() * palette.length) | 0],
        { trail: Math.random() < 0.38, grav: pattern === "willow" ? 0.055 : 0.038 }
      );
    }
    rings.push({ x: x, y: y, r: 6, life: 1, color: "rgba(255,214,140,.55)" });
    kick();
  }

  function spawnSparkle() {
    if (parts.length >= cap() - 10 || !W || !H) return;
    const x = Math.random() * W;
    const life = 280 + Math.random() * 300;
    spawn(
      x, -12,
      (Math.random() - 0.5) * 0.5, 0.45 + Math.random() * 1.05,
      life, 1 + Math.random() * 1.6,
      GOLD[(Math.random() * GOLD.length) | 0],
      { grav: 0.0025, drag: 1 }
    );
    kick();
  }

  function launchRocket(x) {
    if (!active || reduced || document.hidden) return;
    rockets.push({
      x: x != null ? x : W * (0.12 + Math.random() * 0.76),
      y: H + 12,
      vy: -(5.2 + Math.random() * 2.2),
      targetY: H * (0.12 + Math.random() * 0.3),
      trail: 0
    });
    kick();
  }

  function autoCracker() {
    if (!active || reduced || document.hidden || !W || !H) return;
    const r = Math.random();
    if (r < 0.46) {
      launchRocket();
    } else if (r < 0.64) {
      const x = W * (0.08 + Math.random() * 0.84);
      const y = H * 0.85;
      emitters.push({ x: x, y: y, life: 44 + Math.random() * 20 });
      rings.push({ x: x, y: y, r: 4, life: 0.9, color: "rgba(255,200,120,.5)" });
      kick();
    } else if (r < 0.82) {
      spinners.push({
        x: W * (0.12 + Math.random() * 0.76),
        y: H * (0.7 + Math.random() * 0.14),
        life: 54 + Math.random() * 30,
        angle: Math.random() * TAU,
        spin: (Math.random() < 0.5 ? -1 : 1) * (0.18 + Math.random() * 0.14)
      });
      kick();
    } else {
      burst(W * (0.16 + Math.random() * 0.68), H * (0.16 + Math.random() * 0.26), {
        count: 95, power: 5.4, pattern: Math.random() < 0.4 ? "ring" : "peony"
      });
    }
  }

  function update(k) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.px = p.x;
      p.py = p.y;
      p.x += p.vx * k;
      p.y += p.vy * k;
      p.vy += p.grav * k;
      p.vx *= Math.pow(p.drag, k);
      p.vy *= Math.pow(p.drag, k);
      p.life -= k;
      if (p.life <= 0 || p.y > H + 40 || p.y < -80 || p.x < -60 || p.x > W + 60) parts.splice(i, 1);
    }
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.y += r.vy * k;
      r.trail -= k;
      if (r.trail <= 0) {
        r.trail = 2.4;
        spawn(r.x + (Math.random() - 0.5) * 2, r.y + 8, (Math.random() - 0.5) * 0.6, 1.1 + Math.random(), 16, 1.1, "#ffcf7a", { grav: 0.015, drag: 0.98 });
      }
      if (r.y <= r.targetY) {
        burst(r.x, r.y, { count: 58, power: 4.8, pattern: Math.random() < 0.3 ? "ring" : "peony" });
        rockets.splice(i, 1);
      }
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.r += 2.7 * k;
      r.life -= 0.04 * k;
      if (r.life <= 0) rings.splice(i, 1);
    }
    for (let i = emitters.length - 1; i >= 0; i--) {
      const e = emitters[i];
      const n = Math.max(1, Math.round(2.2 * k));
      for (let j = 0; j < n; j++) {
        spawn(
          e.x + (Math.random() - 0.5) * 10, e.y,
          (Math.random() - 0.5) * 2.8, -(2.4 + Math.random() * 3.2),
          28 + Math.random() * 26, 0.9 + Math.random() * 1.3,
          GOLD[(Math.random() * GOLD.length) | 0],
          { grav: 0.06, drag: 0.985 }
        );
      }
      e.life -= k;
      if (e.life <= 0) emitters.splice(i, 1);
    }
    for (let i = spinners.length - 1; i >= 0; i--) {
      const s = spinners[i];
      s.angle += s.spin * k;
      for (let j = 0; j < 3; j++) {
        const a = s.angle + (j * TAU) / 3;
        const sx = s.x + Math.cos(a) * 4;
        const sy = s.y + Math.sin(a) * 4;
        spawn(
          sx, sy,
          -Math.sin(a) * s.spin * 12 + (Math.random() - 0.5) * 0.7,
          Math.cos(a) * s.spin * 12 + (Math.random() - 0.5) * 0.7 - 0.25,
          24 + Math.random() * 22, 0.8 + Math.random() * 1.1,
          GOLD[(Math.random() * GOLD.length) | 0],
          { grav: 0.02, drag: 0.98 }
        );
      }
      s.life -= k;
      if (s.life <= 0) spinners.splice(i, 1);
    }
  }

  function draw() {
    if (!c2d) return;
    c2d.clearRect(0, 0, W, H);
    if (!parts.length && !rockets.length && !rings.length && !emitters.length && !spinners.length) return;
    c2d.globalCompositeOperation = "lighter";

    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      const t = Math.max(0, Math.min(1, p.life / p.maxLife));
      c2d.globalAlpha = t * 0.95;
      c2d.fillStyle = p.color;
      if (p.trail) {
        c2d.strokeStyle = p.color;
        c2d.lineWidth = p.size * 0.8;
        c2d.beginPath();
        c2d.moveTo(p.px, p.py);
        c2d.lineTo(p.x, p.y);
        c2d.stroke();
      } else {
        c2d.beginPath();
        c2d.arc(p.x, p.y, p.size * (0.45 + t * 0.55), 0, TAU);
        c2d.fill();
      }
    }

    for (let i = 0; i < rockets.length; i++) {
      const r = rockets[i];
      c2d.globalAlpha = 0.85;
      c2d.fillStyle = "#ffe6a8";
      c2d.beginPath();
      c2d.arc(r.x, r.y, 2, 0, TAU);
      c2d.fill();
      c2d.globalAlpha = 0.3;
      c2d.strokeStyle = "#ffb347";
      c2d.lineWidth = 2;
      c2d.beginPath();
      c2d.moveTo(r.x, r.y);
      c2d.lineTo(r.x, r.y + 14);
      c2d.stroke();
    }

    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      c2d.globalAlpha = Math.max(0, r.life) * 0.55;
      c2d.strokeStyle = r.color;
      c2d.lineWidth = 1.6;
      c2d.beginPath();
      c2d.arc(r.x, r.y, r.r, 0, TAU);
      c2d.stroke();
    }

    for (let i = 0; i < spinners.length; i++) {
      const s = spinners[i];
      const pulse = 0.7 + Math.sin(s.life * 0.35) * 0.25;
      c2d.globalAlpha = 0.85;
      c2d.fillStyle = "#fff3c4";
      c2d.beginPath();
      c2d.arc(s.x, s.y, 2.6, 0, TAU);
      c2d.fill();
      c2d.globalAlpha = 0.25 * pulse;
      c2d.strokeStyle = "#ffb347";
      c2d.lineWidth = 1.3;
      c2d.beginPath();
      c2d.arc(s.x, s.y, 9, 0, TAU);
      c2d.stroke();
    }

    c2d.globalAlpha = 1;
    c2d.globalCompositeOperation = "source-over";
  }

  function frame(now) {
    if (!running) return;
    // Phones render at ~30fps; desktop stays smooth.
    if (W < 700 && lastT && now - lastT < 30) {
      rafId = requestAnimationFrame(frame);
      return;
    }
    const dt = lastT ? Math.min(50, now - lastT) : 16.7;
    lastT = now;
    update(dt / 16.667);
    draw();
    if (parts.length || rockets.length || rings.length || emitters.length || spinners.length) {
      rafId = requestAnimationFrame(frame);
    } else {
      running = false;
      if (c2d) c2d.clearRect(0, 0, W, H);
    }
  }

  /* ------------------------------------------------------------- schedule */
  let sparkTimer = 0;
  let crackerTimer = 0;
  let active = false;
  let booted = false;

  function scheduleSparkles() {
    if (!active) return;
    sparkTimer = setTimeout(() => {
      if (!active) return;
      if (!document.hidden) {
        spawnSparkle();
        if (Math.random() < 0.35) spawnSparkle();
      }
      scheduleSparkles();
    }, 380 + Math.random() * 420);
  }

  function scheduleCrackers() {
    if (!active) return;
    const delay = W < 700 ? 2200 + Math.random() * 2400 : 1450 + Math.random() * 2000;
    crackerTimer = setTimeout(() => {
      if (!active) return;
      autoCracker();
      scheduleCrackers();
    }, delay);
  }

  function clearCanvas() {
    if (c2d) c2d.clearRect(0, 0, W, H);
  }

  function stopEffects() {
    active = false;
    clearTimeout(sparkTimer);
    clearTimeout(crackerTimer);
    sparkTimer = crackerTimer = 0;
    cancelAnimationFrame(rafId);
    running = false;
    parts.length = 0;
    rockets.length = 0;
    rings.length = 0;
    emitters.length = 0;
    spinners.length = 0;
    clearCanvas();
  }

  function startEffects() {
    if (reduced || document.hidden) return;
    active = true;
    if (!sparkTimer) scheduleSparkles();
    if (!crackerTimer) scheduleCrackers();
  }

  function bootShow() {
    if (booted) return;
    booted = true;
    setTimeout(() => { if (active) launchRocket(); }, 320);
    setTimeout(() => { if (active) autoCracker(); }, 1050);
    setTimeout(() => { if (active) autoCracker(); }, 1880);
  }

  /* ---------------------------------------------------------------- wiring */
  const onResize = () => {
    syncNav();
    resize();
    if (parts.length || rockets.length || rings.length || emitters.length || spinners.length) kick();
  };
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("orientationchange", onResize, { passive: true });

  function onVisibility() {
    if (document.hidden) {
      stopEffects();
    } else {
      resize();
      startEffects();
      if (active) setTimeout(() => { if (active) autoCracker(); }, 550);
    }
  }
  document.addEventListener("visibilitychange", onVisibility);

  function onMotion(e) {
    reduced = e.matches;
    if (reduced) stopEffects();
    else startEffects();
  }
  if (motionQuery.addEventListener) motionQuery.addEventListener("change", onMotion);

  /* ---------------------------------------------------------------- expiry */
  function teardown() {
    stopEffects();
    clearTimeout(expiryTimer);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("orientationchange", onResize);
    document.removeEventListener("visibilitychange", onVisibility);
    if (motionQuery.removeEventListener) motionQuery.removeEventListener("change", onMotion);
    layer.remove();
    glow.remove();
    bokeh.remove();
    frameEl.remove();
    greeting.remove();
    style.remove();
    document.documentElement.style.removeProperty("--ed-nav");
    window.__echoDiwali = false;
  }
  const expiryTimer = setTimeout(teardown, Math.min(Math.max(0, EXPIRES_AT - Date.now()), 2147483647));

  /* ------------------------------------------------------------------ boot */
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount, { once: true });

  console.info("[Echo SMP] Diwali decorations active until 12 Nov 2026.");
})();
