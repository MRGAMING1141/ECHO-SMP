/* ==========================================================================
   ECHO SMP - temporary Diwali decoration layer (2026)
   --------------------------------------------------------------------------
   VISUAL ONLY. This file never reads or changes cart, checkout, payment QR,
   orders, sales log, delivered/delete buttons, Supabase or Firebase calls.
   It only appends a few pointer-events:none decorations to the page.

   INSTALL   : <script src="/diwali-theme.js" defer></script>   (one line)
   SWITCH OFF: set DIWALI_ENABLED = false below, or delete the script line.
   EXPIRY    : automatic at the end of 12 Nov 2026, 23:59 IST (Diwali = 8 Nov).

   Crackers fire automatically in the background. No buttons, no sounds.
   ========================================================================== */
(() => {
  "use strict";

  const DIWALI_ENABLED = true; // <-- ONE-LINE ON/OFF SWITCH
  const EXPIRES_AT = new Date("2026-11-12T23:59:59+05:30").getTime();

  if (!DIWALI_ENABLED) return;
  if (Date.now() > EXPIRES_AT) return;
  if (window.__echoDiwali) return; // never double-inject
  window.__echoDiwali = true;

  const GOLD = ["#ffe9a8", "#ffd37a", "#ffb347", "#ff9a3c", "#fff6d8"];
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = motionQuery.matches;

  /* --------------------------------------------------------------- styles */
  const style = document.createElement("style");
  style.id = "ed-styles";
  style.textContent = `
    #ed-diwali,#ed-diwali *{box-sizing:border-box}
    #ed-diwali{position:fixed;inset:0;z-index:3;pointer-events:none;overflow:hidden;contain:layout style paint}
    #ed-glow{position:fixed;inset:0;z-index:2;pointer-events:none;
      background:
        radial-gradient(130% 60% at 50% -10%,rgba(255,170,58,.22),rgba(255,170,58,0) 66%),
        radial-gradient(70% 46% at -8% 108%,rgba(255,122,36,.16),rgba(255,122,36,0) 72%),
        radial-gradient(70% 46% at 108% 108%,rgba(255,122,36,.16),rgba(255,122,36,0) 72%);
    }
    #ed-frame{position:fixed;inset:7px;z-index:3;pointer-events:none;border:1px solid rgba(255,196,100,.28);
      border-radius:18px;box-shadow:inset 0 0 0 1px rgba(255,140,40,.06),inset 0 0 80px rgba(255,150,50,.06)}
    #ed-diwali canvas{position:absolute;inset:0;display:block;width:100%;height:100%}

    /* string lights, hanging just under the sticky nav */
    .ed-garland{position:absolute;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + var(--ed-nav,58px));height:42px}
    .ed-wire{position:absolute;left:-2%;right:-2%;top:5px;height:18px;border-top:1.5px solid rgba(255,205,130,.42);border-radius:50%}
    .ed-bulb{position:absolute;display:block;width:8px;height:12px;margin-left:-4px;border-radius:50% 50% 46% 46%;
      background:#ffd37a;box-shadow:0 0 10px 3px rgba(255,168,60,.5),0 0 22px 8px rgba(255,140,40,.2);
      animation:ed-bulb 2.8s ease-in-out infinite alternate}
    .ed-bulb::before{content:"";position:absolute;left:2px;top:-4px;width:4px;height:5px;border-radius:1px;background:#c9a061}
    .ed-bulb:nth-child(4n+1){background:#ffb15c;box-shadow:0 0 10px 3px rgba(255,120,40,.46),0 0 22px 8px rgba(255,90,20,.18)}
    .ed-bulb:nth-child(4n+2){background:#ffe7a3}
    .ed-bulb:nth-child(4n+3){background:#ff8f5c}
    @keyframes ed-bulb{from{opacity:.62}to{opacity:1}}

    /* glowing diyas: top corners always, bottom corners on wide screens */
    .ed-diya{position:absolute;top:calc(env(safe-area-inset-top,0px) + var(--ed-nav,58px) + 22px);
      display:block;width:62px;height:40px;filter:drop-shadow(0 8px 16px rgba(255,140,40,.4))}
    .ed-diya.left{left:7px;transform-origin:top left}
    .ed-diya.right{right:7px;transform:scaleX(-1);transform-origin:top right}
    .ed-diya.bl,.ed-diya.br{display:none;top:auto;bottom:24px;transform:scale(.94)}
    .ed-diya.bl{left:8px;transform-origin:bottom left}
    .ed-diya.br{right:8px;transform:scaleX(-1) scale(.94);transform-origin:bottom right}
    @media(min-width:900px){.ed-diya.bl,.ed-diya.br{display:block}}
    .ed-bowl{position:absolute;left:3px;bottom:0;display:block;width:56px;height:22px;border-radius:6px 6px 28px 28px;
      background:linear-gradient(90deg,#6f2f13,#e08133 42%,#b0521f 70%,#7c3517);
      box-shadow:inset 0 -2px 0 rgba(255,214,140,.55),inset 0 3px 6px rgba(255,190,110,.24),0 4px 12px rgba(0,0,0,.35)}
    .ed-bowl::after{content:"";position:absolute;left:9px;right:9px;bottom:5px;height:4px;border-radius:50%;background:rgba(255,210,120,.5)}
    .ed-flame{position:absolute;left:25px;bottom:17px;display:block;width:13px;height:25px;
      border-radius:50% 50% 50% 50%/62% 62% 38% 38%;
      background:radial-gradient(ellipse at 50% 72%,#fffbe0 0%,#ffd166 38%,#ff8a2b 66%,rgba(255,90,10,0) 100%);
      box-shadow:0 0 18px 7px rgba(255,150,50,.44);transform-origin:50% 90%;
      animation:ed-flame 1.8s ease-in-out infinite alternate}
    @keyframes ed-flame{from{transform:scale(.94) rotate(-2.5deg)}to{transform:scale(1.06) rotate(2.5deg)}}

    /* greeting sign, hanging from the garland */
    #ed-greeting{position:fixed;z-index:3;left:50%;transform:translateX(-50%);
      top:calc(env(safe-area-inset-top,0px) + var(--ed-nav,58px) + 2px);max-width:calc(100vw - 20px);
      padding:7px 15px;border-radius:999px;border:1px solid rgba(255,205,110,.55);
      background:rgba(50,27,12,.92);color:#ffeec2;font:700 13px/1.2 Figtree,system-ui,-apple-system,sans-serif;
      letter-spacing:.25px;text-align:center;white-space:nowrap;pointer-events:none;
      box-shadow:0 8px 26px rgba(0,0,0,.34),0 0 26px rgba(255,150,40,.2),inset 0 1px 0 rgba(255,225,170,.25)}

    .ed-flash{position:absolute;transform:translate(-50%,-50%);border-radius:50%;pointer-events:none;
      background:radial-gradient(circle,rgba(255,224,150,.9),rgba(255,150,50,.32) 46%,rgba(255,120,30,0) 72%);
      opacity:.9;animation:ed-flash .5s ease-out forwards}
    @keyframes ed-flash{to{opacity:0;transform:translate(-50%,-50%) scale(1.18)}}

    @media (max-width:420px){
      #ed-greeting{font-size:11px;padding:6px 10px;letter-spacing:0}
      .ed-diya.left,.ed-diya.right{transform:scale(.84)}
      .ed-diya.right{transform:scaleX(-1) scale(.84)}
    }
    @media (prefers-reduced-motion:reduce){
      .ed-bulb,.ed-flame{animation:none}
      #ed-diwali canvas{display:none}
      .ed-flash{animation:none}
    }
  `;
  document.head.appendChild(style);

  /* ------------------------------------------------------------ structure */
  const glow = document.createElement("div");
  glow.id = "ed-glow";
  glow.setAttribute("aria-hidden", "true");

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

  const garland = document.createElement("div");
  garland.className = "ed-garland";
  garland.setAttribute("aria-hidden", "true");
  const wire = document.createElement("i");
  wire.className = "ed-wire";
  garland.appendChild(wire);
  for (let i = 0; i < 24; i++) {
    const bulb = document.createElement("i");
    bulb.className = "ed-bulb";
    const t = i / 23;
    bulb.style.left = (2 + t * 96) + "%";
    bulb.style.top = (5 + Math.sin(t * Math.PI) * 9) + "px";
    bulb.style.animationDelay = (Math.random() * 2.4).toFixed(2) + "s";
    bulb.style.animationDuration = (2.1 + Math.random() * 1.5).toFixed(2) + "s";
    garland.appendChild(bulb);
  }
  layer.appendChild(garland);

  [
    ["left", "top"],
    ["right", "top"],
    ["bl", "bottom"],
    ["br", "bottom"]
  ].forEach(([side]) => {
    const diya = document.createElement("div");
    diya.className = "ed-diya " + side;
    diya.setAttribute("aria-hidden", "true");
    diya.innerHTML = '<i class="ed-flame"></i><i class="ed-bowl"></i>';
    layer.appendChild(diya);
  });

  const greeting = document.createElement("div");
  greeting.id = "ed-greeting";
  greeting.textContent = "\u{1FA94} Happy Diwali from Echo SMP \u2728";

  const mount = () => {
    document.body.appendChild(glow);
    document.body.appendChild(frameEl);
    document.body.appendChild(layer);
    document.body.appendChild(greeting);
  };
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount, { once: true });

  /* --------------------------------------------------------------- layout */
  function syncNav() {
    const nav = document.querySelector("nav");
    const h = nav ? Math.round(nav.getBoundingClientRect().height) : 0;
    document.documentElement.style.setProperty("--ed-nav", (h > 20 && h < 180 ? h : 58) + "px");
  }

  let W = 0, H = 0;
  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    if (!c2d) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ------------------------------------------------------------- particles */
  const parts = [];
  const rockets = [];
  const rings = [];
  const emitters = [];
  const MAX_PARTS = 220;
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
    if (parts.length >= MAX_PARTS) return;
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
    const count = Math.min(o.count || 40, MAX_PARTS - parts.length);
    const palette = o.palette || GOLD;
    const power = o.power || 3.6;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = power * (0.35 + Math.random() * 0.95);
      spawn(
        x, y,
        Math.cos(a) * sp, Math.sin(a) * sp,
        46 + Math.random() * 46,
        1.1 + Math.random() * 1.7,
        palette[(Math.random() * palette.length) | 0],
        { trail: Math.random() < 0.32 }
      );
    }
    rings.push({ x: x, y: y, r: 6, life: 1, color: "rgba(255,210,130,.55)" });
    kick();
  }

  function spawnSparkle() {
    if (parts.length >= MAX_PARTS - 10 || !W || !H) return;
    const x = Math.random() * W;
    const life = 300 + Math.random() * 260;
    spawn(
      x, -12,
      (Math.random() - 0.5) * 0.55, 0.5 + Math.random() * 1.15,
      life, 1 + Math.random() * 1.5,
      GOLD[(Math.random() * GOLD.length) | 0],
      { grav: 0.002, drag: 1 }
    );
    kick();
  }

  function launchRocket(x) {
    if (!active || reduced || document.hidden) return;
    rockets.push({
      x: x != null ? x : W * (0.12 + Math.random() * 0.76),
      y: H + 12,
      vy: -(5.3 + Math.random() * 2.2),
      targetY: H * (0.14 + Math.random() * 0.34),
      trail: 0
    });
    kick();
  }

  function autoCracker() {
    if (!active || reduced || document.hidden) return;
    const r = Math.random();
    if (r < 0.58) {
      launchRocket();
    } else if (r < 0.82) {
      emitters.push({ x: W * (0.08 + Math.random() * 0.84), y: H * 0.84, life: 50 + Math.random() * 22 });
      kick();
    } else {
      burst(W * (0.15 + Math.random() * 0.7), H * (0.18 + Math.random() * 0.26), { count: 74, power: 5.3 });
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
        burst(r.x, r.y, { count: 48, power: 4.5 });
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
      const n = Math.max(1, Math.round(2 * k));
      for (let j = 0; j < n; j++) {
        spawn(
          e.x + (Math.random() - 0.5) * 8, e.y,
          (Math.random() - 0.5) * 2.4, -(2.3 + Math.random() * 3.1),
          30 + Math.random() * 26, 0.9 + Math.random() * 1.3,
          GOLD[(Math.random() * GOLD.length) | 0],
          { grav: 0.06, drag: 0.985 }
        );
      }
      e.life -= k;
      if (e.life <= 0) emitters.splice(i, 1);
    }
  }

  function draw() {
    if (!c2d) return;
    c2d.clearRect(0, 0, W, H);
    if (!parts.length && !rockets.length && !rings.length) return;
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
        c2d.arc(p.x, p.y, p.size * (0.45 + t * 0.55), 0, 6.2832);
        c2d.fill();
      }
    }

    for (let i = 0; i < rockets.length; i++) {
      const r = rockets[i];
      c2d.globalAlpha = 0.85;
      c2d.fillStyle = "#ffe6a8";
      c2d.beginPath();
      c2d.arc(r.x, r.y, 2, 0, 6.2832);
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
      c2d.globalAlpha = Math.max(0, r.life) * 0.5;
      c2d.strokeStyle = r.color;
      c2d.lineWidth = 1.6;
      c2d.beginPath();
      c2d.arc(r.x, r.y, r.r, 0, 6.2832);
      c2d.stroke();
    }

    c2d.globalAlpha = 1;
    c2d.globalCompositeOperation = "source-over";
  }

  function frame(now) {
    if (!running) return;
    const dt = lastT ? Math.min(50, now - lastT) : 16.7;
    lastT = now;
    update(dt / 16.667);
    draw();
    if (parts.length || rockets.length || rings.length || emitters.length) {
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

  function scheduleSparkles() {
    if (!active) return;
    sparkTimer = setTimeout(() => {
      if (!active) return;
      if (!document.hidden) spawnSparkle();
      scheduleSparkles();
    }, 560 + Math.random() * 520);
  }

  function scheduleCrackers() {
    if (!active) return;
    crackerTimer = setTimeout(() => {
      if (!active) return;
      autoCracker();
      scheduleCrackers();
    }, 2400 + Math.random() * 2600);
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
    clearCanvas();
  }

  function startEffects() {
    if (reduced || document.hidden) return;
    active = true;
    if (!sparkTimer) scheduleSparkles();
    if (!crackerTimer) scheduleCrackers();
  }

  /* ---------------------------------------------------------------- wiring */
  const onResize = () => {
    syncNav();
    resize();
    if (parts.length || rockets.length || rings.length || emitters.length) kick();
  };
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("orientationchange", onResize, { passive: true });

  function onVisibility() {
    if (document.hidden) stopEffects();
    else startEffects();
  }
  document.addEventListener("visibilitychange", onVisibility);

  if (motionQuery.addEventListener) {
    motionQuery.addEventListener("change", (e) => {
      reduced = e.matches;
      if (reduced) stopEffects();
      else startEffects();
    });
  }

  /* ------------------------------------------------------------------ boot */
  syncNav();
  resize();
  startEffects();

  // A couple of crackers right away so the theme is visible immediately.
  setTimeout(() => { if (active) launchRocket(); }, 350);
  setTimeout(() => { if (active) autoCracker(); }, 1500);

  /* ---------------------------------------------------------------- expiry */
  function teardown() {
    stopEffects();
    clearTimeout(expiryTimer);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("orientationchange", onResize);
    document.removeEventListener("visibilitychange", onVisibility);
    layer.remove();
    glow.remove();
    frameEl.remove();
    greeting.remove();
    style.remove();
    document.documentElement.style.removeProperty("--ed-nav");
    window.__echoDiwali = false;
  }
  const expiryTimer = setTimeout(teardown, Math.min(Math.max(0, EXPIRES_AT - Date.now()), 2147483647));

  console.info("[Echo SMP] Diwali decorations active until 12 Nov 2026.");
})();
