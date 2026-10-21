export const SETTINGS_KEY = 'nova-wing-preferences-v1';
export const DEFAULT_SETTINGS = Object.freeze({
  language: 'pt',
  master: 0.85,
  music: 0.7,
  sfx: 0.75,
  sensitivity: 1,
  opacity: 0.9,
  subtitles: true,
  intro: true,
  vibration: false,
  leftHanded: false,
});
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export function readSettings(raw) {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const result = { ...DEFAULT_SETTINGS };
  if (['pt', 'en', 'es'].includes(source.language)) result.language = source.language;
  for (const key of ['master', 'music', 'sfx', 'sensitivity', 'opacity']) {
    if (typeof source[key] === 'number' && Number.isFinite(source[key]))
      result[key] = clamp(
        source[key],
        key === 'sensitivity' ? 0.6 : key === 'opacity' ? 0.4 : 0,
        key === 'sensitivity' ? 1.6 : 1,
      );
  }
  for (const key of ['subtitles', 'intro', 'vibration', 'leftHanded'])
    if (typeof source[key] === 'boolean') result[key] = source[key];
  return result;
}
export function loadSettings(storage) {
  try {
    return readSettings(JSON.parse(storage?.getItem(SETTINGS_KEY) ?? 'null'));
  } catch {
    return readSettings(null);
  }
}
export function storeSettings(storage, settings) {
  try {
    storage?.setItem(SETTINGS_KEY, JSON.stringify(readSettings(settings)));
    return !!storage;
  } catch {
    return false;
  }
}
export const UI_COPY = {
  pt: {
    play: 'INICIAR MISSÃO',
    continue: 'CONTINUAR CAMPANHA',
    options: 'OPÇÕES',
    close: 'FECHAR',
    pause: 'MISSÃO PAUSADA',
    resume: 'CONTINUAR',
    restart: 'REINICIAR FASE',
    exit: 'SAIR PARA O MENU',
    confirmRestart: 'Reiniciar a fase? O progresso obtido nesta fase será perdido.',
    confirmExit: 'Sair para o menu? O progresso obtido nesta fase será perdido.',
    cancel: 'CANCELAR',
    confirm: 'CONFIRMAR',
    audio: 'ÁUDIO',
    controls: 'CONTROLES',
    game: 'JOGO',
    master: 'VOLUME GERAL',
    music: 'MÚSICA',
    effects: 'EFEITOS',
    language: 'IDIOMA',
    sensitivity: 'SENSIBILIDADE',
    opacity: 'OPACIDADE DOS CONTROLES',
    subtitles: 'LEGENDAS',
    intro: 'ABERTURA AUTOMÁTICA',
    vibration: 'VIBRAÇÃO',
    leftHanded: 'CONTROLES PARA CANHOTOS',
    watch: 'VER ABERTURA',
    critical: 'INTEGRIDADE CRÍTICA · BUSQUE REPARO',
    life: 'ESCUDO',
    score: 'ACERTOS',
    audioBlocked: 'Áudio bloqueado pelo navegador. Toque novamente para ativar.',
    return: 'VOLTAR',
  },
  en: {
    play: 'START MISSION',
    continue: 'CONTINUE CAMPAIGN',
    options: 'SETTINGS',
    close: 'CLOSE',
    pause: 'MISSION PAUSED',
    resume: 'RESUME',
    restart: 'RESTART STAGE',
    exit: 'RETURN TO MENU',
    confirmRestart: 'Restart stage? Progress made during this stage will be lost.',
    confirmExit: 'Return to menu? Progress made during this stage will be lost.',
    cancel: 'CANCEL',
    confirm: 'CONFIRM',
    audio: 'AUDIO',
    controls: 'CONTROLS',
    game: 'GAME',
    master: 'MASTER VOLUME',
    music: 'MUSIC',
    effects: 'SOUND EFFECTS',
    language: 'LANGUAGE',
    sensitivity: 'SENSITIVITY',
    opacity: 'CONTROL OPACITY',
    subtitles: 'SUBTITLES',
    intro: 'AUTO PLAY INTRO',
    vibration: 'VIBRATION',
    leftHanded: 'LEFT-HANDED CONTROLS',
    watch: 'WATCH INTRO',
    critical: 'CRITICAL SHIELD · FIND REPAIR',
    life: 'SHIELD',
    score: 'HITS',
    audioBlocked: 'Audio blocked by browser. Tap again to activate.',
    return: 'BACK',
  },
  es: {
    play: 'INICIAR MISIÓN',
    continue: 'CONTINUAR CAMPAÑA',
    options: 'OPCIONES',
    close: 'CERRAR',
    pause: 'MISIÓN EN PAUSA',
    resume: 'CONTINUAR',
    restart: 'REINICIAR FASE',
    exit: 'VOLVER AL MENÚ',
    confirmRestart: '¿Reiniciar la fase? Se perderá el progreso de esta fase.',
    confirmExit: '¿Volver al menú? Se perderá el progreso de esta fase.',
    cancel: 'CANCELAR',
    confirm: 'CONFIRMAR',
    audio: 'AUDIO',
    controls: 'CONTROLES',
    game: 'JUEGO',
    master: 'VOLUMEN GENERAL',
    music: 'MÚSICA',
    effects: 'EFECTOS',
    language: 'IDIOMA',
    sensitivity: 'SENSIBILIDAD',
    opacity: 'OPACIDAD DE CONTROLES',
    subtitles: 'SUBTÍTULOS',
    intro: 'INTRO AUTOMÁTICA',
    vibration: 'VIBRACIÓN',
    leftHanded: 'CONTROLES PARA ZURDOS',
    watch: 'VER INTRO',
    critical: 'ESCUDO CRÍTICO · BUSCA REPARACIÓN',
    life: 'ESCUDO',
    score: 'ACIERTOS',
    audioBlocked: 'Audio bloqueado por el navegador. Toca de nuevo para activarlo.',
    return: 'VOLVER',
  },
};
export function uiText(language, key) {
  return (UI_COPY[language] ?? UI_COPY.pt)[key] ?? UI_COPY.pt[key] ?? key;
}
