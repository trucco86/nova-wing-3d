# Release gate | Nova Wing 3D v1.27.108 integrada

Escopo único: PRs #317 (QA107), #318 (QA108), #316 (Control Center),
#315 (monitor 30 minutos). A candidata consolida os arquivos exatamente
destas PRs, sem alteração de requisitos de gameplay fora do escopo.

## Pipeline obrigatória

1. CI de qualidade e quatro shards browser PASS no HEAD da PR integrada.
2. Build e versionamento sincronizados: `package.json`, lockfile, Xcode,
   `index.html`, `CHANGELOG.md` e `releases/v1.27.108.md`.
3. Inspeção do diff da candidata para detectar conflitos/regressões entre PRs.
4. Preview isolado disponível antes de publicar. Nenhum merge automático.

## Homologação humana exigida

- Fase 1 desktop Alto: torre não atravessa edifício, solo acompanha skyline
  e a ascensão orbital desacelera de forma natural; sem perda do controle.
- Fase 1 desktop Médio e mobile real: cenário legível, HUD/controles não
  cobrem a gameplay, FPS aceitável e ausência de hitboxes invisíveis.
- Billboard e hovercar só bloqueiam a nave quando suas partes estão visíveis.
- Fase 3 mantém curso de rochas e subchefe; fases 2/4, loja, bosses, tiro,
  BOOST, GIRO, pausa e reinício sem regressões críticas.
- Control Center: abas, CI main SHA, erro de API e links acessíveis no celular.

Registrar equipamento/navegador, resultado e evidência. Ainda não homologado.

## Publicação

A promoção à `main` ativa GitHub Pages e o monitor agendado. Requer
autorização específica do proprietário. Após merge, confirmar o mesmo SHA
na CI `main`, sucesso do job Pages, site e painel HTTP 200, execução
`workflow_dispatch` do monitor com sucesso e ausência de alertas falsos.

Plano de rollback: preservar o SHA anterior da `main`, usar PR de reversão
dos commits desta candidata e deixar a CI Pages republish. Não fazer force
push nem fechar issues P0 sem evidência.

Dependências #317 e #318 permanecem em review até o gate visual;
#315 e #316 estão incorporadas no conteúdo desta candidata.
