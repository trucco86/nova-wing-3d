# Nova Wing Graphics 6.0 — validação visual de fidelidade premium

**Candidata QA:** 1.27.30 · [PR #179](https://github.com/trucco86/nova-wing-3d/pull/179) · base #178 Graphics 5.0. **Não é produção.**

## Como avaliar a diferença real

1. Abra [o preview isolado Graphics 6.0](https://pr-179.nova-wing-preview.pages.dev/).
2. Vá a CENTRAL → OPÇÕES → GRÁFICOS → **Alto**. Selecione a nave no **Hangar 360°** e compare a leitura de pintura, refletores, cockpit e motores nos quatro ângulos.
3. Jogue a fase 1 e use BOOST. Observe os **dois núcleos de plasma, halo e rastro**: o brilho e alongamento devem reagir visivelmente ao impulso sem cobrir a mira.
4. Transforme a nave em robô e repita o BOOST; os dois escapes dorsais devem permanecer alinhados sem alterar braços/canhões.
5. Chegue à órbita/nave-mãe. O Devastador no Alto precisa ter **casco afilado, asas enormes e chanfradas, cockpit e hangar brilhante**, sem os blocos do modelo antigo atravessando a silhueta. O chefe precisa continuar saindo do hangar.
6. Alterne para **Médio** e confirme que o casco clássico do Devastador volta, o plasma adicional e os reflexos de estúdio desaparecem, e o mesmo gameplay continua.
7. Repita no desktop 1366×768 e celular 844×390, capture imagens com mesmo ângulo e registre FPS e frame-time reais por 30 segundos para Alto/Médio, inclusive aquecimento/temperatura.

## Qualidade e liberação

- [ ] 379 testes unitários, format/lint/validate, Build Check e Source Repair aprovados **no SHA final**.
- [ ] Quatro shards Playwright aprovados no SHA final.
- [ ] Cloudflare preview isolado publicado e sincronizado com bundle.
- [ ] Revisão visual humana e prova de FPS real nas máquinas-alvo.
- [ ] Backlog de GLB autoral, atlas UV/ORM, LOD, partículas de impacto e iluminação dos demais setores continua P0.

**Importante:** iluminação via PMREM é gerada no navegador uma vez; não é um HDRI fotográfico licenciado. O perfil Médio não faz render PMREM. A implementação eleva a apresentação, mas **não é paridade integral** com a imagem-conceito aprovada.
