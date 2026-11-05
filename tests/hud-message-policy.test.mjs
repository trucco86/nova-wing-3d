import test from 'node:test';
import assert from 'node:assert/strict';
import {
  compactRadioMessage,
  radioMessagePriority,
  createRadioTriage,
  compactBossAttackWarning,
  compactBossState,
} from '../src/hud-message-policy.js';

test('radio message urgency distinguishes danger, instructions and ambient chatter', () => {
  assert.equal(radioMessagePriority('NÚCLEO DESTRUÍDO · FUJA DO ASTEROIDE!'), 3);
  assert.equal(radioMessagePriority('ALERTA MARTE · TEMPESTADE DE AREIA À FRENTE'), 3);
  assert.equal(radioMessagePriority('SEGURE SUPER BOOST ATÉ ESGOTAR A ENERGIA'), 2);
  assert.equal(radioMessagePriority('EVITE AS PAREDES'), 2);
  assert.equal(radioMessagePriority('FORMAÇÃO INIMIGA · LEGIONÁRIOS'), 1);
});

test('long contextual radio keeps action and omits repeated pilot name without exceeding two short lines', () => {
  const original = 'FIVE CATS · PROPULSÃO DE EMERGÊNCIA ATIVADA! SAÍDA EM HIPERIMPULSO!';
  const shortened = compactRadioMessage(original, 45);
  assert.ok(shortened.length <= 45);
  assert.ok(!shortened.startsWith('FIVE CATS'));
  assert.match(shortened, /PROPULSÃO|SAÍDA/);
  assert.ok(compactRadioMessage('ESCUDO +25').length < 25);
  assert.match(
    compactRadioMessage(
      'TEMPESTADE MONUMENTAL QUE OCUPA TODO O HORIZONTE E DESTRÓI A VISÃO · COMPENSE COM O DIRECIONAL',
      42,
    ),
    /COMPENSE/,
  );
  assert.throws(() => compactRadioMessage('test', 4), RangeError);
});

test('repeated radio chatter does not reset the timer or flood the mission', () => {
  const policy = createRadioTriage();
  const initial = policy.offer('FORMAÇÃO INIMIGA · DRONES', 1);
  assert.ok(initial);
  assert.equal(initial.priority, 1);
  assert.equal(initial.duration, 1.3);
  assert.equal(policy.offer('FORMAÇÃO INIMIGA · DRONES', 2), null, 'dedupe repetition');
  assert.equal(policy.offer('ARMA · NOVA', 2.1), null, 'routine cooldown');
  assert.equal(policy.offer('ARMA · NOVA', 5.2), null, 'routine stays quiet for at least 7s');
  assert.ok(policy.offer('ARMA · NOVA', 8.7), 'new routine may replace the earlier notice later');
  assert.equal(policy.offer('FORMAÇÃO INIMIGA · DRONES', 9.3), null, 'routine never stacks');
  assert.ok(policy.offer('FORMAÇÃO INIMIGA · DRONES', 16.3), 'old chatter may recur much later');
});

test('critical messages preempt chatter and do not get overwritten by low-priority radio', () => {
  const policy = createRadioTriage();
  assert.ok(policy.offer('ARMA · PLASMA', 10));
  const urgent = policy.offer('NAVE PERDIDA · BOB ASSUME COMANDO', 10.05);
  assert.ok(urgent);
  assert.equal(urgent.priority, 3);
  assert.equal(urgent.duration, 2.25);
  assert.equal(policy.offer('FORMAÇÃO INIMIGA · NOVA', 10.1), null);
  assert.equal(policy.offer('NAVE PERDIDA · BOB ASSUME COMANDO', 10.4), null);
  assert.ok(policy.offer('SEGURE BOOST E DESVIE', 12.6), 'instruction after emergency expires');
  assert.equal(
    policy.offer('ARMA · PLASMA', 12.7),
    null,
    'no routine overrides active instruction',
  );
});

test('restarting a mission resets suppression and full text remains available', () => {
  const policy = createRadioTriage();
  const text =
    'TURBULÊNCIA · VENTO LATERAL INTENSO NA ATMOSFERA · COMPENSE COM O DIRECIONAL PARA MANTER O CURSO';
  const first = policy.offer(text, 3);
  assert.equal(first.full, text);
  assert.ok(first.text.length < text.length);
  policy.reset();
  const second = policy.offer(text, 3);
  assert.ok(second);
  assert.equal(second.full, text);
  assert.throws(() => policy.offer('ANY', Number.NaN), RangeError);
});

test('legacy mode can keep original text and forced announcements are not suppressed', () => {
  const policy = createRadioTriage();
  const full = 'MENSAGEM DE MISSÃO COMPLETA · NÃO PRECISA SER TRUNCADA';
  assert.equal(policy.offer(full, 0, { compact: false }).text, full);
  assert.ok(policy.offer(full, 0.1, { force: true }));
});

test('eight unique boss attacks show one short command without inventing a safe sector', () => {
  const examples = [
    ['ROK · PINÇA DAS ASAS · SUBA DA ZONA VERMELHA', 'SUBA'],
    ['STINGRAY · TESOURA VERTICAL · ESQUIVE PELA LATERAL', 'DESVIE'],
    ['CARBIDE · BROCA TRANSVERSAL · MUDE DE ALTURA', 'MUDE ALTURA'],
    ['ÓRION · PULSO GRAVITACIONAL · AFASTE-SE DO CENTRO', 'AFASTE-SE'],
    ['HIDRA · FOGO CRUZADO DAS CABEÇAS · SUBA PARA ESCAPAR', 'SUBA'],
    ['MARVIN · VARREDURA DAS TURBINAS · MUDE DE ALTURA', 'MUDE ALTURA'],
  ];
  for (const [label, action] of examples) {
    const compact = compactBossAttackWarning(label);
    assert.ok(compact.length <= 39, label);
    assert.ok(compact.startsWith('⚠ '));
    assert.ok(compact.includes(action), compact);
    assert.equal(compactBossAttackWarning(label, { threatened: false }), '');
  }
  assert.equal(compactBossAttackWarning(null), '');
});

test('boss health card shows only current player decision and keeps full text available', () => {
  const cases = [
    ['ÔMEGA · PEÇA DESTRUTÍVEL FRACA · BATERIA ESQ.', 'BATERIA ESQ. · FRACA'],
    ['ARMA VULNERÁVEL · BATERIA DIR.', 'BATERIA DIR. · FRACA'],
    ['BLINDAGEM · CORPO RECEBE DANO REDUZIDO · ORBITE PARA O FLANCO', 'BLINDAGEM · ORBITE'],
    ['FASE 3 · ALVO VULNERÁVEL · NÚCLEO', 'NÚCLEO EXPOSTO'],
    ['FASE 2 · ORBITE PARA A FRENTE', 'ORBITE À FRENTE'],
    ['APROXIMAÇÃO', 'APROXIMAÇÃO'],
  ];
  for (const [longLabel, expected] of cases) assert.equal(compactBossState(longLabel), expected);
  assert.ok(compactBossState('ARMA VULNERÁVEL · BATERIA DIR. · FRACO: PLASMA').includes('PLASMA'));
  assert.throws(() => compactBossState('TEST', 5), RangeError);
});

test('urgent pilot guidance preempts quiet radio despite recent instruction cooldown', () => {
  const policy = createRadioTriage();
  assert.equal(policy.offer('SEGURE BOOST NA ROTA', 2).priority, 2);
  assert.equal(policy.offer('DESVIE DA TURBINA', 3), null, 'avoid rapid second instruction');
  assert.equal(policy.offer('ALERTA · REATOR INSTÁVEL', 3.01).priority, 3);
  assert.equal(policy.offer('FORMAÇÃO INIMIGA · DRONES', 3.1), null);
  assert.ok(policy.offer('DESVIE DO NÚCLEO', 6), 'action recovers after emergency');
});
