import { readLocalHistory, recordLocalResult, localScoreSummary } from './score-history.js';
import { translateText } from './i18n.js';

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
  confirmDeletion = (message) => globalThis.confirm?.(message) === true,
} = {}) {
  const panel = document?.getElementById('novaRanking');
  const el = (name) => panel?.querySelector('[data-rank-' + name + ']');
  const listLocal = el('local');
  const listGlobal = el('global');
  const listCloud = el('cloud');
  const nickname = el('nickname');
  const consent = el('consent');
  const deleteRemote = el('delete');
  const status = el('status');
  const locale = () => {
    const lang = document?.documentElement?.lang?.slice(0, 2);
    return lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR';
  };
  let apiBase = null;
  let user = null;
  let identityEpoch = 0;
  let activeRun = null;
  let deleteInProgress = false;
  let closed = false;
  const unsubscribers = [];

  const say = (value) => {
    if (!closed && status) status.textContent = value;
  };
  const updateDeleteAccess = () => {
    if (deleteRemote) deleteRemote.disabled = deleteInProgress || !apiBase || !user?.getIdToken;
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
            new Date(entry.completedAt).toLocaleDateString(locale()),
        ),
      'Sem partidas concluídas neste dispositivo.',
    );
  }
  async function request(
    path,
    {
      method = 'GET',
      payload,
      authorized = false,
      sessionEpoch = null,
      requireConsent = false,
    } = {},
  ) {
    if (!apiBase) throw new Error('RANKING_API_UNAVAILABLE');
    const headers = { accept: 'application/json' };
    if (payload !== undefined) headers['content-type'] = 'application/json';
    const requestingUser = user;
    if (authorized) {
      if (!requestingUser?.getIdToken) throw new Error('AUTH_REQUIRED');
      headers.authorization = 'Bearer ' + (await requestingUser.getIdToken());
    }
    // A token can resolve after logout, account switch, consent withdrawal or destroy.
    // Do not send a queued mutation under another player's identity or preferences.
    if (
      closed ||
      (sessionEpoch !== null && sessionEpoch !== identityEpoch) ||
      (requireConsent && (!consent?.checked || requestingUser !== user))
    ) {
      throw new Error('RANKING_SESSION_CHANGED');
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
                    new Date(entry.completedAt).toLocaleDateString(locale()),
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
      sessionEpoch: current.epoch,
      requireConsent: true,
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
    if (
      !run ||
      run.sector !== sector ||
      run.epoch !== identityEpoch ||
      !run.remote ||
      !consent?.checked
    ) {
      say(
        'Pontuação guardada neste navegador. Entre com Google e aceite o ranking para registrar partidas futuras.',
      );
      return;
    }
    try {
      const started = await run.remote;
      if (!started || run.epoch !== identityEpoch || !user?.getIdToken || !consent?.checked) {
        say('Pontuação local preservada. Envio remoto não disponível.');
        return;
      }
      const done = await request('/v1/runs/finish', {
        method: 'POST',
        authorized: true,
        sessionEpoch: run.epoch,
        requireConsent: true,
        payload: {
          runId: started.runId,
          nonce: started.nonce,
          sector,
          points: entry.points,
          durationMs: Math.max(30000, entry.durationMs),
        },
      });
      if (done.recorded && !closed && run.epoch === identityEpoch && consent?.checked) {
        say('Pontuação armazenada no ranking experimental (não verificada).');
        void refreshOnline();
      }
    } catch {
      if (!closed && run.epoch === identityEpoch)
        say('Histórico local salvo. Não foi possível gravar esta partida no servidor.');
    }
  }

  function setUser(nextUser) {
    if (user !== nextUser) {
      identityEpoch++;
      activeRun = null;
      // Browser autofill and an earlier Firebase account are NOT consent.
      if (consent) consent.checked = false;
      if (nickname) nickname.value = '';
      // Hide private rows synchronously, before any async history request.
      fill(
        listCloud,
        [],
        nextUser
          ? 'Consulte o histórico desta conta.'
          : 'Entre com Google para consultar seu histórico na nuvem.',
      );
    }
    user = nextUser;
    updateDeleteAccess();
    if (el('identity'))
      el('identity').textContent = user
        ? 'Google conectado · competição opcional'
        : 'Visitante · resultados locais';
    refreshLocal();
    if (apiBase) void refreshOnline();
  }

  function setRuntimeConfig(runtimeConfig) {
    apiBase = runtimeConfig?.rankingApiUrl || null;
    updateDeleteAccess();
    if (apiBase) void refreshOnline();
    else say('Histórico local ativo. API de ranking ainda não configurada neste ambiente.');
  }
  // A revoked consent invalidates in-flight score requests and all pending runs.
  // Re-enabling it during a stage does not silently re-enroll that stage.
  addListener(consent, 'change', () => {
    if (!consent.checked) {
      identityEpoch++;
      activeRun = null;
      say('Participação no ranking desativada. Seus resultados locais continuam salvos.');
    }
  });
  // Never trust HTML default state or restored form values at startup.
  if (consent) consent.checked = false;
  if (nickname) nickname.value = '';
  // Deletion affects only the authenticated remote player profile and scores.
  // Local scores/checkpoints are never touched, even if the API is unavailable.
  addListener(deleteRemote, 'click', async () => {
    if (closed || deleteInProgress || !apiBase || !user?.getIdToken) return;
    const confirmed = confirmDeletion(
      translateText(
        'Excluir permanentemente seu apelido e histórico de pontuação na nuvem? ' +
          'O progresso e as partidas neste dispositivo serão mantidos. ' +
          'Esta conta não poderá enviar novas pontuações até existir um novo processo de inscrição.',
        locale().slice(0, 2),
      ),
    );
    if (!confirmed || closed) return;
    // A player cannot finish a remote run or carry forward old consent while deleting.
    identityEpoch++;
    activeRun = null;
    if (consent) consent.checked = false;
    if (nickname) nickname.value = '';
    const epoch = identityEpoch;
    deleteInProgress = true;
    updateDeleteAccess();
    say('Solicitando exclusão dos dados na nuvem...');
    try {
      const response = await request('/v1/me', {
        method: 'DELETE',
        authorized: true,
        sessionEpoch: epoch,
      });
      if (closed || epoch !== identityEpoch) return;
      if (response.deleted !== true) throw new Error('DELETE_NOT_CONFIRMED');
      fill(listCloud, [], 'Seu histórico remoto foi excluído.');
      // Clear the old global snapshot so deleted scores are not shown as current.
      fill(listGlobal, [], 'Atualize para consultar o ranking.');
      say('Dados remotos excluídos. Suas partidas e progresso locais foram mantidos.');
    } catch {
      if (!closed && epoch === identityEpoch)
        say('Não foi possível confirmar a exclusão remota. Tente novamente.');
    } finally {
      deleteInProgress = false;
      updateDeleteAccess();
    }
  });
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
  updateDeleteAccess();
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
