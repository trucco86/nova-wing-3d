// Damage budget applies to all weapons, including bombs, and is measured in seconds.
export function createBossCombat(index = 0) {
  const max = 1400 + index * 170,
    rate = 50 + index * 4;
  let age = 0,
    budget = 0,
    hp = max;
  return {
    max,
    update(dt) {
      age += dt;
      budget = Math.min(rate * 0.3, budget + dt * rate);
    },
    spend(amount) {
      if (age < 3 || !Number.isFinite(amount) || amount <= 0) return 0;
      const dealt = Math.min(amount, budget);
      budget -= dealt;
      return dealt;
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
