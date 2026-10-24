# Diagramas de arquitetura e CI/CD

Fonte: `package.json`, `.github/workflows/ci.yml`, `src/`, `tools/` e `capacitor.config.json`. O README contém os diagramas Mermaid renderizados; este documento explica as fronteiras.

## Stack

- **Interface e runtime:** HTML, CSS, JavaScript ES Modules; Three.js/WebGL para renderização, Web Audio API para áudio, localStorage para checkpoints.
- **Empacotamento:** esbuild produz o `index.html` que é publicado no GitHub Pages e incorporado ao Capacitor.
- **Plataformas:** navegador web primeiro; Android WebView e iOS WKWebView via Capacitor 8, com builds nativos opt-in.
- **Validação:** Prettier, ESLint, Node test runner, invariantes de repositório e Playwright Chromium.

## Pipeline real

1. Push e PR acionam `CI`.
2. `quality` executa `npm run validate` e guarda evidências.
3. `browser-shard` distribui Playwright em quatro shards e guarda capturas e relatórios.
4. `browser` consolida resultados; os checks obrigatórios são `quality` e `browser`.
5. Somente `main` executa `pages` após sucesso de `browser`.
6. `release` publica uma versão depois de `pages`; builds nativos são condicionados à variável `NOVA_BUILD_NATIVE`.

**Limites:** um badge de CI verde reflete apenas a execução de GitHub Actions; não garante homologação em aparelho real. SonarQube Cloud não está integrado enquanto projeto e credenciais não forem configurados.
