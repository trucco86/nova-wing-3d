# Release readiness — Nova Wing Five Cats (31/10/2026)

> Documento de critérios; não é prova de implementação, merge, publicação ou homologação.

## Gate P0: diagnóstico de gameplay

- [ ] Reproduzir e diagnosticar falha WebGL da [PR #191](https://github.com/trucco86/nova-wing-3d/pull/191).
- [ ] Reproduzir e diagnosticar teste de boost/recarga no desktop e touch.
- [ ] Corrigir causa-raiz sem elevar timeouts como substituto de correção.
- [ ] Rodar quality, unit, build e 4/4 Playwright no mesmo SHA.

## Gate P0: integração

- [ ] Conciliar #188 → #189 → #190 → #191 sem commits duplicados.
- [ ] Integrar abertura Five Cats (#173), combate, mecha, troféus e patentes em branch candidata.
- [ ] Testar persistência, controles mobile, áudio, progressão e transição de fases.

## Gate P0: menu fullscreen

- [ ] Arte desktop 16:9 com cobertura total e focal point ajustado.
- [ ] Arte mobile 9:16 com enquadramento próprio; não apenas crop de desktop.
- [ ] Usar imagem responsiva, safe-area e botões sem sobreposição.
- [ ] Capturas de 390x844, 430x932, 1366x768 e 1920x1080.
- [ ] Verificar carregamento e contraste; aprovação visual do mantenedor.

## Promoção e rollback

- [ ] DEV: registrar commit, CI e URL.
- [ ] HML: publicar SHA integrado e realizar smoke desktop/mobile.
- [ ] Registrar aceite explícito do mantenedor para essa versão.
- [ ] Produção: exigir checks obrigatórios, release identificada, GitHub Pages e plano de rollback testado.

## Histórico

- [PR #46](https://github.com/trucco86/nova-wing-3d/pull/46): avaliar analógico contra controles atuais antes de encerrar.
- [PR #51](https://github.com/trucco86/nova-wing-3d/pull/51): avaliar paletas contra Graphics 3.4.
- [PR #52](https://github.com/trucco86/nova-wing-3d/pull/52): protótipo inicial; não inferir aceite de melhorias posteriores.

## Evidências mínimas por release

| Item | Valor |
| --- | --- |
| SHA integrado | Pendente |
| CI / 4 shards | Pendente |
| URL DEV / HML | Pendente |
| Evidência de smoke | Pendente |
| Aceite do mantenedor | Pendente |
| SHA e run Pages PROD | Pendente |
