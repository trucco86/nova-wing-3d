# QA162: contato físico dos obstáculos móveis

## Defeito observado no código

O loop de obstáculos de `src/game.js` detectava choque com a geometria
sólida e chamava `hit(30)`, mas não ajustava a posição da nave.
Com dt elevado ou boost, uma travessia instantânea podia ser seguida por voo
dentro de um paredão ou por um túnel. Este caso é distinto da QA161, que
corrigiu o lado de saída do fallback de colisão urbana.

## Contrato

- Usar o mesmo `resolveCitySolidContact` já testado, com clearance esférico
  igual ao `shipCollisionMargin` (1.3 / 0.92), sem mudar dano nem hitboxes.
- Transformar centros locais de `userData.solids` em coordenadas mundiais.
- Aplicar `travel` ao centro anterior de cada objeto móvel.
- Não gerar colliders para partes decorativas nem portas já destruídas.
- Respeitar corredores do túnel e abertura física de Europa.
- Alocar um único objeto scratch por instância de jogo.
- Não mudar as regras históricas da modalidade 2D/clássica.
- A mudança não instala engine física nem resolve contato entre destroços.

## Gates

- Testes QA162 com muro bilateral, alta velocidade, sólido móvel, túnel
  atravessável, brecha Europa aberta e fuga de overlap.
- `npm run release:prepare -- 1.27.156`, format, build, validate,
  source repair, preview, Playwright completo nos 6 shards.
- Inspeção em aparelho físico de frame time, controle, boost, colisão de
  túnel e câmera. **Não fazer merge sem homologação e aceite.**

## Evidência inicial de automação em 19/11/2026

- [Sync QA162 #44623326097](https://github.com/trucco86/nova-wing-3d/actions/runs/44623326097): `success`, incluindo `release:prepare` v1.27.156, format, build e `npm run validate`; gera o HTML sincronizado.
- [CI FULL no SHA gerado #44623700341](https://github.com/trucco86/nova-wing-3d/actions/runs/44623700341): iniciada para quality, browser e seis shards; conclusão ainda precisa de verificação.
- Homologação visual e desempenho em GPU de iPhone físico ainda não executados.
