// Small deterministic bonus game. Positions use a 1000 x 500 virtual playfield.
export function createArcade(seed = 1) {
  let time = 0,
    cooldown = 0,
    spawn = 0,
    hits = 0,
    credits = 0,
    impacts = 0,
    immunity = 0;
  const player = { x: 170, y: 250 };
  let targets = [],
    shots = [];
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  return {
    update(dt, input) {
      if (time >= 18) return;
      dt = Math.min(dt, 18 - time);
      time += dt;
      cooldown -= dt;
      spawn -= dt;
      immunity -= dt;
      player.x = Math.max(45, Math.min(430, player.x + input.x * dt * 310));
      player.y = Math.max(65, Math.min(435, player.y - input.y * dt * 310));
      if (input.fire && cooldown <= 0) {
        shots.push({ x: player.x + 25, y: player.y });
        cooldown = 0.16;
      }
      if (spawn <= 0) {
        targets.push({ x: 1040, y: 75 + rand() * 350, coin: rand() > 0.65 });
        spawn = 0.48;
      }
      for (const s of shots) {
        const from = s.x;
        s.x += dt * 780;
        for (const t of targets) {
          if (
            !t.dead &&
            !t.coin &&
            Math.abs(t.y - s.y) < 24 &&
            t.x >= from - 20 &&
            t.x <= s.x + 20
          ) {
            t.dead = s.dead = true;
            hits++;
            credits += 8;
            break;
          }
        }
      }
      for (const t of targets) {
        const from = t.x;
        t.x -= dt * 240;
        if (
          !t.dead &&
          Math.abs(t.y - player.y) < 30 &&
          player.x >= t.x - 30 &&
          player.x <= from + 30
        ) {
          t.dead = true;
          if (t.coin) credits += 15;
          else if (immunity <= 0) {
            impacts++;
            credits = Math.max(0, credits - 10);
            immunity = 0.8;
          }
        }
      }
      targets = targets.filter((t) => !t.dead && t.x > -50);
      shots = shots.filter((s) => !s.dead && s.x < 1060);
    },
    snapshot: () => ({
      time,
      done: time >= 18,
      hits,
      credits,
      impacts,
      player: { ...player },
      targets: targets.map((t) => ({ ...t })),
      shots: shots.map((s) => ({ ...s })),
    }),
  };
}
export function drawArcade(canvas, data, color) {
  const ctx = canvas.getContext?.('2d');
  if (!ctx) return;
  const w = canvas.clientWidth || 1000,
    h = canvas.clientHeight || 500;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  ctx.fillStyle = '#030917';
  ctx.fillRect(0, 0, w, h);
  const scale = Math.min(w / 1000, h / 500);
  ctx.save();
  ctx.translate((w - 1000 * scale) / 2, (h - 500 * scale) / 2);
  ctx.scale(scale, scale);
  for (let i = 0; i < 90; i++) {
    const x = (((i * 137 - data.time * (50 + (i % 3) * 40)) % 1000) + 1000) % 1000;
    ctx.fillStyle = i % 3 ? '#466482' : '#c9efff';
    ctx.fillRect(x, (i * 71) % 500, (i % 3) + 1, 1.5);
  }
  ctx.strokeStyle = '#1d496b';
  ctx.lineWidth = 2;
  for (const y of [35, 465]) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1000, y);
    ctx.stroke();
  }
  for (const t of data.targets) {
    ctx.fillStyle = t.coin ? '#ffce68' : '#f65e94';
    ctx.beginPath();
    if (t.coin) ctx.arc(t.x, t.y, 12, 0, Math.PI * 2);
    else {
      ctx.moveTo(t.x - 20, t.y);
      ctx.lineTo(t.x + 16, t.y - 18);
      ctx.lineTo(t.x + 10, t.y);
      ctx.lineTo(t.x + 16, t.y + 18);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#85ffea';
  for (const s of data.shots) ctx.fillRect(s.x, s.y - 2, 24, 4);
  const p = data.player;
  ctx.fillStyle = '#60dfff';
  ctx.beginPath();
  ctx.moveTo(p.x - 18, p.y - 7);
  ctx.lineTo(p.x - 43 - Math.sin(data.time * 40) * 8, p.y);
  ctx.lineTo(p.x - 18, p.y + 7);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(p.x + 28, p.y);
  ctx.lineTo(p.x - 23, p.y - 19);
  ctx.lineTo(p.x - 13, p.y);
  ctx.lineTo(p.x - 23, p.y + 19);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#b9f5ff';
  ctx.fillRect(p.x - 2, p.y - 3, 12, 6);
  ctx.restore();
}
