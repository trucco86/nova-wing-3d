# QA v1.27.100 — viadutos superiores alcançáveis e com colisão real

## Problema remanescente v1.27.99
A fase 1 passou a permitir y=116, mas a composição de fundo `city34-concept-skyline` inclui passarelas a y=93,116,139, com travessas ainda mais altas. Essas passarelas pertencem ao horizonte distante e não cruzam a profundidade do jogador. Não basta registrar colisão em formas decorativas: é preciso colocar as estruturas realmente no percurso, com espaço para esquivar.

## Implementação
- O teto do piloto no setor 1 passa a **y=184**, mantendo largura de voo em x±72, altura mínima y=-1 e câmera seguindo. Nas demais fases 3D continua a faixa y=-1..96 até homologação setorial.
- Nova faixa de três viadutos de transporte aéreo premium em `city-upper-playable-skybridges`: y=92,123,151, em trechos z=-285,-605,-1005 da rota móvel. Estes elementos pertencem aos dois tiles normais da cidade, chegam à profundidade da nave e somem junto à cidade na ascensão orbital.
- Um grupo de aço instanciado com 12 partes rígidas: três decks, seis consoles laterais e três travessas superiores; vidro e cinco pontos luminotécnicos por estrutura apenas visuais. Total de três chamadas instanciadas por tile, sem novos objetos no loop de quadros.
- O registro `city-local-solids` mapeia exatamente essas 12 partes para volumes físicos reais, acompanha deslocamento e escala dos tiles e respeita a visibilidade integral da hierarquia. Não adicionar barreiras globais nem colisão em detalhes luminosos.
- Resposta de contato: decks horizontais interrompem subida/descida na face de aproximação. Proibido teleportar o jogador dezenas de unidades lateralmente ao atingir uma estrutura larga. As pernas laterais continuam deslocando pelo eixo apropriado, com rotas de contorno no topo e nas laterais.
- Nenhuma alteração da posição da cidade de fundo e dos planetas: preserva o enquadramento premium aprovado, ISS, destroços aleatórios, Super Boost e demais setores.
- Teste antigo do subchefe conserva física/tática real e reduz apenas quadros de GPU redundantes antes do momento escolhido para a captura.

## Aceite
1. Os três decks aparecem no palco e são fisicamente sólidos quando passam por z≈9, inclusive em qualidade Média.
2. Um piloto em x=0,y≈92 é atingido fisicamente pelo primeiro viaduto quando o tile se aproxima: impacto registrado, nave repousa fora da estrutura e não teleporta para x≈68.
3. Um piloto acima do primeiro deck ou além da sua borda passa sem colisão; controles podem ultrapassar y=151 e alcançar y=184.
4. Os coliders desligam quando tile ou grupo estão ocultos; wrap/reset e escala da cidade não criam colisões fantasmas.
5. Node + Playwright desktop/mobile, com screenshots de impacto e sobrevôo, e CI FULL quatro shards aprovados antes de recomendar homologação. FPS em hardware físico pendente.
