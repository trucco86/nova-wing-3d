# Nova Wing — Localização dos troféus e das patentes

## Escopo
Complemento empilhado sobre a PR #160, que depende da #159. Cobertura de PT-BR, inglês e espanhol em 41 troféus, 12 condecorações de cada gato, dez patentes, cinco títulos coletivos, nomes e descrições das conquistas, indicadores, pop-ups, medalhas acessíveis e seleção de uniforme.

### Arquitetura
- Catálogos originais em português e IDs persistentes não foram alterados.
- `src/i18n.js` contém 146 entradas adicionais que a tradução existente aplica também aos cartões gerados dinamicamente.
- O motor `createI18n` observa mudanças de texto e idioma; mudar Options reavalia a lista sem duplicar conquistas nem editar os saves.
- Nomes próprios dos chefes ficam estáveis como identidade da campanha. Prefixos e explicações são localizados.
- Nenhuma mudança de gameplay, créditos, pontuação, combate, progressão ou banco de dados.

### Evidências e critérios de aceite
- `tests/progression-i18n-v12721.test.mjs`: títulos/descrições dos 41 troféus, 12 medalhas, patentes e estabilidade dos IDs em PT, EN e ES.
- `tests/browser/progression-i18n.spec.mjs`: mudar idioma pelo menu em viewport de 390 px, 41 cartões e 60 medalhas, títulos secretos acessíveis e retorno ao português.
- Gates: build gerado, unitários, formatação, lint, quatro shards Playwright, source-repair e deploy isolado.
- Não declarar homologação visual humana até validação do preview em dispositivos reais.
