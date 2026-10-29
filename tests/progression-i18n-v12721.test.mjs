import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TROPHIES } from '../src/trophy-catalog.js';
import { CAT_MEDALS, CAT_RANKS, SQUAD_RANKS } from '../src/cat-rank-catalog.js';
import { translateText } from '../src/i18n.js';

test('all 41 trophy titles and details are readable in English and Spanish', () => {
  assert.equal(TROPHIES.length, 41);
  for (const trophy of TROPHIES)
    for (const lang of ['en', 'es']) {
      assert.notEqual(
        translateText(trophy.title, lang),
        trophy.title,
        lang + ' untranslated trophy title ' + trophy.id,
      );
      assert.notEqual(
        translateText(trophy.detail, lang),
        trophy.detail,
        lang + ' untranslated trophy detail ' + trophy.id,
      );
    }
});
test('all feline medal descriptions have translated English and Spanish copy', () => {
  assert.equal(CAT_MEDALS.length, 12);
  for (const medal of CAT_MEDALS)
    for (const lang of ['en', 'es']) {
      assert.notEqual(
        translateText(medal.title, lang),
        medal.title,
        lang + ' untranslated medal title ' + medal.id,
      );
      assert.notEqual(
        translateText(medal.hint, lang),
        medal.hint,
        lang + ' untranslated medal hint ' + medal.id,
      );
    }
});
test('rank titles, aliases and service hall are localized when wording differs', () => {
  for (const rank of CAT_RANKS)
    for (const lang of ['en', 'es']) {
      const expected = translateText(rank.title + ' · ' + rank.alias, lang);
      assert.notEqual(
        expected,
        rank.title + ' · ' + rank.alias,
        lang + ' untranslated rank label ' + rank.title,
      );
    }
  for (const rank of SQUAD_RANKS)
    assert.notEqual(
      translateText(rank.title, 'en'),
      rank.title,
      'untranslated squad rank ' + rank.title,
    );
  assert.equal(translateText('Troféu secreto', 'en'), 'Secret trophy');
  assert.equal(translateText('Troféu secreto', 'es'), 'Trofeo secreto');
  assert.equal(translateText('Só na Bala', 'en'), 'Primary Weapons Only');
  assert.equal(translateText('Olho de Gato', 'en'), "Cat's Eye");
  assert.equal(translateText('0 PONTOS DE SERVIÇO', 'en'), '0 SERVICE POINTS');
  assert.equal(translateText('0 PONTOS DE SERVIÇO', 'es'), '0 PUNTOS DE SERVICIO');
  assert.equal(translateText('Conquistada: Garra de Ouro', 'en'), 'Earned: Gold Claw');
});
test('translation never mutates canonical achievement IDs, numeric targets or player save payloads', () => {
  for (const trophy of TROPHIES) {
    assert.equal(translateText(trophy.id, 'en'), trophy.id);
    assert.equal(translateText(String(trophy.target), 'es'), String(trophy.target));
  }
  assert.equal(translateText('Capitão', 'pt'), 'Capitão');
});
