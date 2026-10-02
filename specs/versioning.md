# Versionamento das entregas

A versão MAJOR.MINOR.PATCH em package.json identifica a entrega. Lockfile,
CHANGELOG, notas em releases/ e versão visível na capa devem concordar.
Mudanças distribuídas em src/, index.html ou no build exigem incremento
em relação à base do PR ou ao commit anterior de main.

## Critérios de aceite

- O gate rejeita lockfile divergente, notas ausentes e capa desatualizada.
- O build injeta a versão a partir de package.json.
- A CI publica a release e tag somente depois de qualidade, navegador e Pages.
- Releases existentes são preservadas; correções recebem uma nova versão.
- A primeira release formal é v1.4.0; versões anteriores não recebem tags retroativas.
