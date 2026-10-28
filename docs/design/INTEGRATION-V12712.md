# Nova Wing 1.27.12 — Integração isolada de IA física e Órbita-9

Base: PR #145 (dez assinaturas de chefes e exploração 3D) e PR #146 (IA física, câmera tática, RPG e dano).

## Contratos preservados

- Assinaturas dos dez chefes de #142, com animações de asas, cauda, íris e baterias, somadas à IA física e mandíbula articulada de #146.
- Câmera superior somente na missão tática com nave visível e controle do jogador em X/Z, sem alternâncias arbitrárias na campanha.
- Plasma Titan 8 segundos; Five Cats Overdrive 10 segundos; Barreira 12 segundos; Estase 11 segundos; dano especial medido separadamente dos tiros comuns.
- Investigação Órbita-9 acessível somente via Developer/QA, sem gravar save ou afetar ranking remoto.
- DEV homologada, HML e produção continuam inalteradas. **Candidata não homologada.**

## Build reprodutível

O fluxo `.github/workflows/integration-compile.yml` regenera exclusivamente `index.html` em sua branch isolada e registra o bundle em novo commit. CI exige `npm run build:check` no SHA final.

## Gates de aceite

1. Dez bosses em Developer/QA: 4 ataques físicos e 6 assinaturas próprias; movimento, telegráfico, esquiva e origem de tiros.
2. Damage balance: Plasma, Five Cats, carcaça versus geradores, duração do shield e cooldowns.
3. Câmera: controle, visibilidade da nave e transição apenas com propósito tático.
4. Órbita-9: SAIR, scanner, três pistas, escolha com NPC e combate; nenhum save/ranking remoto.
5. Playwright mobile retrato/paisagem, performance WebGL, source repair, CI completa e avaliação humana antes de DEV.

## Evidência de integração (2026-10-28)

- Código-fonte combinado no commit `dcdaefb`: IA física, 10 chefes, RPG estendido e investigação 3D.
- Bundle compilado e com commit pelo workflow isolado: execução [40786736890](https://github.com/trucco86/nova-wing-3d/actions/runs/40786736890), resultado **success**.
- O commit automático `366ced0` contém o `index.html` reconstruído.
- As execuções da CI da PR após o commit do bot foram marcadas `action_required`, **sem jobs iniciados**. Isso não é teste aprovado; o gate precisa ser executado no novo SHA e revisado.
- A homologação de gameplay/mobile permanece pendente; nenhum deploy em DEV, HML ou produção foi autorizado.
