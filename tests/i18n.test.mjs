import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translateText, createI18n, isCatalogued } from '../src/i18n.js';
test('menu, campaign and narrative translate to both languages',()=>{
  assert.equal(translateText('CIDADE DAS MÁQUINAS','en'),'CITY OF MACHINES');
  assert.equal(translateText('CIDADE DAS MÁQUINAS','es'),'CIUDAD DE LAS MÁQUINAS');
  assert.equal(translateText('ESCUDO +25','en'),'SHIELD +25');
  assert.equal(translateText('COMANDANTE VANGUARDA','en'),'VANGUARD COMMANDER');
  assert.ok(translateText('Bia, liberte a costa. As torres alimentam a frota de Marvin.','es').startsWith('Bia, libera'));
  assert.ok(translateText('Marvin roubou os suprimentos dos gatos e fugiu para o espaço profundo.','en').includes('stole'));
  assert.ok(isCatalogued('ARRASTE PARA EXPLORAR · EXAMINE ANTES DO VOO'));
});
test('interpolated gameplay statuses localize numbers without changing IDs',()=>{
  assert.equal(translateText('BLOCO I · ASCENSÃO / 02','en'),'BLOCK I · ASCENT / 02');
  assert.equal(translateText('BLOCO II · DEVASTADOR / 09','es'),'BLOQUE II · DEVASTADOR / 09');
  assert.equal(translateText('BIA / 3 VIDAS','en'),'BIA / 3 LIVES');
  assert.equal(translateText('EVOLUÇÃO 4 · POTÊNCIA AUMENTADA','en'),'LEVEL UP 4 · POWER INCREASED');
  assert.equal(translateText('✦ ESCUDO +25','en'),'✦ SHIELD +25');
  assert.equal(translateText('XP +4 · PODS','en'),'XP +4 · PODS');
});
test('defaults, proper names and spacing are preserved',()=>{
  assert.equal(translateText(' CIDADE DAS MÁQUINAS ','pt'),' CIDADE DAS MÁQUINAS ');
  assert.equal(translateText(' CIDADE DAS MÁQUINAS ','en'),' CITY OF MACHINES ');
  assert.equal(translateText('MARVIN / NOVA-7','en'),'MARVIN / NOVA-7');
  assert.equal(translateText('CIDADE DAS MÁQUINAS','xx'),'CIDADE DAS MÁQUINAS');
});
test('language switching restores original source and changes document language',()=>{
  const node={nodeType:3,nodeValue:'CIDADE DAS MÁQUINAS'};
  const body={nodeType:1,tagName:'BODY',childNodes:[node],getAttribute(){return null}};
  let lang='';const document={body,documentElement:{setAttribute(n,v){if(n==='lang')lang=v}}};
  const l=createI18n(document,{});
  l.setLanguage('en');assert.equal(node.nodeValue,'CITY OF MACHINES');assert.equal(lang,'en');
  l.setLanguage('es');assert.equal(node.nodeValue,'CIUDAD DE LAS MÁQUINAS');
  l.setLanguage('pt');assert.equal(node.nodeValue,'CIDADE DAS MÁQUINAS');assert.equal(lang,'pt-BR');
  l.destroy();
});
