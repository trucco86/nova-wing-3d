// Damage budget applies to all weapons, including bombs, and is measured in seconds.
export function createBossCombat(index = 0, burstSeconds = 0.3) {
  const max = 2100 + index * 260,
    rate = 50 + index * 4;
  let age = 0,
    budget = 0,
    chargeBudget = 0,
    specialBudget = 0,
    hp = max;
  return {
    max,
    update(dt) {
      age += dt;
      chargeBudget = Math.min(rate * 2, chargeBudget + dt * rate * 0.3);
      budget = Math.min(rate * burstSeconds, budget + dt * rate);
      // Independent, metered squad super budget. These attacks must not be
      // swallowed by ordinary rapid-fire spending in the same second.
      specialBudget = Math.min(rate * 1.35, specialBudget + dt * rate * 3.4);
    },
    spend(amount, charged = false) {
      if (age < 3 || !Number.isFinite(amount) || amount <= 0) return 0;
      if (charged) {
        const dealt = Math.min(amount, chargeBudget);
        chargeBudget -= dealt;
        return dealt;
      }
      const dealt = Math.min(amount, budget);
      budget -= dealt;
      return dealt;
    },
    spendSquadSpecial(amount) {
      if (age < 3 || !Number.isFinite(amount) || amount <= 0) return 0;
      const spent = Math.min(amount, specialBudget);
      specialBudget -= spent;
      return spent;
    },
    damage(amount) {
      hp = Math.max(0, hp - amount);
    },
    get hp() {
      return hp;
    },
    get age() {
      return age;
    },
    get phase() {
      return hp > max * 0.65 ? 1 : hp > max * 0.3 ? 2 : 3;
    },
    get coreOpen() {
      return age >= 3 && age % 7 < 5;
    },
  };
}
