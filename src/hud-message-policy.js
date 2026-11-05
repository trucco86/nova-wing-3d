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
  let lastInstruction = -Infinity;
  let currentPriority = 0;
  const recent = new Map();
  return Object.freeze({
    reset() {
      until = -1;
      lastRoutine = -Infinity;
      lastInstruction = -Infinity;
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
        if (priority === 1 && now - lastRoutine < 7.5) return null;
        if (priority === 2 && now - lastInstruction < 3) return null;
      }
      if (recent.size > 48) {
        for (const [key, age] of recent) if (now - age > 12) recent.delete(key);
      }
      recent.set(original, now);
      if (priority === 1) lastRoutine = now;
      if (priority === 2) lastInstruction = now;
      currentPriority = priority;
      const duration = priority === 3 ? 2.25 : priority === 2 ? 1.65 : 1.3;
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


const BOSS_NAMES = /^(?:ROK|STINGRAY|CARBIDE|DEVASTADOR|PHOENIX|COLOSSUS|HIDRA|HYDRA|ÔMEGA|OMEGA|ÓRION|ORION|MARVIN)\s*$/iu;
const ATTACK_VERBS = [
  [/SUBA|MUDE DE ALTURA|TROQUE DE ALTURA/iu, 'SUBA'],
  [/AFASTE-SE|SAIA DO CENTRO/iu, 'AFASTE-SE'],
  [/SAIA DA FAIXA|SAIA DA LINHA|DESVIE DO EIXO/iu, 'SAIA DO EIXO'],
  [/ESQUIVE|DESVIE|FUJA/iu, 'DESVIE'],
  [/ORBIT|FLANCO|COSTAS/iu, 'ORBITE'],
  [/DEFENDA|ESCUDO|PROTEJA/iu, 'DEFENDA'],
  [/MUDE DE POSIÇÃO/iu, 'MUDE DE POSIÇÃO'],
];

function shortLabel(text, maxChars) {
  const value = String(text ?? '').replace(/\s+/gu, ' ').trim();
  if (value.length <= maxChars) return value;
  const cut = value.slice(0, maxChars - 1);
  const word = cut.lastIndexOf(' ');
  return (word > maxChars * 0.6 ? cut.slice(0, word) : cut).trimEnd() + '…';
}

// Do not paraphrase danger into an untrue "safe" hint: the radar already
// displays the live green sector. Retain the attack's distinct physical name
// and one defensive verb while the dangerous windup is active.
export function compactBossAttackWarning(label, { threatened = true } = {}) {
  if (!label || !threatened) return '';
  const parts = String(label)
    .split(/\s*[·/]\s*/u)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length > 1 && BOSS_NAMES.test(parts[0])) parts.shift();
  const attack = shortLabel(parts[0] ?? label, 24);
  const commandText = parts.slice(1).join(' ');
  const instruction = ATTACK_VERBS.find(([re]) => re.test(commandText))?.[1] ?? 'DESVIE';
  return shortLabel('⚠ ' + attack + ' · ' + instruction, 39);
}

// Boss-state cards should report only a player decision. The full status is
// kept on aria-label/title and in tactical screens rather than piling lines
// over the boss's weapon muzzles.
export function compactBossState(full, maxChars = 36) {
  if (!Number.isInteger(maxChars) || maxChars < 15)
    throw new RangeError('Invalid boss HUD width');
  const original = String(full ?? '').trim();
  if (!original) return '';
  let decision;
  if (/DESATIVE/iu.test(original)) {
    decision = original.replace(/^DESATIVE\s+/iu, 'DESATIVE ').replace(/\s*·.*$/u, '');
  } else if (/REATOR|N[ÚU]CLEO EXPOSTO|ALVO VULNER[ÁA]VEL.*N[ÚU]CLEO/iu.test(original)) {
    decision = 'NÚCLEO EXPOSTO';
  } else if (/BATERIA ESQ\./iu.test(original)) {
    decision = 'BATERIA ESQ. · FRACA';
  } else if (/BATERIA DIR\./iu.test(original)) {
    decision = 'BATERIA DIR. · FRACA';
  } else if (/BLINDAGEM|BLINDADAS/iu.test(original)) {
    decision = /FRENTE/iu.test(original) ? 'BLINDAGEM · FRENTE' : 'BLINDAGEM · ORBITE';
  } else if (/ORBITE PARA A FRENTE/iu.test(original)) {
    decision = 'ORBITE À FRENTE';
  } else if (/APROXIMA[ÇC][ÃA]O/iu.test(original)) {
    decision = 'APROXIMAÇÃO';
  } else {
    decision = original.replace(/ÚLTIMA RESIST[ÊE]NCIA DE MARVIN\s*·\s*/iu, 'MARVIN · ');
  }
  const elemental = original.match(/FRACO:\s*([^·]+)/iu)?.[1]?.trim();
  const withElement = elemental ? decision + ' · ' + elemental : decision;
  return shortLabel(withElement, maxChars);
}
