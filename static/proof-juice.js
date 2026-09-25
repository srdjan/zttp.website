// Proof juice: a particle burst when the playground verdict changes.
// PROVEN releases lime sparks, BLOCKED scatters rose shards and shakes the
// card. Progressive: without JS or under reduced motion nothing happens.
(function () {
  "use strict";

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const verdict = document.querySelector(".zp-verdict");
  const card = document.getElementById("zp-card");
  if (!verdict || !card) return;

  const canvas = document.createElement("canvas");
  canvas.className = "z-juice";
  canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);
  const ctx = canvas.getContext("2d", { alpha: true });

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener("resize", resize);
  resize();

  const css = getComputedStyle(document.documentElement);
  const token = (name) => css.getPropertyValue(name).trim();

  // Pooled particles: recycle the dead instead of allocating per spawn.
  const pool = [];
  const active = [];

  function spawn(x, y, vx, vy, life, color, size, gravity) {
    const p = pool.pop() || {};
    p.x = x;
    p.y = y;
    p.vx = vx;
    p.vy = vy;
    p.life = life;
    p.maxLife = life;
    p.color = color;
    p.size = size;
    p.gravity = gravity;
    active.push(p);
  }

  function burst(kind) {
    const r = verdict.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const proven = kind === "proven";
    const color = token(proven ? "--z-green" : "--z-red");
    const count = proven ? 46 : 22;
    for (let i = 0; i < count; i++) {
      const angle = proven
        ? Math.random() * Math.PI * 2
        : Math.PI + (Math.random() - 0.5) * 2.2;
      const speed = proven
        ? 90 + Math.random() * 260
        : 60 + Math.random() * 160;
      spawn(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - (proven ? 60 : 0),
        0.6 + Math.random() * (proven ? 0.7 : 0.4),
        color,
        proven ? 3 + Math.random() * 5 : 2 + Math.random() * 3,
        proven ? 120 : 380,
      );
    }
    start();
  }

  let running = false;
  let last = 0;

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }

  // Fixed timestep for the physics, one render per frame.
  const STEP = 1 / 120;
  let acc = 0;

  function frame(now) {
    acc += Math.min((now - last) / 1000, 0.1);
    last = now;
    while (acc >= STEP) {
      for (let i = active.length - 1; i >= 0; i--) {
        const p = active[i];
        p.life -= STEP;
        if (p.life <= 0) {
          active[i] = active[active.length - 1];
          active.pop();
          pool.push(p);
          continue;
        }
        p.vx *= 0.985;
        p.vy = p.vy * 0.985 + p.gravity * STEP;
        p.x += p.vx * STEP;
        p.y += p.vy * STEP;
      }
      acc -= STEP;
    }

    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of active) {
      const a = p.life / p.maxLife;
      ctx.globalAlpha = a;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.2);
      g.addColorStop(0, p.color);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    if (active.length) {
      requestAnimationFrame(frame);
    } else {
      running = false;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
    }
  }

  function replay(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  // Watch the verdict the playground renders. React only when it crosses
  // between PROVEN and BLOCKED: a break or a fix, not loading or typing noise.
  let decided = null;
  let lastFx = 0;
  new MutationObserver(() => {
    const next = verdict.textContent.trim();
    if (next !== "PROVEN" && next !== "BLOCKED") return;
    const first = decided === null;
    const changed = next !== decided;
    decided = next;
    if (first || !changed) return;
    const now = performance.now();
    if (now - lastFx < 500) return;
    lastFx = now;
    if (next === "PROVEN") {
      replay(verdict, "z-pop");
      burst("proven");
    } else if (next === "BLOCKED") {
      replay(card, "z-shake");
      burst("blocked");
    }
  }).observe(verdict, { childList: true, characterData: true, subtree: true });
})();
