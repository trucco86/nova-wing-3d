# Marte 4.3 — Transição de reentrada com névoa cor de areia, sem anéis

## Problema / decisão

Na fase 2, o antigo bow shock era desenhado por dois toros gigantes que apareciam como
anéis concêntricos no centro da tela e não tinham justificativa narrativa.
O efeito não deve ser confundido com os _anéis de recursos_ do gameplay,
que mantêm suas próprias regras, exclusivamente fora dos 27 segundos iniciais.

## Comportamento observável

- A missão preserva a ordem **espaço (0–6s) → órbita (6–13s) → reentrada (13–20s) → descida (20–27s) → combate em Marte**.
- Durante entrada/descida, **nenhum toro, anel gigante, arranhão ou arco circular** ocupa o centro.
- O calor da entrada é substituído por **cortinas irregulares de névoa ocre/areia**, com profundidade, movimento lateral contínuo e grãos finos.
- Entrada progressiva entre 12s e 15s; intensidade alta durante 15–24s; dissolução suave entre 24s e 31s. Aos 32s a névoa de entrada desaparece.
- O fog 3D muda para tom arenoso durante a transição, retornando à visibilidade normal da superfície; a tempestade jogável de 61–84s permanece independente.
- A nave, mira, o chão revelado, os satélites Fobos/Deimos e os marcos de Marte permanecem legíveis.
- Vento lateral e efeitos de tempestade não são antecipados para a reentrada.
- Toda animação usa **tempo simulado da missão**: pausa congela a imagem; replay/reinício reproduz o mesmo frame; sem timers, aleatoriedade por frame ou novos hitboxes.
- Custo limitado a **quatro planos transparentes com shader e um batch de 180 partículas**, sem efeitos extras de pós-processamento; testar desempenho nos modos Alto/Médio.

## Critérios de aceite / gates

1. Teste Node: fase, curva da névoa, ausência de geometria circular, coloração, pausa/replay/reset e isolamento de setores.
2. Teste navegador WebGL: capturar 0, 8, 16, 23, 27 e 32 segundos em desktop e iPhone portrait; conferir que nada encobre controles e mira.
3. Testar mudança para o setor seguinte, o retorno à Terra e a tempestade na segunda metade.
4. Rodar format, build, validate e browser no SHA final; nenhum merge em DEV/HML/PROD sem gates completos e homologação visual.
5. O bundle publicado exige a preparação de release conforme `docs/RELEASE-PREPARATION.md`: não considerar fontes isoladas como deploy pronto.

## Fora de escopo

Não remover recursos coletáveis do restante do gameplay, alterar hitboxes, aumentar dificuldade, modificar chefes ou publicar em produção. Mudanças adicionais de Graphics Premium, IA dos chefes e novos biomas continuam nas demais frentes do backlog.
