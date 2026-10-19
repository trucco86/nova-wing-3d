export function aimOrbit(game) {
  const s = game.snapshot();
  if (!s.arena) return;
  const point = s.bossTargets.find((p) => p.hp > 0);
  const raw = (point?.angle ?? s.coreAngle ?? 0) - s.strategy.orbitAngle;
  const delta = Math.atan2(Math.sin(raw), Math.cos(raw));
  game.orbit(Math.abs(delta) < 0.04 ? 0 : Math.sign(delta));
}
// Drive real combat time; no state mutation or bypass of the armor damage budget.
export function defeatBoss(h, { untilHp = 0, stopAtCollapse = false } = {}) {
  for (let i = 0; i < 2400 && h.game.snapshot().boss; i++) {
    const s = h.game.snapshot();
    if (s.state === 'collapsing') {
      if (stopAtCollapse) break;
      h.advance(8.1, 0.1);
      break;
    }
    if (s.bossParts === 0 && s.bossHp <= untilHp) break;
    // This helper tests campaign transitions, supplying health while real attack timing runs.
    if (i % 10 === 0 && s.shield < 40) h.game.collect('shield');
    aimOrbit(h.game);
    h.game.roll();
    h.advance(0.1, 0.1);
    h.game.damageBoss(10000);
  }
}
