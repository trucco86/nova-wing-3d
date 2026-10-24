# SonarQube Cloud — implantação de qualidade

**Situação:** integração pendente. Nenhum resultado de SonarQube deve ser exibido como aprovado antes de existir projeto e análise reais. O README mostra um selo cinza de configuração pendente.

## Ativação segura

1. Conectar o repositório `trucco86/nova-wing-3d` à organização no **SonarQube Cloud** (antigo SonarCloud).
2. Confirmar a chave real do projeto e a organização (não presumir que sejam iguais ao usuário do GitHub).
3. Criar o secret `SONAR_TOKEN` no GitHub Actions; nunca armazenar o token em arquivo versionado.
4. Configurar `sonar.projectKey`, `sonar.organization` e `sonar.sources=src,tools` no arquivo `sonar-project.properties` após confirmar os identificadores reais.
5. Configurar exclusões para `index.html` (bundle gerado), `node_modules`, relatórios e artefatos. Configurar cobertura somente se houver relatório LCOV válido; não inventar cobertura.
6. Adicionar a execução do scanner SonarQube Cloud ao CI com permissões mínimas; PRs externos não devem receber secrets.
7. Após a primeira análise bem-sucedida, ativar o Quality Gate no SonarQube Cloud e configurar o status check no GitHub; então substituir o selo pendente pelos badges reais de Quality Gate, bugs, vulnerabilidades e code smells.

## Critérios de aceite

- Scanner executa em `main` e PRs confiáveis com autenticação segura.
- Quality Gate verifica código novo, sem resultados fictícios.
- Check de Sonar aparece no GitHub e bloqueia merge se a política exigir.
- Badges do README apontam para o projeto real, não para URLs presumidas.

**Importante:** os checks `quality` e `browser` existentes permanecem obrigatórios. SonarQube complementa, não substitui, os testes funcionais.
