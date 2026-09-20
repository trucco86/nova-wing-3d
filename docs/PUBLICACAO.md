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
