// One attention channel: survival and control instructions must beat chatter.
// All durations/cooldowns use mission-time (no timers or allocations per frame).
const URGENT =
  /NAVE PERDIDA|N[ÚU]CLEO DESTRU[ÍI]DO|REATOR INST[ÁA]VEL|EMERG[ÊE]NCIA|FUJA|FUGA|N[ÃA]O DEIXE|ALERTA|TURBUL[ÊE]NCIA|PERIGO/iu;
const ACTION =
  /SEGURE|SOLTE|DESVIE|EVITE|ENCONTRE|ATIRE|MOVA|ACELERE|COMPENSE|APONTE|ATIV[AE]|BUSQUE|AJUSTE|SUBA|DESC[AE]|ESCAPE|COLETE/iu;

export function radioMessagePriority(text) {
  const message = String(text ?? '');
  if (URGENT.test(message)) return 3;
  if (ACTION.test(message)) return 2;
  return 1;
}

export function compactRadioMessage(text, maxChars = 58) {
  const original = String(text ?? '')
    .replace(/\s+/gu, ' ')
    .trim();
  if (!Number.isInteger(maxChars) || maxChars < 20) throw new RangeError('Invalid HUD width');
  if (original.length <= maxChars) return original;
  const parts = original
    .split(/\s*[·/]\s*/u)
    .map((part) => part.trim())
    .filter(Boolean);
  // A radio portrait already identifies the pilot; omit redundant pilot names.
  if (parts.length > 1 && /^(?:BIA|BOB|CALVIN|CHRISTOPHER|JENIFER|FIVE CATS)$/iu.test(parts[0]))
    parts.shift();
  const imperative = parts.findLast((part) => ACTION.test(part));
  const selected = imperative
    ? [parts[0], imperative].filter((part, index, list) => index === 0 || part !== list[0])
    : parts.slice(0, 2);
  const sentence = selected.join(' · ') || original;
  if (sentence.length <= maxChars) return sentence;
  // Cut at a word boundary, never let a long subtitle grow over the reticle.
  const prefix = sentence.slice(0, maxChars - 1);
  const lastSpace = prefix.lastIndexOf(' ');
  return (lastSpace >= maxChars * 0.55 ? prefix.slice(0, lastSpace) : prefix).trimEnd() + '…';
}

export function createRadioTriage() {
  let until = -1;
  let lastRoutine = -Infinity;
  let currentPriority = 0;
  const recent = new Map();
  return Object.freeze({
    reset() {
      until = -1;
      lastRoutine = -Infinity;
      currentPriority = 0;
      recent.clear();
    },
    offer(text, now, { compact = true, force = false } = {}) {
      if (!Number.isFinite(now)) throw new RangeError('Invalid mission clock');
      const original = String(text ?? '').trim();
      if (!original) return null;
      const priority = radioMessagePriority(original);
      if (!force) {
        if ((recent.get(original) ?? -Infinity) + (priority === 3 ? 3 : 7) > now) return null;
        if (now < until && priority < currentPriority) return null;
        if (priority === 1 && now - lastRoutine < 4) return null;
      }
      if (recent.size > 48) {
        for (const [key, age] of recent) if (now - age > 12) recent.delete(key);
      }
      recent.set(original, now);
      if (priority === 1) lastRoutine = now;
      currentPriority = priority;
      const duration = priority === 3 ? 2.5 : priority === 2 ? 2.1 : 1.65;
      until = now + duration;
      return {
        text: compact ? compactRadioMessage(original) : original,
        full: original,
        priority,
        duration,
      };
    },
  });
}
