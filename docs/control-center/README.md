# Nova Wing Control Center

Painel público, responsivo e somente leitura para acompanhamento de desenvolvimento, CI, publicação e bloqueios.

## Publicação

Após merge e aprovação dos gates da branch main, o GitHub Pages publica o painel em:

https://trucco86.github.io/nova-wing-3d/control-center/

O pipeline mantém o jogo em /nova-wing-3d/ e copia este painel separadamente para /control-center/.

## Dados

O navegador consulta a API pública do GitHub para issues, PRs abertas e integradas, execuções de Actions, jobs da última CI da main, releases e SHA da main. Atualização padrão a cada 5 minutos, com controle manual. Não usa token nem expõe dados privados. O limite público da API pode restringir consultas intensivas.

O indicador Pages é baseado no job real de deploy da última CI main. O status HTTP do site de produção é verificado pelo monitor agendado, não pelo painel.

## Monitor a cada 30 minutos

O workflow `.github/workflows/nova-release-monitor.yml` está na PR #315. Ele cria ou atualiza issues com prefixo `[monitor]` quando detecta falhas, bloqueios ou conclusão de release. O Control Center exibe as issues de bloqueio abertas automaticamente.

**Dependência:** o workflow da PR #315 precisa ser integrado à main para o agendamento funcionar. A integração do dashboard não ativa o monitor sozinha.

## Testes

`node --test tests/control-center.test.mjs`

O teste é incluído na suíte existente `npm test` / `npm run validate`. Valida responsividade, estrutura de navegação, uso da API pública, ausência de token, atualização e empacotamento no GitHub Pages.

## Limitações

Não há execução autônoma de desenvolvimento: o painel é observabilidade. Dados de issues e PRs são limitados às páginas consultadas; GitHub Actions agendados podem sofrer atraso. Se a API pública estiver indisponível, o painel mantém a última leitura e apresenta aviso.
