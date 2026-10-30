# Graphics 3.0 — roteiro de homologação visual (v1.27.27)

Candidata empilhada na PR #176 sobre a Graphics 2.0 (#175). Esta verificação não autoriza promoção para DEV, HML nem produção.

## Cenários para comparar no mesmo dispositivo

1. Em **CENTRAL → OPÇÕES**, selecionar **Médio** e iniciar **Cidade das Máquinas**. Registrar captura e o monitor de FPS durante 30 segundos.
2. Repetir com **Alto**: conferir placas metálicas nas fachadas, terraços, aletas e iluminação adicional, com as mesmas posições de prédios.
3. Conferir a **NOVA-7**, a **Specter** e a **Aegis**: painéis, dutos, linhas luminosas e detalhes de turbina devem aparecer somente no Alto.
4. Conferir a nave-mãe e o hangar de lançamento do chefe; validar silhueta, contraste, profundidade e se os pontos fracos permanecem legíveis.
5. Testar desktop 1366×768 e celular paisagem 844×390; também abrir o menu em retrato 390×844.
6. Alternar Alto → Médio durante a partida; os detalhes devem desaparecer sem alterar vida, pontuação, mira, controles, física ou checkpoint.
7. Observar travamentos, aquecimento, consumo de memória, falhas WebGL, cintilação, superexposição de bloom e qualquer elemento cobrindo a mira.

## Aprovação

- [ ] CI quality verde no SHA final
- [ ] Quatro shards Playwright verdes no SHA final
- [ ] Preview Cloudflare publicado no SHA final
- [ ] Capturas reais Alto/Médio e frame-time/FPS por 30 segundos
- [ ] Aceite humano desktop/mobile

**Limite visual:** detalhes procedurais premium não substituem modelos 3D autorais, texturas PBR completas, LOD e iluminação cinematográfica. O nível da arte-conceito continua sendo a meta, não uma alegação de qualidade já alcançada.
