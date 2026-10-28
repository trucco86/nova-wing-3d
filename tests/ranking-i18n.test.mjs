import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translateText, isCatalogued } from '../src/i18n.js';
import { createRankingClient } from '../src/ranking-client.js';
import { recordLocalResult } from '../src/score-history.js';

const required = [
  'CONTA · PILOTO',
  'Entrar com Google',
  'Continuar como visitante',
  'CONTA · PILOTO',
  'RANK · HISTÓRICO',
  'Apelido público',
  'ATUALIZAR RANK',
  'EXCLUIR MEUS DADOS NA NUVEM',
  'RANK GLOBAL · EXPERIMENTAL',
  'MEU HISTÓRICO · NA NUVEM',
  'MINHAS PARTIDAS · NESTE DISPOSITIVO',
  'Conta do piloto',
  'Ranking e histórico de pontuação',
  'Após excluir os dados, esta conta não poderá voltar ao ranking até existir um novo processo de inscrição.',
  'Não foi possível confirmar a exclusão remota. Tente novamente.',
];

test('ranking, account and accessibility labels are catalogued in both target languages', () => {
  for (const source of required) {
    assert.equal(isCatalogued(source), true, 'missing source: ' + source);
    assert.notEqual(translateText(source, 'en'), source, 'missing EN: ' + source);
    assert.notEqual(translateText(source, 'es'), source, 'missing ES: ' + source);
  }
});

test('multiline text nodes translate without replacing dynamic values or language preference', () => {
  const source =
    'Quero participar do ranking experimental e salvar minhas próximas pontuações na minha\n          conta.';
  assert.match(translateText(source, 'en'), /join the experimental ranking/);
  assert.match(translateText(source, 'es'), /participar en la clasificación/);
  assert.equal(translateText('3 fases · recorde 180 pts · total 290', 'en'),
    '3 stages · best 180 pts · total 290');
  assert.equal(translateText('Setor 3 · 140 pts', 'es'), 'Sector 3 · 140 pts');
  assert.equal(translateText('Entrar com Google', 'pt'), 'Entrar com Google');
});

function element() {
  const handlers = new Map();
  return {
    textContent: '', checked: false, disabled: false, value: '',
    children: [], append(child) { this.children.push(child); },
    replaceChildren() { this.children = []; },
    addEventListener(name, fn) { handlers.set(name, fn); },
    removeEventListener(name) { handlers.delete(name); },
    click() { return handlers.get('click')?.(); },
  };
}
function setup(lang = 'en') {
  const fields = new Map();
  for (const key of ['nickname', 'consent', 'status', 'summary', 'identity',
    'local', 'global', 'cloud', 'delete', 'refresh']) fields.set(key, element());
  const panel = {
    ...element(),
    querySelector(selector) {
      return fields.get(selector.match(/^\[data-rank-([a-z]+)\]$/)?.[1]);
    },
  };
  const document = {
    documentElement: { lang },
    getElementById: (id) => id === 'novaRanking' ? panel : { textContent: 'v1.24.24' },
    createElement: () => element(),
  };
  const values = new Map();
  const storage = {
    getItem: (k) => values.get(k) || null,
    setItem: (k, v) => values.set(k, v),
  };
  recordLocalResult(storage, {
    id: 'run1', sector: 1, points: 80, durationMs: 100000,
    completedAt: '2026-10-27T15:00:00.000Z',
  });
  let confirmPrompt = '';
  const client = createRankingClient({
    document, storage,
    confirmDeletion: (value) => { confirmPrompt = value; return false; },
    fetcher: async () => ({ ok: true, json: async () => ({ entries: [] }) }),
  });
  return {
    client, document,
    field: (name) => fields.get(name),
    confirmPrompt: () => confirmPrompt,
  };
}

test('score dates follow global language setting without changing score or storage', () => {
  const app = setup('en');
  assert.match(app.field('local').children[0].textContent, /10\/27\/2026/);
  app.document.documentElement.lang = 'es';
  app.client.refreshLocal();
  assert.match(app.field('local').children[0].textContent, /27\/10\/2026/);
  assert.equal(app.field('summary').textContent, '1 fases · recorde 80 pts · total 80');
  app.document.documentElement.lang = 'pt-BR';
  app.client.refreshLocal();
  assert.match(app.field('local').children[0].textContent, /27\/10\/2026/);
  app.client.destroy();
});

test('destructive confirmation is localized without mutating user consent on cancel', async () => {
  const app = setup('es');
  app.client.setRuntimeConfig({ rankingApiUrl: 'https://rank.example.org' });
  app.client.setUser({ uid: 'a', getIdToken: async () => 'token-A' });
  app.field('consent').checked = true;
  await app.field('delete').click();
  assert.match(app.confirmPrompt(), /Eliminar permanentemente/);
  assert.match(app.confirmPrompt(), /nuevas puntuaciones/);
  assert.equal(app.field('consent').checked, true);
  assert.equal(app.field('delete').disabled, false);
  app.client.destroy();
});
