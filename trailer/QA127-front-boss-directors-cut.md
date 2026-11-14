# QA127 | Trailer: composição original e entradas frontais dos chefes

Versão de 60 segundos corrigindo apenas os dois pontos apontados na revisão QA126.

## Linguagem cinematográfica
1. Todos os chefes entram no plano central, de frente, antes de a nave alterar direção.
2. **Apenas Núcleo Púrpura** demonstra órbita pronunciada, após 1,85 segundo da apresentação, com input original `J` e câmera `C`.
3. Reator conserva a tomada elevada testada no QA126 para evitar coluna bloqueando o núcleo.
4. Close de Marvin preservado.

## Substituições frame-precisas na timeline QA126
- 0:00-0:29,5: cidade, Terra, Marte e asteroide originais QA126 (inalterados)
- 0:29,5-0:34,5: reator frontal QA127
- 0:34,5-0:37,5: Europa frontal QA127
- 0:37,5-0:41,0: Núcleo Púrpura frontal, depois 1 órbita QA127
- 0:41,0-0:45,0: Saturno e anéis originais QA126 (inalterados)
- 0:45,0-0:49,0: Couraçado Ômega frontal QA127
- 0:49,0-0:54,0: Marvin frontal QA127
- 0:54,0-1:00: logo original QA126 (inalterado)

## Trilha original
Composição inédita de ação cinematográfica com cordas, metais, pulsos de sintetizador, percussão e stingers nos inícios das cenas de chefes 29,5 / 34,5 / 37,5 / 45 / 49 segundos. Tema reduzido na apresentação de Saturno (41-45). Final orquestral para o logo (54-60). Arquivos de mixagem final e trilha fonte entregues como artefatos de revisão no ChatGPT.

## Critérios de aceite
- 5 chefes centrais e de frente no começo, um único showcase de órbita
- preservar Marte/Saturno e toda a montagem QA126 fora de 29,5-41,0 e 45-54 segundos
- 60 s; 30 FPS; origem capturada diretamente do WebGL sem interpolação
- 720p boss patch e saída Full HD/4K com música original
- revisão de sincronização dos 5 stingers e do close de Marvin

### Validação
Execução GitHub Actions [QA127 frontal boss capture](https://github.com/trucco86/nova-wing-3d/actions/runs/43631289120) passou. O áudio foi composto e montado offline e ainda não faz parte do workflow CI do repositório. Nenhum merge ou deploy em produção autorizado.