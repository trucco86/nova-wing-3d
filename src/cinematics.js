// Captions, cutscene progression and timing are independent of rendering.
export const CINEMATICS = {
  intro: [
    { time: 0, speaker: 'NARRADOR', text: 'Em algum lugar entre as estrelas, a paz dos Five Cats foi interrompida.' },
    { time: 4, speaker: 'NARRADOR', text: 'Marvin roubou os suprimentos dos gatos e fugiu para o espaço profundo.' },
    { time: 8, speaker: 'BIA', text: 'Preparem as naves. Vamos recuperar tudo o que ele roubou.' },
    { time: 12, speaker: 'NARRADOR', text: 'A perseguição irá até a galáxia mais distante. Marvin não vai escapar.' },
  ],
  campaign: [
    { time: 0, speaker: 'BIA', text: 'Five Cats, todos a postos. Temos um rastro para seguir.' },
    { time: 4, speaker: 'CHRISTOPHER', text: 'Armas prontas. Vamos atrás dele.' },
    { time: 8, speaker: 'JENIFER', text: 'O sinal está se afastando. Vamos acelerar!' },
  ],
};
export function cinematicBeat(scenes, seconds) {
  const elapsed = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  return [...scenes].reverse().find((scene) => scene.time <= elapsed) ?? scenes[0];
}
export function cinematicDuration(scenes) {
  return (scenes.at(-1)?.time ?? 0) + 3;
}
