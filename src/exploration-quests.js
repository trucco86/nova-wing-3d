// Five Cats Universe: first exploration domain model. No renderer or browser API.
// Intentionally not connected to the current rail shooter until a playable
// exploration vertical slice and migration policy are approved.
export const EXPLORATION_SAVE_KEY = 'nova-wing-3d-exploration-v1';
export const EXPLORATION_SCHEMA = 1;

export const GALAXY_GRAPH = Object.freeze([
  Object.freeze({ id: 'five-cats-base', name: 'Nave-mãe Five Cats', kind: 'hub', unlock: 'always' }),
  Object.freeze({ id: 'orbit-9-ruins', name: 'Ruínas de Órbita-9', kind: 'exploration', unlock: 'always' }),
  Object.freeze({ id: 'orion-ghost-route', name: 'Rota Fantasma de Órion', kind: 'combat', unlock: 'three-clues-and-npc' }),
  Object.freeze({ id: 'hidden-planet', name: 'Planeta dos Arquivos', kind: 'planet', unlock: 'completed-orion-mission' }),
]);

export const ORBIT9_EVIDENCE = Object.freeze([
  Object.freeze({ id: 'transmission-a', label: 'Transmissão de socorro', detail: 'Uma frequência de fuga codificada' }),
  Object.freeze({ id: 'reactor-map', label: 'Mapa do reator', detail: 'Coordenadas do corredor oculto' }),
  Object.freeze({ id: 'broken-beacon', label: 'Baliza danificada', detail: 'A chave de ativação de uma rota' }),
]);
export const ORBIT9_CHOICES = Object.freeze(['restore-power', 'hidden-route']);
const clueIds = new Set(ORBIT9_EVIDENCE.map(({ id }) => id));
const routeIds = new Set(GALAXY_GRAPH.map(({ id }) => id));
const choiceIds = new Set(ORBIT9_CHOICES);

const fresh = () => ({
  version: EXPLORATION_SCHEMA,
  location: 'five-cats-base',
  clues: [],
  conversation: null,
  missionCompleted: false,
  rewardClaimed: false,
});

export function createExplorationState(saved) {
  if (!saved || typeof saved !== 'object' || saved.version !== EXPLORATION_SCHEMA) return fresh();
  const state = fresh();
  if (routeIds.has(saved.location)) state.location = saved.location;
  if (Array.isArray(saved.clues))
    state.clues = [...new Set(saved.clues.filter((clue) => clueIds.has(clue)))].sort();
  if (choiceIds.has(saved.conversation) && state.clues.length === ORBIT9_EVIDENCE.length)
    state.conversation = saved.conversation;
  if (saved.missionCompleted === true && state.conversation)
    state.missionCompleted = true;
  if (saved.rewardClaimed === true && state.missionCompleted)
    state.rewardClaimed = true;
  if (!canTravel(state, state.location)) state.location = 'five-cats-base';
  return state;
}

export function questStatus(state) {
  const s = createExplorationState(state);
  return Object.freeze({
    found: s.clues.length,
    required: ORBIT9_EVIDENCE.length,
    survivorSpokenTo: !!s.conversation,
    missionUnlocked: s.clues.length === ORBIT9_EVIDENCE.length && !!s.conversation,
    planetUnlocked: s.missionCompleted,
    complete: s.missionCompleted && s.rewardClaimed,
  });
}

export function canTravel(state, destination) {
  const place = GALAXY_GRAPH.find((item) => item.id === destination);
  if (!place) return false;
  if (place.unlock === 'always') return true;
  const clues = Array.isArray(state?.clues) ? state.clues : [];
  const conversation = state?.conversation;
  if (place.unlock === 'three-clues-and-npc')
    return clues.length === ORBIT9_EVIDENCE.length && choiceIds.has(conversation);
  if (place.unlock === 'completed-orion-mission') return state?.missionCompleted === true;
  return false;
}

export function travelTo(state, destination) {
  const s = createExplorationState(state);
  if (!canTravel(s, destination)) return { state: s, accepted: false, reason: 'route-locked' };
  return { state: { ...s, location: destination }, accepted: true };
}

export function inspectEvidence(state, clueId) {
  const s = createExplorationState(state);
  if (s.location !== 'orbit-9-ruins') return { state: s, accepted: false, reason: 'wrong-location' };
  if (!clueIds.has(clueId)) return { state: s, accepted: false, reason: 'unknown-evidence' };
  if (s.clues.includes(clueId)) return { state: s, accepted: false, reason: 'already-collected' };
  return { state: { ...s, clues: [...s.clues, clueId].sort() }, accepted: true };
}

export function talkToSurvivor(state, choice) {
  const s = createExplorationState(state);
  if (s.location !== 'orbit-9-ruins') return { state: s, accepted: false, reason: 'wrong-location' };
  if (s.clues.length !== ORBIT9_EVIDENCE.length) return { state: s, accepted: false, reason: 'missing-evidence' };
  if (!choiceIds.has(choice)) return { state: s, accepted: false, reason: 'unknown-choice' };
  if (s.conversation) return { state: s, accepted: false, reason: 'choice-final' };
  return { state: { ...s, conversation: choice }, accepted: true };
}

export function completeExplorationMission(state, outcome) {
  const s = createExplorationState(state);
  if (s.location !== 'orion-ghost-route' || !canTravel(s, 'orion-ghost-route'))
    return { state: s, accepted: false, reason: 'mission-locked' };
  if (outcome !== 'victory') return { state: s, accepted: false, reason: 'no-victory' };
  if (s.missionCompleted) return { state: s, accepted: false, reason: 'already-complete' };
  return { state: { ...s, missionCompleted: true }, accepted: true };
}

export function claimExplorationReward(state) {
  const s = createExplorationState(state);
  if (!s.missionCompleted || s.rewardClaimed)
    return { state: s, accepted: false, reason: 'reward-unavailable' };
  return { state: { ...s, rewardClaimed: true }, accepted: true, reward: { credits: 300, artifact: 'orion-key' } };
}

// Exploration persistence is a separate key. No code here writes to the
// existing nova-wing-3d-v1 campaign checkpoint or any ranking endpoint.
export function loadExploration(storage) {
  try {
    const raw = storage?.getItem(EXPLORATION_SAVE_KEY);
    return createExplorationState(raw ? JSON.parse(raw) : null);
  } catch {
    return fresh();
  }
}

export function saveExploration(storage, state, { developerSession = false } = {}) {
  if (developerSession || typeof storage?.setItem !== 'function') return false;
  const clean = createExplorationState(state);
  try {
    storage.setItem(EXPLORATION_SAVE_KEY, JSON.stringify(clean));
    return true;
  } catch {
    return false;
  }
}
