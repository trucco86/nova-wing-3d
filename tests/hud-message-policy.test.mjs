import test from 'node:test';
import assert from 'node:assert/strict';
import {
  compactRadioMessage,
  radioMessagePriority,
  createRadioTriage,
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
  assert.throws(() => compactRadioMessage('test', 4), RangeError);
});

test('repeated radio chatter does not reset the timer or flood the mission', () => {
  const policy = createRadioTriage();
  const initial = policy.offer('FORMAÇÃO INIMIGA · DRONES', 1);
  assert.ok(initial);
  assert.equal(initial.priority, 1);
  assert.equal(initial.duration, 1.65);
  assert.equal(policy.offer('FORMAÇÃO INIMIGA · DRONES', 2), null, 'dedupe repetition');
  assert.equal(policy.offer('ARMA · NOVA', 2.1), null, 'routine cooldown');
  assert.ok(policy.offer('ARMA · NOVA', 5.2), 'allow new routine after cooldown');
  assert.equal(policy.offer('FORMAÇÃO INIMIGA · DRONES', 6), null, 'same text cooldown');
  assert.ok(policy.offer('FORMAÇÃO INIMIGA · DRONES', 9.3), 'allow repetition after 7s');
});

test('critical messages preempt chatter and do not get overwritten by low-priority radio', () => {
  const policy = createRadioTriage();
  assert.ok(policy.offer('ARMA · PLASMA', 10));
  const urgent = policy.offer('NAVE PERDIDA · BOB ASSUME COMANDO', 10.05);
  assert.ok(urgent);
  assert.equal(urgent.priority, 3);
  assert.equal(urgent.duration, 2.5);
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
