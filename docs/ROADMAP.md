# Roadmap de produto, qualidade e apresentação

Atualizado em 21/10/2026. Este roadmap registra decisões do mantenedor sem
substituir specs, testes, histórico de releases ou evidências.

## Prioridades, em ordem

1. **P0 — Fechar a próxima release web (v1.14).**
   Implementar e validar tema musical da tela inicial, sons de tiros,
   carga de plasma e explosões, alerta de integridade crítica, itens de
   cuidado dos gatos e aberturas da narrativa. Depois, revisar no
   desktop e celular e publicar somente com os checks aprovados.
   **Estado:** pendente de integração, verificação e publicação.

2. **P1 — Documentação, harness e case profissional.**
   Transformar Nova Wing em uma referência de engenharia de software
   e desenvolvimento assistido por agentes que possa ser apresentada
   a profissionais, executivos e empresas. Iniciar documentação em
   paralelo ao P0; finalizar a demonstração com evidências da release.
   **Estado:** pedido registrado na [issue #21](https://github.com/trucco86/nova-wing-3d/issues/21),
   materiais e demonstração ainda pendentes.

3. **P1 — Qualidade contínua e rastreabilidade.**
   Preservar regressões de teclado/toque, gameplay, saves, áudio,
   performance, renderização e publicação. Conectar cada requisito
   a specs, testes e evidências reais. **Estado:** responsabilidade
   permanente em cada entrega.

4. **P2 — Evolução do gameplay.**
   Refinar identidade e variedade de inimigos, chefes, progressão,
   acessibilidade dos elementos RPG e experiência de cuidado pet.
   **Estado:** melhorias incrementais após estabilizar v1.14.

5. **P3 — Plataformas nativas.**
   Adaptar recursos aprovados da web para Android e iOS; testar
   em dispositivos e preparar distribuição. **Estado:** posterior
   ao aceite web, preservando os projetos nativos existentes.

## Compromissos que não podem regredir

- Preservar a capa aprovada, o hangar 360°, os pilotos, modelos e
  cores das naves, mecânicas e checkpoints da v1.13.0.
- Bia e Jenifer têm porte semelhante; Bia é preta e Jenifer é
  cinza. Christopher e Bob são pretos e têm porte parecido,
  mas Christopher tem a cabeça maior. Calvinho é pequeno,
  preto e de pouco pelo.
- Marvin é o pitbull marrom e branco de focinho rosa e olhos
  cor de mel esverdeados. Ele é o último chefe.
- Na história pública, Marvin roubou suprimentos dos gatos.
  O esquadrão vai persegui-lo até a galáxia mais distante,
  sem divulgar a quantidade interna de fases.
- Publicação web tem prioridade sobre distribuição Android/iOS.
- Nunca marcar uma entrega como concluída sem validação real.

## P1 — Entregáveis do case profissional

- **Produto:** README executivo, proposta do jogo, controles,
  galeria de capturas reais, visão do roadmap e instruções de jogo.
- **Engenharia:** arquitetura, mapa de módulos, decisões técnicas
  (ADRs), limites, trade-offs e instruções de execução local.
- **Harness:** guia reproduzível de AGENTS.md, specs, skills,
  ferramentas, testes, CI, gates e proteção de release.
- **Rastreabilidade:** demonstrar um pedido real evoluindo de
  requisito para spec, código, testes, PR, CI e release.
- **Apresentação:** case executivo de cinco minutos, deep dive
  técnico de 15–20 minutos, roteiro de demo, FAQ e materiais
  visuais; versão em inglês em uma etapa posterior.
- **Publicação segura:** link público estável para jogo, código
  e evidências, com verificação de licenças e atribuições.

Detalhes e critérios de aceite: [issue #21](https://github.com/trucco86/nova-wing-3d/issues/21).

## Regras para mudar o estado

- P0 só termina após integração, CI, teste de navegador e
  publicação verificada.
- O case P1 precisa de evidências reproduzíveis e uma demonstração
  real, sem números ou ganhos de produtividade inventados.
- Bugs bloqueantes, perda de save ou regressão grave assumem
  prioridade sobre melhorias estéticas e novas features.
