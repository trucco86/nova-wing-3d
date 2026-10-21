# Roadmap de produto, qualidade e apresentação

Atualizado em 21/10/2026. Este documento organiza os pedidos do mantenedor
sem substituir `specs/`, o histórico de releases ou as evidências dos testes.
**Status em execução** e **concluído** só devem ser atribuídos com evidência real
no GitHub. O jogo web v1.13.0 é a última base concluída e validada.

## Ordenação de trabalho

| Ordem | Prioridade | Entrega | Estado / contrato |
| --- | --- | --- | --- |
| 1 | P0 — release atual | v1.14 web: trilha da tela inicial; efeitos menos irritantes de disparo, carga de plasma e explosão; alerta de escudo crítico; coletáveis pet (latinha, petiscos, brinquedos, areia); narrativa de introdução e campanha | **Pendente de integração e validação**, em branch de desenvolvimento; sem publicação |
| 2 | P1 — estratégico, em paralelo | **Documentação e harness demonstráveis; transformar Nova Wing em um case profissional para compartilhar com pessoas e empresas** | [Issue #21](https://github.com/trucco86/nova-wing-3d/issues/21); planejamento registrado, implementação documental e demonstração pendentes |
| 3 | P1 — qualidade contínua | Testes reais de desktop/mobile, regressão de controles, performance e UX, rastreabilidade dos requisitos e evidências por release | Atividade recorrente; não trocar checks reais por asserts artificiais |
| 4 | P2 — próxima evolução de jogo | Refinar chefes, progressão e identidade dos inimigos; consolidar narrativa, cuidado dos pets, mecânicas RPG e acessibilidade do HUD | Evolução incremental após estabilizar v1.14 |
| 5 | P3 — outras plataformas | Propagar somente mecânicas aprovadas da web para Android e iOS; testar em aparelhos e organizar distribuição | Posterior ao aceite web; apps já possuem bases existentes |

## O que preservar sempre

- Arte da capa aprovada e caracterização dos Five Cats: Bia e Jenifer de tamanho
  semelhante (preta e cinza); Christopher e Bob pretos, de porte parecido,
  com cabeça maior de Christopher; Calvinho preto, pequeno e de pouco pelo.
- Marvin é um pitbull marrom e branco, de focinho rosa e olhos mel-esverdeados,
  vilão final da campanha. A história pública fala da perseguição para recuperar
  o que ele roubou, sem revelar contagem interna de fases.
- Hangar 360°, modelos e cores de nave, câmeras, combate, missões, saves,
  compras com créditos fictícios, música e mecânicas da versão publicada.
- Web como plataforma prioritária, seguida por validação de Android/iOS.
- Não declarar uma release publicada com base apenas na criação de branch ou PR.

## P1: case de referência — entregáveis

O objetivo não é somente escrever mais documentação, e sim tornar o projeto
**reproduzível e apresentável como demonstração real de desenvolvimento
assistido por agentes**.

1. **Documentação de produto:** um README inicial objetivo, capturas reais,
   mecânicas verificadas, instruções para jogar e visão do roadmap.
2. **Documentação técnica:** arquitetura, mapa de módulos, trade-offs,
   persistência, contratos de áudio/câmera/controles e ADRs.
3. **Harness reproduzível:** ligar `AGENTS.md`, `specs/`, `skills/`,
   `tools/`, `tests/` e CI num fluxo que outro desenvolvedor reproduz.
4. **Case ponta a ponta:** mostrar um pedido real transformado em spec,
   código, testes, evidências visuais, PR, gates e release; explicitar onde
   houve validação humana e quais etapas não são autônomas.
5. **Material de apresentação:** narrativa executiva de cinco minutos,
   deep dive técnico de 15–20 minutos, demo curta, FAQ e versão em inglês
   posteriormente, com dados medidos e sem métricas inventadas.
6. **Publicação e licenças:** página/índice público com links estáveis,
   verificação de direitos, atribuições e revisão de segurança.

O detalhamento, os critérios de aceite e o checklist vivo estão na
[Issue #21](https://github.com/trucco86/nova-wing-3d/issues/21).

## Regras de promoção entre prioridades

- Fechar P0 só após integração, validação com navegador e publicação verificadas.
- Trabalhar a documentação P1 em paralelo quando não bloquear o P0.
- Publicar o case somente com capturas, números e logs que comprovem as alegações.
- Revisitar a ordem se surgirem bugs que impeçam jogar, perdas de save,
  problemas de publicação ou falhas graves de acessibilidade.
