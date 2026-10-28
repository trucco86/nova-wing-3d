# Five Cats Universe — Fundação de exploração e missões

**Status da PR de implementação:** primeiro protótipo 3D jogável **exclusivo do modo Developer/QA**; aguardando build, Playwright e avaliação humana. A PR de domínio #143 contém apenas os contratos de quest e persiste sem interface. Esta PR está empilhada sobre #143, sem alterar a DEV homologada.

## O primeiro mistério: Sinais de Órbita-9

Bia e os Five Cats saem da nave-mãe e investigam uma estação abandonada. Para descobrir a Rota Fantasma de Órion, devem recuperar **três pistas**: transmissão de socorro, mapa do reator e baliza danificada. Só depois um sobrevivente apresenta duas escolhas: restaurar energia ou seguir uma rota clandestina. A escolha desbloqueia um combate; a vitória revela um planeta novo e permite resgatar uma recompensa **uma única vez**.

## Regras implementadas em `src/exploration-quests.js`

- Grafo de quatro destinos, incluindo uma base, região investigável, missão de combate bloqueada e planeta desbloqueável.
- Coleta de pistas válida somente na região correta; IDs desconhecidos e duplicatas são rejeitados.
- Diálogo de escolha exige as três pistas, não pode ser revertido sem um novo save e controla o desbloqueio de rota.
- Missão exige rota e vitória; derrota não desbloqueia planeta; recompensa sem duplicação.
- Normalização de estados inválidos, saves antigos ou corrompidos; não aceitar flags incoerentes.
- Persistência usa **somente** `nova-wing-3d-exploration-v1`; checkpoint `nova-wing-3d-v1` da campanha existente não é modificado.
- Sessões Developer/QA impedem gravações de progresso; nenhuma dependência de Firebase, ranking ou D1.

```mermaid
flowchart LR
  BASE["Nave-mãe Five Cats"] --> ORBIT["Explorar Órbita-9"]
  ORBIT --> CLUES["3 pistas"]
  CLUES --> NPC["Sobrevivente · decisão"]
  NPC -->|desbloqueado| FIGHT["Combate da Rota Fantasma"]
  FIGHT -->|vitória| PLANET["Planeta dos Arquivos"]
  PLANET --> REWARD["Recompensa única"]
```

## Vertical slice 3D implementada nesta candidata

- **Acesso:** Developer/QA → _EXPLORAR ÓRBITA-9 · PROTÓTIPO 3D_, somente DEV e URLs de preview.
- **Ambiente:** corredor de estação orbital em Three.js, com iluminação, avatar felino provisório, três sinais identificáveis e holograma do sobrevivente.
- **Movimento:** WASD, setas e direcional mobile; câmera acompanha o personagem.
- **Investigação:** procurar três terminais luminosos e usar SCAN/E quando próximo. O painel superior apresenta o progresso.
- **Diálogo:** encontrar o sobrevivente e escolher restaurar energia ou rota clandestina.
- **Transição:** a escolha libera um chefe da Órbita-9 pelo sistema Developer/QA do jogo existente.
- **Isolamento:** o protótipo não grava em localStorage, não autentica e não publica resultados de ranking. Fechar e reabrir reinicia as pistas.
- **Qualidade:** testes Playwright desktop/mobile foram criados para pistas, conversa, gate e controles, mas precisam de execução com evidência.

**Ainda não implementado:** mundo aberto planetário, múltiplos cenários exploráveis, combate físico fora da nave, NPC com IA, modelos 3D premium, recompensa após retornar de uma missão, save persistente de exploração ou integração da campanha narrativa. Estes tópicos continuam no épico #139.

## Próxima entrega funcional do vertical slice

1. Criar uma área navegável da estação usando a renderização Three.js, com colisão e câmera própria.
2. Ligar os três itens investigáveis ao `inspectEvidence`, com feedback e diário.
3. Interface de interação do sobrevivente, com escolhas e consequência visível.
4. Implementar transição exploração → fase existente usando `canTravel`, e retorno.
5. Usar save próprio, rollback, QA state injection sem writes e testes Playwright.
6. Homologar desktop/mobile em preview. Promover a DEV apenas após aceite.

**Referência de backlog:** [épico #139](https://github.com/trucco86/nova-wing-3d/issues/139).

## Evidência de qualidade

Testes em `tests/exploration-quests.test.mjs`: desbloqueio condicional, rejeição de IDs inválidos, decisões imutáveis, recompensa idempotente, recuperação de JSON corrompido e separação do save legado. O módulo é puro JavaScript, sem mockar o sistema de arquivo do jogo.

A branch não altera produção, HML nem DEV.
