# QA159: compartilhamento de geometria e material dos holofotes da Cidade 3.2

## Contexto

A QA158 já agrupou os suportes estáticos em um InstancedMesh. Ainda restava
uma nova SphereGeometry idêntica criada para cada um dos seis holofotes e
novos materiais para cada reconstrução independente do setor.

## Contrato

- Uma única geometria imutável de lâmpada (raio 2,2, 9 por 7 segmentos)
  é compartilhada por todas as seis lâmpadas e por outros mundos construídos
  pela mesma sessão.
- Seis materiais são compartilhados por índice de cor original. As cores,
  iluminação, transparência, posições de telhado, feixes móveis, animação,
  pausa e alternância Medium/High não mudam.
- Nenhuma alteração em hitboxes, navegação, pontuação, RPG, HUD ou gameplay.
- No mundo individual, passar de seis buffers de geometria esférica idênticos
  para um elimina cinco geometrias duplicadas. Uma segunda construção
  independente reutiliza também os materiais, sem novos buffers.
- A cidade distante clonada já compartilhava a geometria por clone; não
  contabilizar novamente essa economia.
- Não afirmar melhora de FPS: medir em iPhone real e comparar 35s na fase 1
  com a baseline de 34 FPS, p95 39ms e 837 geometrias da v1.27.141.

## Gates

1. Node: `tests/qa159-city32-searchlight-resource-sharing.test.mjs`, testes
   de Cidade 3.2, QA158 e orçamento gráfico.
2. `npm run release:prepare -- 1.27.153`, format, build e validate em CI,
   mesmo SHA, com HTML versionado sincronizado.
3. Seis shards browser FULL e evidência de que o menu, HUD e gameplay seguem
   íntegros.
4. Homologação visual e benchmark físico permanecem pendentes. Manter PR Draft,
   sem merge ou deploy até revisão e aceite.

## Evidência intermediária, não é aceite de produção

- Workflow [Sync generated web #44433149889](https://github.com/trucco86/nova-wing-3d/actions/runs/44433149889): sucesso em `release:prepare`, Prettier, build e `npm run validate` após a correção do ESLint no teste QA159.
- O SHA gerado pelo bot sincroniza o HTML e os metadados da candidata 1.27.153. Exigir novamente os checks da PR no HEAD final, inclusive Playwright 6/6, antes de qualquer merge.
- Nenhuma medição de desempenho em iPhone ou comparação de screenshots foi feita nesta etapa.
