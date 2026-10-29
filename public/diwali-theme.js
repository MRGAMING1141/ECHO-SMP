/* ==========================================================================
   ECHO SMP - temporary Diwali decoration layer (2026)
   --------------------------------------------------------------------------
   VISUAL ONLY. This file never reads or changes cart, checkout, payment QR,
   orders, sales log, delivered/delete buttons, Supabase or Firebase calls.
   It only appends a few pointer-events:none decorations to the page.

   INSTALL   : <script src="/diwali-theme.js" defer></script>   (one line)
   SWITCH OFF: set DIWALI_ENABLED = false below, or delete the script line.
   EXPIRY    : automatic at the end of 12 Nov 2026, 23:59 IST (Diwali = 8 Nov).
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
        radial-gradient(120% 52% at 50% -8%,rgba(255,168,58,.16),rgba(255,168,58,0) 64%),
        radial-gradient(66% 42% at -6% 106%,rgba(255,122,36,.13),rgba(255,122,36,0) 70%),
        radial-gradient(66% 42% at 106% 106%,rgba(255,122,36,.13),rgba(255,122,36,0) 70%);
    }
    #ed-diwali canvas{position:absolute;inset:0;display:block;width:100%;height:100%}

    /* string lights, hanging just under the sticky nav */
    .ed-garland{position:absolute;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + var(--ed-nav,58px));height:38px}
    .ed-wire{position:absolute;left:-2%;right:-2%;top:5px;height:16px;border-top:1.5px solid rgba(255,205,130,.38);border-radius:50%}
    .ed-bulb{position:absolute;display:block;width:7px;height:11px;margin-left:-3.5px;border-radius:50% 50% 46% 46%;
      background:#ffd37a;box-shadow:0 0 9px 3px rgba(255,168,60,.42),0 0 18px 6px rgba(255,140,40,.16);
      animation:ed-bulb 2.8s ease-in-out infinite alternate}
    .ed-bulb::before{content:"";position:absolute;left:2px;top:-4px;width:3px;height:5px;border-radius:1px;background:#c9a061}
    .ed-bulb:nth-child(4n+1){background:#ffb15c;box-shadow:0 0 9px 3px rgba(255,120,40,.4),0 0 18px 6px rgba(255,90,20,.15)}
    .ed-bulb:nth-child(4n+2){background:#ffe7a3}
    .ed-bulb:nth-child(4n+3){background:#ff8f5c}
    @keyframes ed-bulb{from{opacity:.62}to{opacity:1}}

    /* glowing diyas in the top corners */
    .ed-diya{position:absolute;top:calc(env(safe-area-inset-top,0px) + var(--ed-nav,58px) + 20px);
      display:block;width:58px;height:36px;filter:drop-shadow(0 6px 14px rgba(255,140,40,.32))}
    .ed-diya.left{left:6px;transform-origin:top left}
    .ed-diya.right{right:6px;transform:scaleX(-1);transform-origin:top right}
    .ed-bowl{position:absolute;left:3px;bottom:0;display:block;width:52px;height:21px;border-radius:6px 6px 26px 26px;
      background:linear-gradient(90deg,#6f2f13,#d97a30 42%,#b0521f 70%,#7c3517);
      box-shadow:inset 0 -2px 0 rgba(255,214,140,.5),inset 0 3px 6px rgba(255,190,110,.22),0 3px 10px rgba(0,0,0,.32)}
    .ed-bowl::after{content:"";position:absolute;left:9px;right:9px;bottom:5px;height:4px;border-radius:50%;background:rgba(255,210,120,.45)}
    .ed-flame{position:absolute;left:23px;bottom:16px;display:block;width:12px;height:23px;
      border-radius:50% 50% 50% 50%/62% 62% 38% 38%;
      background:radial-gradient(ellipse at 50% 72%,#fffbe0 0%,#ffd166 38%,#ff8a2b 66%,rgba(255,90,10,0) 100%);
      box-shadow:0 0 16px 6px rgba(255,150,50,.38);transform-origin:50% 90%;
      animation:ed-flame 1.8s ease-in-out infinite alternate}
    @keyframes ed-flame{from{transform:scale(.94) rotate(-2.5deg)}to{transform:scale(1.06) rotate(2.5deg)}}

    /* small greeting sign, hanging from the garland */
    #ed-greeting{position:fixed;z-index:3;left:50%;transform:translateX(-50%);
      top:calc(env(safe-area-inset-top,0px) + var(--ed-nav,58px) + 4px);max-width:calc(100vw - 20px);
      padding:6px 12px;border-radius:999px;border:1px solid rgba(255,196,100,.4);
      background:rgba(36,22,12,.87);color:#ffe4ae;font:600 12px/1.2 Figtree,system-ui,-apple-system,sans-serif;
      letter-spacing:.2px;text-align:center;white-space:nowrap;pointer-events:none;
      box-shadow:0 6px 20px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,220,160,.18)}

    /* cracker control: the only clickable piece, sits above the music dock */
    #ed-action{position:fixed;left:12px;bottom:calc(172px + env(safe-area-inset-bottom,0px));z-index:7;pointer-events:none}
    #ed-toggle{pointer-events:auto;display:inline-flex;align-items:center;gap:6px;padding:9px 13px;border-radius:999px;
      border:1px solid rgba(255,196,100,.55);background:rgba(44,26,15,.94);color:#ffe7b8;
      font:700 12px/1 Figtree,system-ui,-apple-system,sans-serif;cursor:pointer;
      box-shadow:0 6px 20px rgba(0,0,0,.3),inset 0 1px 0 rgba(255,215,150,.2);
      -webkit-tap-highlight-color:transparent;transition:transform .14s ease,background .18s ease}
    #ed-toggle:hover{background:rgba(66,40,22,.96)}
    #ed-toggle:active{transform:scale(.96)}
    #ed-toggle:focus-visible{outline:2px solid #ffd37a;outline-offset:2px}
    #ed-menu{position:absolute;left:0;bottom:calc(100% + 8px);display:none;flex-direction:column;gap:6px;padding:8px;
      border-radius:14px;border:1px solid rgba(255,196,100,.4);background:rgba(34,21,13,.97);
      box-shadow:0 14px 34px rgba(0,0,0,.42);pointer-events:auto}
    #ed-action.open #ed-menu{display:flex}
    .ed-cracker{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:10px;cursor:pointer;
      border:1px solid rgba(255,196,100,.24);background:rgba(255,180,70,.09);color:#ffe7b8;
      font:600 12px/1.1 Figtree,system-ui,-apple-system,sans-serif;text-align:left;white-space:nowrap;
      -webkit-tap-highlight-color:transparent;transition:background .14s ease,transform .14s ease}
    .ed-cracker:hover{background:rgba(255,180,70,.2)}
    .ed-cracker:active{transform:scale(.97)}
    .ed-cracker:focus-visible{outline:2px solid #ffd37a;outline-offset:1px}
    .ed-cracker small{color:rgba(255,231,184,.6);font-weight:500}

    .ed-flash{position:absolute;transform:translate(-50%,-50%);border-radius:50%;pointer-events:none;
      background:radial-gradient(circle,rgba(255,224,150,.9),rgba(255,150,50,.32) 46%,rgba(255,120,30,0) 72%);
      opacity:.9;animation:ed-flash .5s ease-out forwards}
    @keyframes ed-flash{to{opacity:0;transform:translate(-50%,-50%) scale(1.18)}}

    @media (max-width:420px){
      #ed-greeting{font-size:10.5px;padding:5px 9px;letter-spacing:0}
      .ed-diya{transform:scale(.82)}
      .ed-diya.right{transform:scaleX(-1) scale(.82)}
      #ed-toggle{padding:8px 11px;font-size:11px}
      #ed-action{left:10px;bottom:calc(150px + env(safe-area-inset-bottom,0px))}
    }
    @media (prefers-reduced-motion:reduce){
      .ed-bulb,.ed-flame{animation:none}
      #ed-diwali canvas{display:none}
      .ed-flash{animation:none}
      #ed-toggle{transition:none}
    }
  `;
  document.head.appendChild(style);

  /* ------------------------------------------------------------ structure */
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
  for (let i = 0; i < 18; i++) {
    const bulb = document.createElement("i");
    bulb.className = "ed-bulb";
    const t = i / 17;
    bulb.style.left = (2 + t * 96) + "%";
    bulb.style.top = (5 + Math.sin(t * Math.PI) * 8) + "px";
    bulb.style.animationDelay = (Math.random() * 2.4).toFixed(2) + "s";
    bulb.style.animationDuration = (2.1 + Math.random() * 1.5).toFixed(2) + "s";
    garland.appendChild(bulb);
  }
  layer.appendChild(garland);

  ["left", "right"].forEach((side) => {
    const diya = document.createElement("div");
    diya.className = "ed-diya " + side;
    diya.setAttribute("aria-hidden", "true");
    diya.innerHTML = '<i class="ed-flame"></i><i class="ed-bowl"></i>';
    layer.appendChild(diya);
  });

  const glow = document.createElement("div");
  glow.id = "ed-glow";
  glow.setAttribute("aria-hidden", "true");

  const greeting = document.createElement("div");
  greeting.id = "ed-greeting";
  greeting.textContent = "\u{1FA94} Happy Diwali from Echo SMP \u2728";

  const action = document.createElement("div");
  action.id = "ed-action";
  const toggle = document.createElement("button");
  toggle.id = "ed-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "ed-menu");
  toggle.setAttribute("aria-label", "Light a virtual Diwali cracker");
  toggle.innerHTML = '<span aria-hidden="true">\u{1F386}</span><span>Light a cracker</span>';

  const menu = document.createElement("div");
  menu.id = "ed-menu";
  menu.setAttribute("aria-label", "Choose a cracker");
  [
    ["rocket", "\u{1F680}", "Rocket", "whistles up, then pops"],
    ["anar", "\u{1F387}", "Anar", "sparkling fountain"],
    ["bomb", "\u{1F4A3}", "Bomb", "big boom"]
  ].forEach(([kind, icon, label, hint]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ed-cracker";
    b.dataset.cracker = kind;
    b.innerHTML = '<span aria-hidden="true">' + icon + "</span><span>" + label + " <small>" + hint + "</small></span>";
    menu.appendChild(b);
  });
  action.appendChild(menu);
  action.appendChild(toggle);

  const mount = () => {
    document.body.appendChild(glow);
    document.body.appendChild(layer);
    document.body.appendChild(greeting);
    document.body.appendChild(action);
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
  const MAX_PARTS = 190;
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
        { trail: Math.random() < 0.3 }
      );
    }
    rings.push({ x: x, y: y, r: 6, life: 1, color: "rgba(255,210,130,.55)" });
    kick();
  }

  function spawnSparkle() {
    if (parts.length >= MAX_PARTS - 8 || !W || !H) return;
    const x = Math.random() * W;
    const life = 280 + Math.random() * 220;
    spawn(
      x, -12,
      (Math.random() - 0.5) * 0.5, 0.45 + Math.random() * 1.05,
      life, 0.9 + Math.random() * 1.4,
      GOLD[(Math.random() * GOLD.length) | 0],
      { grav: 0.002, drag: 1 }
    );
    kick();
  }

  function launchAuto() {
    if (reduced || document.hidden) return;
    rockets.push({
      x: W * (0.14 + Math.random() * 0.72),
      y: H + 12,
      vy: -(5.4 + Math.random() * 2.1),
      targetY: H * (0.16 + Math.random() * 0.3),
      trail: 0
    });
    kick();
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
        burst(r.x, r.y, { count: 44, power: 4.4 });
        rockets.splice(i, 1);
        if (typeof r.onPop === "function") r.onPop();
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
  let fireTimer = 0;
  let active = false;

  function scheduleSparkles() {
    if (!active) return;
    sparkTimer = setTimeout(() => {
      if (!active) return;
      if (!document.hidden) spawnSparkle();
      scheduleSparkles();
    }, 720 + Math.random() * 700);
  }

  function scheduleFireworks() {
    if (!active) return;
    fireTimer = setTimeout(() => {
      if (!active) return;
      launchAuto();
      scheduleFireworks();
    }, 6500 + Math.random() * 4500);
  }

  function clearCanvas() {
    if (c2d) c2d.clearRect(0, 0, W, H);
  }

  function stopEffects() {
    active = false;
    clearTimeout(sparkTimer);
    clearTimeout(fireTimer);
    sparkTimer = fireTimer = 0;
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
    if (!fireTimer) scheduleFireworks();
  }

  /* ----------------------------------------------------------------- audio */
  let actx = null;
  let noiseBuf = null;

  function audio() {
    if (actx) {
      if (actx.state === "suspended") actx.resume().catch(() => {});
      return actx;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      actx = new AC();
    } catch (_) {
      return null;
    }
    const len = Math.floor(actx.sampleRate * 1.1);
    noiseBuf = actx.createBuffer(1, len, actx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return actx;
  }

  function noise(c, at, dur, gain, type, freq) {
    if (!noiseBuf) return;
    const src = c.createBufferSource();
    const f = c.createBiquadFilter();
    const g = c.createGain();
    src.buffer = noiseBuf;
    f.type = type;
    f.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(f);
    f.connect(g);
    g.connect(c.destination);
    src.start(at);
    src.stop(at + dur + 0.03);
  }

  function tone(c, at, type, from, to, dur, gain) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(from, at);
    if (to) o.frequency.exponentialRampToValueAtTime(to, at + dur);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(at);
    o.stop(at + dur + 0.03);
  }

  function playCracker(kind) {
    const c = audio();
    if (!c || document.hidden) return;
    const t = c.currentTime + 0.01;
    if (kind === "rocket") {
      tone(c, t, "sine", 620, 1650, 0.6, 0.032);
    } else if (kind === "anar") {
      noise(c, t, 0.85, 0.05, "bandpass", 2400);
      for (let i = 0; i < 6; i++) noise(c, t + 0.08 + i * 0.12, 0.05, 0.055, "highpass", 2600);
      tone(c, t, "triangle", 300, 130, 0.28, 0.025);
    } else {
      tone(c, t, "sine", 130, 42, 0.5, 0.15);
      noise(c, t, 0.55, 0.11, "lowpass", 620);
      for (let i = 0; i < 4; i++) noise(c, t + 0.1 + i * 0.07, 0.05, 0.045, "highpass", 1800);
    }
  }

  function playPop() {
    const c = audio();
    if (!c || document.hidden) return;
    const t = c.currentTime + 0.01;
    noise(c, t, 0.3, 0.1, "highpass", 900);
    tone(c, t, "sine", 180, 55, 0.3, 0.07);
    for (let i = 0; i < 3; i++) noise(c, t + 0.04 + i * 0.05, 0.06, 0.045, "bandpass", 2200);
  }

  /* --------------------------------------------------------------- actions */
  function flash(x, y, size) {
    const d = document.createElement("i");
    d.className = "ed-flash";
    d.style.left = x + "px";
    d.style.top = y + "px";
    d.style.width = d.style.height = size + "px";
    layer.appendChild(d);
    setTimeout(() => d.remove(), 540);
  }

  function fire(kind) {
    const r = toggle.getBoundingClientRect();
    const x = Math.min(W - 40, Math.max(40, r.left + r.width / 2));
    const y = Math.max(80, r.top - 8);
    playCracker(kind);

    if (reduced) {
      if (kind === "bomb") flash(W / 2, H * 0.42, 280);
      else flash(x, Math.max(60, y - 40), 150);
      return;
    }

    if (kind === "rocket") {
      rockets.push({
        x: x,
        y: y,
        vy: -(7 + Math.random() * 1.4),
        targetY: H * (0.18 + Math.random() * 0.18),
        trail: 0,
        onPop: playPop
      });
      kick();
    } else if (kind === "anar") {
      emitters.push({ x: x, y: y, life: 54 });
      kick();
    } else {
      burst(W / 2, H * 0.4, { count: 92, power: 6.2 });
      setTimeout(playPop, 30);
    }
  }

  let outsideBound = false;
  function onOutside(e) {
    if (!action.contains(e.target)) closeMenu(false);
  }
  function openMenu() {
    action.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
    if (!outsideBound) {
      outsideBound = true;
      setTimeout(() => document.addEventListener("click", onOutside, true), 0);
    }
  }
  function closeMenu(focus) {
    if (!action.classList.contains("open")) return;
    action.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    if (outsideBound) {
      outsideBound = false;
      document.removeEventListener("click", onOutside, true);
    }
    if (focus) toggle.focus();
  }

  action.addEventListener("click", (e) => {
    const picked = e.target.closest("[data-cracker]");
    if (picked) {
      fire(picked.dataset.cracker);
      closeMenu(true);
      return;
    }
    if (e.target.closest("#ed-toggle")) {
      if (action.classList.contains("open")) closeMenu(false);
      else openMenu();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu(true);
  });

  /* ---------------------------------------------------------------- wiring */
  const onResize = () => {
    syncNav();
    resize();
    if (parts.length || rockets.length || rings.length) kick();
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

  /* ---------------------------------------------------------------- expiry */
  function teardown() {
    stopEffects();
    clearTimeout(expiryTimer);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("orientationchange", onResize);
    document.removeEventListener("visibilitychange", onVisibility);
    try {
      if (actx && actx.close) actx.close();
    } catch (_) {}
    layer.remove();
    glow.remove();
    greeting.remove();
    action.remove();
    style.remove();
    document.documentElement.style.removeProperty("--ed-nav");
    window.__echoDiwali = false;
  }
  const expiryTimer = setTimeout(teardown, Math.min(Math.max(0, EXPIRES_AT - Date.now()), 2147483647));

  /* ----------------------------------------------------------------- start */
  syncNav();
  resize();
  startEffects();
  console.info("[Echo SMP] Diwali decorations active until 12 Nov 2026.");
})();
