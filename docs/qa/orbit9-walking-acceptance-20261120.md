# Órbita-9: aceite de caminhada e controles

Escopo: PR #416 empilhada na PR #415. Não altera campanha, saves nem ranking.

## Verificação de gameplay

- [ ] O piloto escolhido no hangar aparece igual na exploração.
- [ ] Pernas, joelhos e braços se articulam ao caminhar.
- [ ] A animação desacelera e para quando não há deslocamento.
- [ ] Ao tocar uma parede, o personagem não caminha indefinidamente no lugar.
- [ ] Joystick analógico funciona em todas as direções e diagonais.
- [ ] Soltar o joystick zera o deslocamento sem deriva.
- [ ] BOOST acelera a caminhada e para de acelerar ao soltar.
- [ ] SCAN, diálogo, câmera e missão desbloqueada continuam funcionando.
- [ ] Retrato 390 × 844 e paisagem 844 × 390 não sobrepõem botões.
- [ ] FPS e leitura do personagem são verificados em aparelho físico.

## Evidência técnica

Source repair anterior: 973 testes passaram, 0 falhas. O workflow temporário
de formatação sincronizou `index.html` com as fontes e foi removido.

A aprovação depende da CI completa, dos testes browser e de inspeção visual.
Não executar merge, nem publicar em produção sem homologação.
