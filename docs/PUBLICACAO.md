# Publicação e recuperação

## GitHub

O repositório exporta fonte, testes, documentação e HTML gerado. `npm run build` atualiza `index.html`; `npm run validate` confirma consistência. Faça commit de ambos antes do push.

O workflow CI executa em pushes para `main`, pull requests e disparo manual. Consulte a execução associada ao commit final, não apenas um resultado antigo. A disponibilidade de Actions e regras de branch depende da conta e das configurações do repositório.

## Exigir validações para merge

Nas configurações de regras/proteção da branch `main`, exija pull request e checks `quality` e `browser`. Selecione os checks depois de uma execução que os registre. Configure revisores de acordo com a equipe real; exigir revisão de uma única pessoa que também cria os commits pode bloquear o fluxo.

A presença de CODEOWNERS e do workflow não ativa essas regras automaticamente. A CI tem permissões de leitura e não instala regras administrativas.

Referência: [branches protegidas](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).

## Hospedagem estática

O arquivo `index.html` contém código, estilos e retrato. O GitHub Pages deve usar **GitHub Actions** como fonte. O job `pages` depende do job `browser`, que depende de `quality`; apenas depois dos testes o HTML e as licenças são enviados à hospedagem. `.nojekyll` evita processamento Jekyll. Habilitar Pages torna o jogo acessível conforme as regras do serviço: é uma decisão de publicação distinta do upload do código.

A versão já hospedada em Sites continua sendo uma entrega separada. Push no GitHub não a atualiza automaticamente. Não copie configuração privada de Sites para este repositório.

## Recuperação

Prefira `git revert` do commit problemático, execute build e validação, e publique o novo commit. Não use force push para esconder histórico. Para recuperar uma entrega anterior, faça checkout do commit conhecido em uma pasta isolada e execute `npm ci` seguido de `npm run build:check`.

Não versione segredos ou relatórios locais. O arquivo de lock permite reinstalar as versões utilizadas; ele não garante disponibilidade futura dos serviços externos.

### Concorrência de validação

Cada PR mantém um grupo de execução. Um novo commit cancela a validação anterior da mesma PR, evitando testes concorrentes obsoletos e preservando os gates do commit mais recente. As entregas de `main` continuam serializadas, para impedir publicação fora de ordem.

### Prioridade web (fase de desenvolvimento)

O canal oficial está definido como `"releaseChannel": "web"` em `package.json`. Nesta fase, o CI exige **quality** e **browser** (desktop e mobile), depois publica o `index.html` testado em GitHub Pages e a release web correspondente.

Os jobs **Android e iOS ficam desabilitados por padrão**. Não exigem contas de desenvolvedor nas lojas, builds nativos, assinatura ou submissão para distribuir a web. Os projetos nativos são preservados para posterior adaptação, sem novas versões até a conclusão da experiência web.

Quando for decidido retomar Android/iOS, a opção explícita de reativação do pipeline é a variável do repositório `NOVA_BUILD_NATIVE=true`, sujeita a nova revisão dos testes e configuração nativa. Não reative essa opção durante os ciclos de experimentação da versão web.


### Preparação da release v1.15

Antes da revisão final, a branch recebe um commit sincronizado com formatação e o HTML
produzido por `npm run build`. A CI normal **continua somente leitura**: executa
`npm run validate`, incluindo `format:check`, `build:check` e browser tests.
O commit de sincronização não autoriza merge: a PR requer checks verdes no SHA
final. Se a automação de preparação falhar, não publique uma versão com bundle antigo.
