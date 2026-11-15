# QA136 | Combate adaptativo, projéteis físicos e Marte Premium

## Diagnóstico verificado no código

- A colisão do tiro inimigo usava apenas a distância da posição final do projétil ao centro do jogador (2,1 unidades). Um projétil atravessando a nave entre quadros podia passar sem dano.
- Os dez chefes já tinham famílias de ataques, pontos fracos e respostas instantâneas à posição/boost/órbita, mas não observavam tendência recente do piloto e podiam repetir o mesmo golpe.
- O impacto das investidas usava um deslocamento apenas em profundidade, sem acompanhar fisicamente a região escolhida no aviso.
- O início da missão 2 impedia fighter spawn durante todos os 27 segundos de aproximação, apesar de mostrar grande área espacial.
- A superfície orbital marciana tinha tons simples com crateras representadas por círculos senoidais; a tempestade de superfície tinha apenas três painéis de névoa com padrão muito simples.

## Mudanças funcionais

1. **Colisão Swept:** testa o caminho completo de cada projétil contra a caixa compacta da nave ou robô. É feita antes de aplicar dano, após bloqueio por obstáculos e pods, usando as mesmas posições da simulação.
2. **IA local de comportamento:** observador de baixo custo, sem rede, que extrai tendência recente de movimento horizontal/vertical e uso de boost; a cada janela o chefe seleciona um golpe **já existente** e com aviso. Só altera o conjunto de ataques em setores 1, 2, 3, 5, 6 e 9 (índices 0,1,2,4,5,8). Setores dependentes de hardware destruído conservam suas regras.
3. **Investida real:** durante a fase de contato, o chefe aproxima parte do corpo do alvo congelado no início do windup, sem perseguição telepática após a esquiva.
4. **Caças comuns:** no máximo um papel da formação a cada dois ciclos é reatribuído conforme o padrão do piloto. Quantidade, geometria, física e intervalos dos spawns permanecem inalterados.
5. **Marte:** caças entram entre 3 e 13 segundos, antes da atmosfera; nenhuma nova onda é autorizada na reentrada até o fim da descida.
6. **Planeta procedural:** relevos visuais, crateras com bordas, região semelhante a cânion e calota polar com terminador; sem novos assets/mesh.
7. **Tempestade:** novos fluxos de areia em três bancos existentes, com deriva vinculada ao mesmo vento do gameplay; 240 partículas pré-alocadas.

## Riscos e QA obrigatória

- Projetil precisa tocar a silhueta para causar dano; não aumentar o volume ao ponto de criar tiros invisíveis.
- Em boss phase 2/3, IA não pode causar ataques sem aviso, trocar alvo depois de travado ou recuperar arma destruída.
- Novos caças da aproximação de Marte não podem ocultar planeta, estragar o gate de reentrada ou aparecer em cena durante a tela do mapa.
- Verificar pausa e reset, tiros bloqueados por pods, invulnerabilidade, arena orbital, hitbox do robô, carga de GPU e shader WebGL em mobile.
- Meta performance: manter contagem de draw calls e instâncias dos efeitos; medir FPS, p95/p99 e memória em dispositivo físico no mesmo percurso, antes de declarar melhoria.
- Gate de merge: `npm run format`, build/check, `npm run validate`, quatro shards Playwright e capturas reais.
- Draft apenas; **sem merge ou deploy de produção sem aprovação explícita.**
