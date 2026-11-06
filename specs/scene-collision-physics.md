# Integridade física de cenário — primeira entrega P0

## Contexto

Relato de QA: nave e objetos atravessam estruturas, mesmo quando já existe
reação de dano; há detalhes estruturais visíveis sem volumes de colisão e
obstáculos roteirizados que podem aparecer sobre outros.

## Contrato desta entrega

1. Obstáculos jogáveis mantêm volumes de colisão `solids` em espaço local e
   distinguem `userData.collisionRole = 'solid' | 'decoration'` em cada mesh.
   Luzes, placas e VFX podem ser decorativos; pilares, vigas, portões, destroços
   rígidos e canhões expostos não podem ser decorativos.
2. Resolver movimento relativo da nave/robô contra cada sólido (swept sphere
   vs AABB); corrigir a posição após contato em vez de apenas reduzir escudo.
   Um único quadro de boost não pode atravessar uma parede fina.
3. Checar colisão composta entre obstáculos existentes e candidatos antes
   do spawn, sem introduzir hitboxes invisíveis nas passagens do túnel.
4. Colisões de tiros contra sólidos existentes permanecem ativas.
5. Não alterar comportamentos aprovados de fases, controles, combate e loja.
   Funcionar em WebGL e no modo nativo, sem depender de um motor de física externo.

## Cenários de aceite automatizado

- Travessia horizontal rápida contra uma parede fina bloqueia o deslocamento.
- Colisor avançando de z negativo a positivo encontra uma nave estacionária.
- Um corpo surgindo dentro de colisor é projetado para fora.
- A abertura da primeira barreira do túnel continua transitável; parte
  fechada bloqueia o movimento.
- Cada peça structural recebe volume e todas as meshes registram a função
  física/decorativa; volumes finitos e positivos.
- Dois obstáculos não são criados com seus volumes sólidos interpenetrados.
- Separar corpo e atualizar hit não implica modificar HP antes do gate de dano
  (invulnerabilidade e proteção continuam sob controle do combate).

## Riscos e acompanhamento

Esta alteração **não** é um rigid-body engine global. Ainda precisam de
implementação própria: colisão entre inimigos e peças dinâmicas da cidade,
corpos de destroços com gravidade/atrito e repouso sobre solo, colisores para
instâncias móveis de cenografia, terrenos deformados e apêndices articulados dos
chefes. Essas tarefas pertencem à issue #285 e não devem ser marcadas concluídas
por esta PR.

### Validação de entrega

- `npm run format`, `npm run build`, `npm run validate`
- `npm run validate -- --browser`
- inspeção de desktop e celular com captura do cenário e janelas de colisão
- não promover a produção antes de build, CI e homologação
