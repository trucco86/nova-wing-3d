// Five Cats Universe — pure, testable exploration progression.
// No DOM, renderer, cloud services, ranking or external identity dependencies.
// The legacy rail-shooter save remains the owner of campaign progress.
export const EXPLORATION_SAVE_KEY = 'nova-wing-exploration-v1';

export const WORLD_NODES = Object.freeze({
  hub: Object.freeze({ name: 'BASE FIVE CATS', kind: 'hub', exits: ['orbit9'] }),
  orbit9: Object.freeze({
    name: 'RUÍNAS DA ÓRBITA-9',
    kind: 'exploration',
    exits: ['hub', 'orion'],
  }),
  orion: Object.freeze({ name: 'PORTAL DE ÓRION', kind: 'planet', exits: ['orbit9'] }),
});

export const ORBIT9_CLUES = Object.freeze(['relay', 'archive', 'survivor']);
export const ORBIT9_CHOICES = Object.freeze(['restore-power', 'shadow-route']);

const missionFor = (decision) =>
  decision === 'restore-power'
    ? 'defend-reactor'
    : decision === 'shadow-route'
      ? 'intercept-smugglers'
      : null;

const freshState = () => ({
  version: 1,
  location: 'hub',
  visited: ['hub'],
  clues: [],
  choice: null,
  mission: 'locked',
  completedMission: null,
});

const uniqueSubset = (values, allowed) =>
  Array.isArray(values) &&
  values.length <= allowed.length &&
  values.every((entry) => typeof entry === 'string' && allowed.includes(entry)) &&
  new Set(values).size === values.length;

export function validateExplorationState(candidate) {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return null;
  if (candidate.version !== 1 || !Object.hasOwn(WORLD_NODES, candidate.location)) return null;
  if (!uniqueSubset(candidate.visited, Object.keys(WORLD_NODES))) return null;
  if (!candidate.visited.includes('hub') || !candidate.visited.includes(candidate.location))
    return null;
  if (!uniqueSubset(candidate.clues, ORBIT9_CLUES)) return null;
  if (!candidate.visited.includes('orbit9') && candidate.clues.length) return null;
  if (candidate.choice !== null && !ORBIT9_CHOICES.includes(candidate.choice)) return null;
  if (!['locked', 'ready', 'active', 'done'].includes(candidate.mission)) return null;
  const available = candidate.clues.length === ORBIT9_CLUES.length;
  if (candidate.choice === null && candidate.mission !== 'locked') return null;
  if (candidate.choice !== null && (!available || candidate.mission === 'locked')) return null;
  const expectedMission = missionFor(candidate.choice);
  if (candidate.mission === 'done' && candidate.completedMission !== expectedMission) return null;
  if (candidate.mission !== 'done' && candidate.completedMission !== null) return null;
  if (candidate.visited.includes('orion') && candidate.mission !== 'done') return null;
  return {
    version: 1,
    location: candidate.location,
    visited: [...candidate.visited],
    clues: [...candidate.clues],
    choice: candidate.choice,
    mission: candidate.mission,
    completedMission: candidate.completedMission,
  };
}

export function readExplorationSave(storage) {
  try {
    const raw = storage?.getItem(EXPLORATION_SAVE_KEY);
    return raw ? validateExplorationState(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function createExplorationQuest({ storage = null, qa = false, initialState = null } = {}) {
  // QA starts from supplied memory state but is strictly read-only on storage.
  let state =
    validateExplorationState(initialState) ??
    (qa ? null : readExplorationSave(storage)) ??
    freshState();

  const save = () => {
    if (qa) return false;
    try {
      if (!storage?.setItem) return false;
      storage.setItem(EXPLORATION_SAVE_KEY, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  };

  const apply = (transform) => {
    const next = transform(state);
    if (!next) return false;
    const checked = validateExplorationState(next);
    if (!checked) return false;
    state = checked;
    save();
    return true;
  };

  return {
    snapshot: () => structuredClone(state),
    isQa: () => qa,
    canVisit(node) {
      if (!Object.hasOwn(WORLD_NODES, node)) return false;
      if (node === 'orion' && state.mission !== 'done') return false;
      return WORLD_NODES[state.location].exits.includes(node);
    },
    travel(node) {
      return apply((s) => {
        if (!this.canVisit(node)) return null;
        return { ...s, location: node, visited: [...new Set([...s.visited, node])] };
      });
    },
    inspect(clue) {
      return apply((s) => {
        if (s.location !== 'orbit9' || !ORBIT9_CLUES.includes(clue) || s.clues.includes(clue))
          return null;
        return { ...s, clues: [...s.clues, clue] };
      });
    },
    choose(choice) {
      return apply((s) => {
        if (s.location !== 'orbit9' || s.choice !== null || s.mission !== 'locked') return null;
        if (!ORBIT9_CHOICES.includes(choice) || s.clues.length !== ORBIT9_CLUES.length) return null;
        return { ...s, choice, mission: 'ready' };
      });
    },
    nextMission: () =>
      state.mission === 'ready' || state.mission === 'active' ? missionFor(state.choice) : null,
    launchMission() {
      return apply((s) =>
        s.location === 'orbit9' && s.mission === 'ready' ? { ...s, mission: 'active' } : null,
      );
    },
    completeMission(missionId) {
      return apply((s) =>
        s.mission === 'active' && missionId === missionFor(s.choice)
          ? { ...s, mission: 'done', completedMission: missionId }
          : null,
      );
    },
    save,
  };
}
