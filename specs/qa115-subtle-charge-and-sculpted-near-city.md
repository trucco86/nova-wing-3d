# QA115 | Plasma sutil, tiro com impacto e arquitetura próxima da câmera

## Problema
O usuário rejeitou a sonoridade de arcade/minigame dos disparos e o som repetitivo do carregamento. O objetivo não é reproduzir qualquer áudio de R-Type, mas aplicar princípios de contraste: carregar discretamente, descarregar com impacto e preservar feedback sem fadiga auditiva.

Os gráficos da QA114 evoluíram mas a arquitetura próxima ao voo ainda tem blocos pouco diferenciados.

## Escopo de áudio
- Sintetizador procedural original, sem samples, músicas ou assets protegidos.
- Carga contínua com seno e triângulo filtrados; sem serrilhada no loop; faixa baixa com 85 a 113 Hz e segunda camada 148 a 211 Hz. Ruído branco quase imperceptível, banda 530 a 1020 Hz.
- Ganhos máximos por camada (pré-mixer) 0.011, 0.007 e 0.005. Aproximadamente 10 a 15 dB abaixo do loop QA114, a medir em áudio final.
- Sinal de entrada curto com ataque gradual, removendo whistle alto. Release e tiro normal recebem ataque breve, corpo de médio grave e ruído curto, sem apito eletrônico persistente.
- A carga reutiliza as mesmas três fontes e para ao soltar, mutar ou pausar; as vozes transientes respeitam limite de 32.
- Teste OfflineAudioContext compara o RMS da carga com disparo: release >2.6 vezes o RMS da espera, charge peak <0.14, todos peak <0.98.
- **Avaliação perceptiva humana obrigatória** em fones e no alto-falante do celular: a energia do shot não pode encobrir música/feedbacks. Não alegar que o som é idêntico ao R-Type.

## Escopo de arquitetura e performance
- Novo construtor de prismas sobre a face lateral X, com contornos Y/Z, fechamentos e normais. Dois conjuntos de painéis arquitetônicos chanfrados e vidro recuado por host.
- Aproximação até a parede existente, sem exceder projeção de 0.12 para dentro do corredor. Todos os painéis permanecem presos ao mesmo edifício, sem colisões adicionais.
- Seleção de hosts melhora cobertura reduzindo altura mínima a 35 e aumentando tolerância de faixa de lote de 49 a 57, sempre com filtragem de AABB 3D e reservas do maglev.
- Manter 4 famílias de material por bairro, 3 no landmark, buffers <3 MiB/tile e triângulos <45 mil/tile.
- A/B desktop e mobile no mesmo frame com screenshots, diferença perceptível de pixels, draw calls reais, sem GPU budget relaxado.

## Gating e falhas conhecidas
A QA114 PR #325 tinha Node 778 PASS e WebGL direcionado 6 PASS, mas **CI FULL falhou**: Europa arena FOV em landscape ficou 88 onde teste requer <86; teste QA113 per-tile exibia 3 hosts em um dos layouts mobile contra expectativa fixa de 4. Tratar o segundo por cobertura total geolocalizada e prova visual; não mascarar comportamento de câmera. Retestar primeiro; se a câmera persistir fora de parâmetro, bloquear a cadeia.

Nenhuma publicação na main até CI FULL verde e aceitação visual/auditiva explícita.
