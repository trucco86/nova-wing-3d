# QA163: uma leitura das bocas de tiro por rajada inimiga

## Problema e escopo

Durante uma única rajada, o loop de `src/game.js` chama `hostileMuzzles(e)`
duas vezes por tiro normal e novamente por projétil do padrão do subchefe.
Cada chamada atualiza `matrixWorld`, procura hardpoints da nave e instancia
vetores com `getWorldPosition`. Não há animação do inimigo entre esses tiros.

## Alteração

- Capturar `volleyMuzzles` uma vez após o gate de disparo e reutilizar nas
  balas dos caças, pares de olhos dos robôs e padrões de subchefes.
- Preservar a regra de seleção por offset `abs(round(offset)) % 2`,
  o fallback `volleyMuzzles[0]` e, na ausência de emissor, `e.o.position.clone()`.
- Não alterar posições dos inimigos, alvos, tipos de munição, cadência, dano,
  avisos de ataque ou score.
- O projectile pool já copia a posição recebida. Testar explicitamente que
  duas balas compartilhando a mesma origem mantêm posição própria.

## Homologação

- CI Node e Playwright 6/6 no SHA final; source repair; preview isolado.
- Testes com subchefe, caças multi-tiro, robôs e fase 3 em mobile real.
- Sem promessa de ganho de FPS antes de medir; o objetivo é reduzir CPU/GC.
- PR empilhada sobre QA162, mantendo QA159 a QA162 pendentes de homologação.
- Nenhum merge nem deploy de produção sem revisão e autorização.
