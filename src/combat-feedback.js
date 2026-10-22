// Pure presentation rules. A confirmed hit must never be confused with armor or a miss.
export function combatFeedback(dealt, { boss = false, weak = false } = {}) {
  if (!Number.isFinite(dealt) || dealt <= 0)
    return {
      type: 'blocked',
      label: boss ? 'SEM DANO · AJUSTE O ÂNGULO' : 'SEM DANO',
      color: '#ffb66b',
      duration: 0.3,
    };
  const amount = Math.max(1, Math.round(dealt));
  if (weak)
    return { type: 'weak', label: 'PONTO FRACO +' + amount, color: '#fff1a3', duration: 0.45 };
  return {
    type: boss ? 'boss' : 'hit',
    label: 'ACERTO +' + amount,
    color: boss ? '#aaffb9' : '#d7fff2',
    duration: 0.28,
  };
}
