# QA107 | Cidade espacialmente coerente e decolagem sem efeito de esteira

## Relato e objetivo
Na fase 1, torres adicionais se sobrepõem a edifícios existentes e o solo parece deslizar como uma esteira durante a subida orbital. Corrigir a coerência visual **sem retirar a arquitetura premium**, alterar o gameplay da nave ou migrar o renderizador.

## Primeiro corte técnico, isolado
- Reaproveitar os 200 volumes de edifícios base como ocupação X/Z para posicionar as 24 torres dos distritos.
- Deslocar as torres conflitantes para o exterior da via, preservando altura, fachadas, materiais, estações e teto de instâncias.
- Separar progresso de gameplay de deslocamento cenográfico: ao subir, reduzir suavemente a velocidade visual compartilhada de prédios e textura do solo.
- Manter movimentação normal antes do boost, em outros mundos e após reset.
- Não modificar a câmera, as hitboxes da nave nem publicar em DEV, HML ou produção sem QA.

## Critérios de aceite
1. Torres dos três distritos não atravessam os edifícios base nem outras torres de distrito nas coordenadas locais dos tiles.
2. A textura do solo e os prédios avançam juntos, e seu movimento desacelera ao ganhar altitude sem congelar o relógio da missão.
3. Durante a pausa não há avanço e, no reset, cidade e solo retornam ao ponto inicial.
4. O corredor de voo e os controles de teclado/toque permanecem intactos.
5. Node, lint, build e quatro shards Playwright passam no SHA final; QA visual High/Medium no desktop e celular compara a subida e a aparência dos três distritos.

## Riscos e limites
- Este corte protege torres dos distritos, mas **não** elimina ainda toda possível interpenetração entre skyline distante, plataformas, pontes e decoração. A auditoria dessas camadas continua na issue #285.
- O perfil de movimento reduz velocidade cenográfica durante a subida, mas deve ser homologado visualmente para conferir ritmo da sequência e paralaxe.
- Não alterar o build gerado manualmente: a pipeline de release deve sincronizar arquivos e versão antes de merge.

## Próximos cortes
- Resolver ocupação de monumentos, skyline distante e elementos de tráfego em uma única camada espacial.
- Melhorar iluminação, materiais, fachadas, skyline atmosférico e LOD com medições reais de FPS.
- Avaliar transição orbital com capturas frame-a-frame em High e Medium antes de promoção.
