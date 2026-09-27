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
    h.game.roll();
    h.advance(0.1, 0.1);
    h.game.damageBoss(10000);
  }
}
