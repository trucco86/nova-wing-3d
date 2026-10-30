// Captions, cutscene progression and timing are independent of rendering.
export const CINEMATICS = {
  intro: [
    {
      time: 0,
      speaker: 'NARRADOR',
      text: 'Em algum lugar entre as estrelas, a paz dos Five Cats foi interrompida.',
    },
    {
      time: 4,
      speaker: 'NARRADOR',
      text: 'Marvin roubou os suprimentos dos gatos e fugiu para o espaço profundo.',
    },
    { time: 8, speaker: 'BIA', text: 'Five Cats em formação! Minha NOVA-7 lidera. Protejam os flancos.' },
    {
      time: 12,
      speaker: 'CALVINHO',
      text: 'Estou rastreando o sinal de Marvin. Ajustando a rota pela fenda espacial.',
    },
  ],
  campaign: [
    { time: 0, speaker: 'BIA', text: 'Cinco naves na mesma formação. Vamos recuperar nossos suprimentos!' },
    { time: 4, speaker: 'CHRISTOPHER', text: 'Canhão pesado e forma robô prontos. Eu cuido da linha de frente.' },
    { time: 6, speaker: 'BOB', text: 'Escudos preparados. Ninguém fica para trás!' },
    { time: 8, speaker: 'JENIFER', text: 'Alvo em fuga! Acelerem, Five Cats!' },
  ],
};
export function cinematicBeat(scenes, seconds) {
  const elapsed = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  return [...scenes].reverse().find((scene) => scene.time <= elapsed) ?? scenes[0];
}
export function cinematicDuration(scenes) {
  return (scenes.at(-1)?.time ?? 0) + 3;
}
