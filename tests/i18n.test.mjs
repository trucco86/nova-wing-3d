import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translateText, createI18n, isCatalogued } from '../src/i18n.js';
test('menu, campaign and narrative translate to both languages', () => {
  assert.equal(translateText('CIDADE DAS MÁQUINAS', 'en'), 'CITY OF MACHINES');
  assert.equal(translateText('CIDADE DAS MÁQUINAS', 'es'), 'CIUDAD DE LAS MÁQUINAS');
  assert.equal(translateText('ESCUDO +25', 'en'), 'SHIELD +25');
  assert.equal(translateText('COMANDANTE VANGUARDA', 'en'), 'VANGUARD COMMANDER');
  assert.ok(
    translateText('Bia, liberte a costa. As torres alimentam a frota de Marvin.', 'es').startsWith(
      'Bia, libera',
    ),
  );
  assert.ok(
    translateText(
      'Marvin roubou os suprimentos dos gatos e fugiu para o espaço profundo.',
      'en',
    ).includes('stole'),
  );
  assert.ok(isCatalogued('ARRASTE PARA EXPLORAR · EXAMINE ANTES DO VOO'));
});
test('interpolated gameplay statuses localize numbers without changing IDs', () => {
  assert.equal(translateText('BLOCO I · ASCENSÃO / 02', 'en'), 'BLOCK I · ASCENT / 02');
  assert.equal(translateText('BLOCO II · DEVASTADOR / 09', 'es'), 'BLOQUE II · DEVASTADOR / 09');
  assert.equal(translateText('BIA / 3 VIDAS', 'en'), 'BIA / 3 LIVES');
  assert.equal(
    translateText('EVOLUÇÃO 4 · POTÊNCIA AUMENTADA', 'en'),
    'LEVEL UP 4 · POWER INCREASED',
  );
  assert.equal(translateText('✦ ESCUDO +25', 'en'), '✦ SHIELD +25');
  assert.equal(translateText('XP +4 · PODS', 'en'), 'XP +4 · PODS');
  assert.equal(
    translateText('XP 160/250 · ATAQUE +87% · ESCUDO +15 · AGILIDADE +15% · ARCANA +13%', 'en'),
    'XP 160/250 · ATTACK +87% · SHIELD +15 · AGILITY +15% · ARCANA +13%',
  );
  assert.equal(translateText('ARSENAL COMPLETO', 'es'), 'ARSENAL COMPLETO');
});
test('defaults, proper names and spacing are preserved', () => {
  assert.equal(translateText(' CIDADE DAS MÁQUINAS ', 'pt'), ' CIDADE DAS MÁQUINAS ');
  assert.equal(translateText(' CIDADE DAS MÁQUINAS ', 'en'), ' CITY OF MACHINES ');
  assert.equal(translateText('MARVIN / NOVA-7', 'en'), 'MARVIN / NOVA-7');
  assert.equal(translateText('CIDADE DAS MÁQUINAS', 'xx'), 'CIDADE DAS MÁQUINAS');
});
test('armory purchases and campaign intelligence localize with numeric progress intact', () => {
  assert.equal(
    translateText('MULTITIRO · +1 PROJÉTIL · 260 CR', 'en'),
    'MULTISHOT · +1 PROJECTILE · 260 CR',
  );
  assert.equal(translateText('2 / 10 SETORES CONCLUÍDOS', 'es'), '2 / 10 SECTORES COMPLETADOS');
  assert.equal(
    translateText('PACOTE BOMBAS ×3 · PRECISA DE 3 VAGAS', 'en'),
    'BOMB PACK ×3 · NEEDS 3 FREE SLOTS',
  );
  assert.equal(
    translateText('AMEAÇAS: Defesas costeiras e máquinas submarinas', 'en'),
    'THREATS: Coastal defenses and underwater machines',
  );
  assert.equal(translateText('Setor 2: DISTRITO PORTUÁRIO', 'es'), 'Sector 2: DISTRITO PORTUARIO');
});
test('language switching restores original source and changes document language', () => {
  const node = { nodeType: 3, nodeValue: 'CIDADE DAS MÁQUINAS' };
  const body = {
    nodeType: 1,
    tagName: 'BODY',
    childNodes: [node],
    getAttribute() {
      return null;
    },
  };
  let lang = '';
  const document = {
    body,
    documentElement: {
      setAttribute(n, v) {
        if (n === 'lang') lang = v;
      },
    },
  };
  const l = createI18n(document, {});
  l.setLanguage('en');
  assert.equal(node.nodeValue, 'CITY OF MACHINES');
  assert.equal(lang, 'en');
  l.setLanguage('es');
  assert.equal(node.nodeValue, 'CIUDAD DE LAS MÁQUINAS');
  l.setLanguage('pt');
  assert.equal(node.nodeValue, 'CIDADE DAS MÁQUINAS');
  assert.equal(lang, 'pt-BR');
  l.destroy();
});

test('scatter loadout purchase and equipped mode translate in EN and ES', () => {
  assert.equal(
    translateText('CANHÃO DE DISPERSÃO · CURTO ALCANCE · 420 CR', 'en'),
    'SCATTER CANNON · CLOSE RANGE · 420 CR',
  );
  assert.equal(translateText('EQUIPAR DISPERSÃO', 'es'), 'EQUIPAR DISPERSIÓN');
  assert.equal(
    translateText('DISPARO EQUIPADO: DISPERSÃO · CURTO ALCANCE', 'en'),
    'EQUIPPED: SCATTER · CLOSE RANGE',
  );
});
