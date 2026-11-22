// Scripted NPC encounter. No cloud model, external services or quest side effects.
// Dialogue is local and its last beat leads into the existing irreversible quest choice.
export const ORBIT9_SURVIVOR_DIALOGUE = Object.freeze([
  Object.freeze({
    speaker: 'SOBREVIVENTE',
    text: 'Os gatos chegaram... Achei que os corredores estivessem perdidos para sempre.',
  }),
  Object.freeze({
    speaker: 'SOBREVIVENTE',
    text: 'O mapa, a transmissão e a baliza confirmam a mesma coisa: alguém apagou a rota de propósito.',
  }),
  Object.freeze({
    speaker: 'SOBREVIVENTE',
    text: 'Restaurar a energia abre o acesso principal. A passagem clandestina evita os sensores, mas ninguém sabe o que está lá.',
  }),
]);
export function orbit9DialogueBeat(index) {
  if (!Number.isInteger(index) || index < 0) return null;
  return ORBIT9_SURVIVOR_DIALOGUE[index] ?? null;
}
export function orbit9NextDialogue(index) {
  if (!Number.isInteger(index) || index < 0) return 0;
  const next = index + 1;
  return next >= ORBIT9_SURVIVOR_DIALOGUE.length ? null : next;
}
