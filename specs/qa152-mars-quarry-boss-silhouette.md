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


## Revisão após a screenshot real da QA152
O primeiro screenshot da QA152 (workflow visual focado 43772568236) ainda
parecia uma nave de asas horizontais, com apenas 0.250/255 de diferença
média por canal contra a QA149 na cena 844x390. Análise de código revelou
mais duas heranças do Stingray:
- As pinças `signature-stingray-scissor-*` permaneciam largas e quase planas.
- A anatomia orgânica usava escala [1.65, 0.55, 1], achatando o robô.

Ajustes de segunda iteração:
- Reorientar somente os dois conjuntos já existentes de pinças para
  9x21x22, presos a posições inferiores da carapaça.
- Mudar anatomia para [0.92, 1.22, 1.04], alongando o tórax.
- Elevar carapaça e visor, e transformar as seis placas térmicas já
  existentes em chaminés hidráulicas verticais; nenhum objeto novo.
- Preservar nomes de ataque `stingray-*` para compatibilidade com a
  física/radar, mas não reutilizar a silhueta de uma arraia.
- Repetir screenshot comparativa 844x390, não considerar apenas o teste Node.
