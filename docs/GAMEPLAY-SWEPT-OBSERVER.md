# Detector de atravessamento entre amostras

Protótipo consultivo que complementa o detector de penetração da PR #446. Usa o segmento entre posições consecutivas da nave em coordenadas relativas a um volume sólido AABB móvel. Identifica cruzamentos completos candidatos, inclusive quando os extremos estão fora do obstáculo.

Exclui sólidos inativos, mudanças de tamanho, saltos grandes de cenário, amostras descontínuas e estados fora do voo. Guarda posições, instantes e volumes anteriores e posteriores; deduplica achados.

Limites: depende da ordem estável dos colliders urbanos e de interpolação linear entre amostras. Pode confundir desvios legítimos do motor com atravessamento. Não comprova colisão de malha, nem cobertura de toda a campanha. Limiares ainda precisam ser calibrados. Sem pares válidos, retorna BLOCKED. Nunca autoriza release.

## Validação

`node --test tests/gameplay-swept-observer.test.mjs`

Sete testes unitários executados localmente. Integrado ao roteiro Playwright na candidata consolidada; a execução e calibração WebGL do novo SHA ainda estão pendentes. Não transformar candidatos em gates obrigatórios automaticamente.
