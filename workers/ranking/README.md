# Nova Wing Ranking Worker — código preparatório

**Não publicado.** Esta pasta contém uma implementação inicial e intencionalmente somente de leitura da API Cloudflare, sem endpoints de escrita de score. Não confundir com o Cloudflare **Pages** do jogo, que já está publicado em DEV/HML.

## Módulos

- `src/index.js`: rotas `/v1/health`, `/v1/leaderboard`, `/v1/me` e respostas fechadas para `/v1/runs/*`.
- `src/firebase-jwt.js`: valida assinatura RS256 do Firebase ID token contra chaves públicas Google, projeto, emissor e limites temporais.
- `migrations/0001_initial.sql`: esquema relacional inicial para jogadores, temporadas, runs, resultados e leaderboard.
- `wrangler.example.toml`: template **não funcional** até registrar conta, criar banco DEV, inserir ID real e decidir o hostname da API.
- `../../tests/ranking-worker.test.mjs`: testes Node sem recurso Cloudflare e sem chamadas reais ao Google.

## Rodar o teste local

```sh
node --test tests/ranking-worker.test.mjs
```

## Habilitação futura de DEV — não executar antes de segurança e revisão de custos

1. Criar um Worker dedicado e um banco D1 DEV na conta Cloudflare; não reutilizar os projetos de produção.
2. Copiar o template para uma configuração específica de DEV, preencher exclusivamente o identificador do D1 e aplicar migrations primeiro no D1 local; avaliar constraints e índices.
3. Reproduzir os testes de JWT, falha externa, SQL parametrizado, isolamento de contas, abuso e confidencialidade. Adicionar rate limit, auditoria e moderacão de nickname.
4. Só publicar Worker quando for segura a autenticação e a observabilidade do serviço. Não abrir `runs/start` ou `runs/finish` até concluir verificação autoritativa.
5. Integrar opcionalmente o frontend sem bloquear gameplay/offline. Configurar `FIREBASE_PROJECT_ID` e `ALLOWED_ORIGINS` por ambiente.

**Não registrar secrets nem tokens** em `wrangler.example.toml`, documentação ou frontend. Configurações prod e DB prod devem ser independentes.
