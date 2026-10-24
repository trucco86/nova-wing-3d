# SonarQube Cloud — plano de integração incremental

**Estado atual: não conectado.** Não existem chave de projeto, organização e token verificados neste repositório. O scanner e os badges reais ainda não estão ativos.

## Estratégia de desempenho e segurança
1. Criar ou conectar o projeto no SonarQube Cloud com a organização e a chave reais; habilitar análise de PR.
2. Guardar `SONAR_TOKEN` nos secrets do GitHub; não commitar nem exibir credenciais.
3. Adicionar job `sonar` independente de `quality` e `browser-shard` no workflow, usando cache do scanner; evitar instalar Playwright no job Sonar.
4. Executar o scanner em PRs de branches confiáveis e em `main`. PRs de forks sem segredo devem falhar de modo controlado ou pular a análise conforme política definida, sem expor token.
5. Observar pelo menos algumas execuções reais: duração, falhas, cobertura importada, falsos positivos e comentários em PR.
6. Após baseline e regras acordadas, tornar o Quality Gate obrigatório em branch protection. Não substituir os checks `quality` e `browser`.
7. Substituir o badge cinza provisório por badges oficiais do projeto apenas após a primeira análise validada.

## Métricas
Registrar duração do job Sonar, duração total da CI, taxa de falhas e findings relevantes. A análise paralela reduz o caminho crítico **quando o job Sonar termina antes dos demais**; não é garantia de tempo zero.

## Dependências para ativação
- Organização SonarQube Cloud e project key válidas.
- `SONAR_TOKEN` configurado como secret.
- Confirmação do perfil de qualidade e da política para PRs externas.

Sem essas informações, não inventar URLs de projeto nem declarar Quality Gate integrado.
