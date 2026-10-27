import { readLocalHistory, recordLocalResult, localScoreSummary } from './score-history.js';

const MAX_REMOTE_ROWS = 20;
function validNickname(value) {
  return /^[\p{L}\p{N}_. -]{2,24}$/u.test(value.trim());
}

function newLocalId() {
  return globalThis.crypto?.randomUUID?.() || 'local-' + Date.now() + '-' + Math.random();
}

export function createRankingClient({
  document = globalThis.document,
  storage = globalThis.localStorage,
  fetcher = (...args) => fetch(...args),
} = {}) {
  const panel = document?.getElementById('novaRanking');
  const el = (name) => panel?.querySelector('[data-rank-' + name + ']');
  const listLocal = el('local');
  const listGlobal = el('global');
  const listCloud = el('cloud');
  const nickname = el('nickname');
  const consent = el('consent');
  const status = el('status');
  let apiBase = null;
  let user = null;
  let identityEpoch = 0;
  let activeRun = null;
  let closed = false;
  const unsubscribers = [];

  const say = (value) => {
    if (!closed && status) status.textContent = value;
  };
  const addListener = (element, event, handler) => {
    if (!element) return;
    element.addEventListener(event, handler);
    unsubscribers.push(() => element.removeEventListener(event, handler));
  };
  function fill(list, values, empty) {
    if (!list) return;
    list.replaceChildren();
    if (!values.length) {
      const item = document.createElement('li');
      item.textContent = empty;
      list.append(item);
      return;
    }
    for (const entry of values) {
      const item = document.createElement('li');
      item.textContent = entry;
      list.append(item);
    }
  }
  function refreshLocal() {
    const summary = localScoreSummary(storage);
    const local = readLocalHistory(storage);
    const heading = el('summary');
    if (heading)
      heading.textContent =
        summary.count + ' fases · recorde ' + summary.best + ' pts · total ' + summary.total;
    fill(
      listLocal,
      local
        .slice(0, 8)
        .map(
          (entry) =>
            'Setor ' +
            entry.sector +
            ' · ' +
            entry.points +
            ' pts · ' +
            new Date(entry.completedAt).toLocaleDateString('pt-BR'),
        ),
      'Sem partidas concluídas neste dispositivo.',
    );
  }
  async function request(path, { method = 'GET', payload, authorized = false } = {}) {
    if (!apiBase) throw new Error('RANKING_API_UNAVAILABLE');
    const headers = { accept: 'application/json' };
    if (payload !== undefined) headers['content-type'] = 'application/json';
    if (authorized) {
      if (!user?.getIdToken) throw new Error('AUTH_REQUIRED');
      headers.authorization = 'Bearer ' + (await user.getIdToken());
    }
    const response = await fetcher(apiBase + path, {
      method,
      headers,
      ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'RANKING_REQUEST_FAILED');
    return data;
  }

  async function refreshOnline() {
    if (closed || !apiBase) {
      fill(listGlobal, [], 'Ranking online indisponível.');
      fill(listCloud, [], 'Histórico remoto indisponível.');
      return;
    }
    const epoch = identityEpoch;
    try {
      const response = await request('/v1/leaderboard?mode=experimental&limit=' + MAX_REMOTE_ROWS);
      if (closed || epoch !== identityEpoch) return;
      fill(
        listGlobal,
        (response.entries || []).map(
          (entry, index) =>
            index +
            1 +
            'º · ' +
            String(entry.nickname).slice(0, 24) +
            ' · ' +
            entry.points +
            ' pts · Setor ' +
            entry.sector,
        ),
        'Ranking experimental ainda sem pontuações.',
      );
      if (user?.getIdToken) {
        try {
          const history = await request('/v1/me/history', { authorized: true });
          if (!closed && epoch === identityEpoch)
            fill(
              listCloud,
              (history.entries || [])
                .slice(0, 8)
                .map(
                  (entry) =>
                    'Setor ' +
                    entry.sector +
                    ' · ' +
                    entry.points +
                    ' pts · ' +
                    new Date(entry.completedAt).toLocaleDateString('pt-BR'),
                ),
              'Sem partidas remotas registradas.',
            );
        } catch {
          if (!closed && epoch === identityEpoch)
            fill(listCloud, [], 'Histórico remoto temporariamente indisponível.');
        }
      } else fill(listCloud, [], 'Entre com Google para consultar seu histórico na nuvem.');
      say('Ranking experimental · pontuações ainda não verificadas por anticheat.');
    } catch {
      if (!closed) say('Ranking remoto indisponível. Seu histórico local foi preservado.');
    }
  }

  function onStageStarted({ sector }) {
    // Only logged-in players who explicitly opt in start a remote run.
    const current = { sector, epoch: identityEpoch, remote: null };
    activeRun = current;
    if (
      !apiBase ||
      !user?.getIdToken ||
      !consent?.checked ||
      !validNickname(nickname?.value || '')
    ) {
      return;
    }
    const nick = nickname.value.trim();
    const build = (document.getElementById('gameVersion')?.textContent || 'v1.24.18')
      .trim()
      .replace(/^v/, '');
    current.remote = request('/v1/runs/start', {
      method: 'POST',
      authorized: true,
      payload: { nickname: nick, consent: true, sector, build },
    }).catch(() => null);
  }

  async function onStageFinished({ sector, points, durationMs }) {
    const entry = {
      id: newLocalId(),
      sector,
      points: Math.max(0, Math.round(points)),
      durationMs: Math.max(0, Math.round(durationMs)),
      completedAt: new Date().toISOString(),
    };
    recordLocalResult(storage, entry);
    refreshLocal();
    const run = activeRun;
    activeRun = null;
    if (!run || run.sector !== sector || run.epoch !== identityEpoch || !run.remote) {
      say(
        'Pontuação guardada neste navegador. Entre com Google e aceite o ranking para registrar partidas futuras.',
      );
      return;
    }
    try {
      const started = await run.remote;
      if (!started || run.epoch !== identityEpoch || !user?.getIdToken) {
        say('Pontuação local preservada. Envio remoto não disponível.');
        return;
      }
      const done = await request('/v1/runs/finish', {
        method: 'POST',
        authorized: true,
        payload: {
          runId: started.runId,
          nonce: started.nonce,
          sector,
          points: entry.points,
          durationMs: Math.max(30000, entry.durationMs),
        },
      });
      if (done.recorded && !closed) {
        say('Pontuação armazenada no ranking experimental (não verificada).');
        void refreshOnline();
      }
    } catch {
      say('Histórico local salvo. Não foi possível gravar esta partida no servidor.');
    }
  }

  function setUser(nextUser) {
    if (user !== nextUser) {
      identityEpoch++;
      activeRun = null;
    }
    user = nextUser;
    if (el('identity'))
      el('identity').textContent = user
        ? 'Google conectado · competição opcional'
        : 'Visitante · resultados locais';
    refreshLocal();
    if (apiBase) void refreshOnline();
  }

  function setRuntimeConfig(runtimeConfig) {
    apiBase = runtimeConfig?.rankingApiUrl || null;
    if (apiBase) void refreshOnline();
    else say('Histórico local ativo. API de ranking ainda não configurada neste ambiente.');
  }
  addListener(el('refresh'), 'click', () => {
    refreshLocal();
    void refreshOnline();
  });
  addListener(panel, 'toggle', () => {
    if (panel.open) {
      refreshLocal();
      void refreshOnline();
    }
  });
  refreshLocal();
  say('Pontuações locais habilitadas; ranking remoto depende da API do ambiente.');

  return {
    onStageStarted,
    onStageFinished,
    setUser,
    setRuntimeConfig,
    refreshLocal,
    destroy() {
      closed = true;
      activeRun = null;
      unsubscribers.forEach((fn) => fn());
    },
  };
}
