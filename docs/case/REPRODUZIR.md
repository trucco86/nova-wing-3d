# Guia de reprodução e demonstração

Este roteiro ajuda alguém externo a **experimentar, investigar e verificar** o projeto. Comandos listados são instruções, não uma alegação de execução nesta revisão documental.

## Pré-requisitos

- Node.js 24 (referência de desenvolvimento; `package.json` informa mínimo suportado).
- npm e Git.
- Chromium/Playwright para a suíte de navegador, WebGL no equipamento.
- Acesso ao repositório; não é necessário token para ler o código público.

## Reproduzir localmente

```bash
git clone https://github.com/trucco86/nova-wing-3d.git
cd nova-wing-3d
npm ci
npm run build
npm run dev
```

Acesse o endereço local exibido pelo servidor. Para validar:

```bash
npm run check:repo
npm run format:check
npm run lint
npm test
npm run build:check
npx playwright install chromium
npm run validate -- --browser
```

A suíte browser requer ambiente gráfico compatível; a instalação de dependências de sistema pode variar conforme sistema operacional. Em CI, veja a [configuração oficial](../../.github/workflows/ci.yml). **Não executar `npm run build` sobre trabalho não commitado sem revisar alterações geradas.**

## Caminho de evidência de cinco minutos

1. Abra [demo web](https://trucco86.github.io/nova-wing-3d/) e teste movimento, tiro, pausa, intro, hangar e som.
2. Localize `src/game.js` e a separação de entrada, som, cena e campanha.
3. Abra a [spec de UX mobile](../../specs/web-v1-15-hud-settings.md) e os [testes correspondentes](../../tests/web-v1-15.test.mjs).
4. Inspecione o [PR #24](https://github.com/trucco86/nova-wing-3d/pull/24) e os diffs.
5. Confirme a [CI do commit de referência](https://github.com/trucco86/nova-wing-3d/actions/runs/39591873578). Compare **SHA e conclusão**.
6. Consulte a [arquitetura do processo](ARQUITETURA-DO-CASE.md) e a [proposta de handoffs](PAPEIS-E-HANDOFFS.md).

## Se algo falhar

- Browser abre sem 3D: verificar compatibilidade WebGL, aceleração gráfica e console.
- Som não inicia: interação real é necessária para desbloqueio de Web Audio; não confundir bloqueio do navegador com falha de conteúdo.
- Teste local diverge do CI: comparar versão Node, npm lockfile, viewport, browser e SHA.
- Links de Actions expirados: usar SHA, spec, PR e changelog como índice e executar novamente.
- Não usar force push para esconder o estado anterior; veja [publicação e rollback](../PUBLICACAO.md).

## Reprodutibilidade e limites

O repositório tem fonte, lockfile, scripts e testes. Isso favorece reprodução, mas **não garante ambientes idênticos** em qualquer dispositivo, horário ou GPU. Logs devem incluir sistema, commit e comando para comparação.

[Case](README.md) · [Matriz de evidências](EVIDENCIAS.md).
