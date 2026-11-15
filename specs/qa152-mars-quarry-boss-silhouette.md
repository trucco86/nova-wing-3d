# QA152 | Silhueta industrial do chefe de Marte

## Evidência
Screenshot real de gameplay `unique-boss-stingray-mobile.png`, QA149,
workflow 43764773319, artefato browser-evidence-4. Mesmo após a marcha
das seis pernas e a mudança do nome para COLOSSO DAS DUNAS, a base ainda
desenha vinte peças de asas de nave compartilhadas com a Fênix Solar.
Isso deixa o chefe da fase 2 visualmente semelhante aos demais.

## Mudança
- Separar `case 'stingray'` de `case 'phoenix'` no modelo base.
- Marte deixa de criar 20 peças de asas de nave e passa a usar sete peças
  industriais compactas em corpo, carapaça, suportes e perfurador.
- Preservar a identidade seis pernas, animações QA149, armas, baterias reais
  e dois padrões de ataque aprovados. A Fênix não muda.
- Reduzir objetos potencialmente renderizados no chefe, sem novos materiais,
  texturas, efeitos de partículas ou hitboxes.
- A organização industrial deve ficar visível na screenshot de boss do
  Playwright; evitar braço atravessando chão, sobreposição do casco à mira
  e oclusão dos geradores atingíveis.

## Gates
Build/validate/CI FULL 4 shards, inspecionar screenshots comparativas
do chefe da QA149 e QA152 e rodar em dispositivo mobile. Não publicar
antes de validar a cadeia QA138-151 e os testes de performance #387.
