# Armamentos legíveis e chefes com identidade — Nova Wing QA 1.27.76

## Referência de design

Panzer Dragoon Saga utiliza perigo por quadrante e reposicionamento para procurar zonas seguras e pontos fracos. Inspirar-se na **clareza tática**, não copiar assets, músicas ou padrões específicos.

- Manual: https://www.digitpress.com/library/manuals/saturn/panzer_dragoon_saga.pdf
- Histórico da mecânica: https://www.gamedeveloper.com/game-platforms/the-history-of-panzer-dragoon

## Entrega 1 — P0, legibilidade das armas

- Cada um dos dez chefes preserva exatamente duas baterias destrutíveis e um canhão emergencial no núcleo.
- Bocas expandidas alinhadas exatamente aos nós `boss-battery-left-muzzle`, `boss-battery-right-muzzle` e `boss-core-muzzle`; proteções/aros visíveis no modelo 3D.
- A carga aparece no próprio canhão antes do disparo; um flash marca a origem física do tiro.
- Projetil com cor temática, cabeça destacada e rastro direcional reutilizado via pool. Dano, colisão, homing e orçamento de tiros inalterados.
- Destruir gerador desabilita efeitos e tiros daquela bateria. O canhão central funciona apenas quando ambas foram destruídas.
- Regra de QA: jamais exibir um disparo de uma arma que não existe ou ficou invisível.

## Identidade tática por chefe — baseline existente + próxima fatia P1

| Fase | Chefe           | Padrão distintivo existente                  | Próximo ataque exclusivo / defesa esperada                 |
| ---- | --------------- | -------------------------------------------- | ---------------------------------------------------------- |
| 1    | Rok             | Pinça convergente por duas baterias          | Travar flanco e fechar pinça; sair da zona de convergência |
| 2    | Stingray        | Ferrão alternando alto/baixo                 | Tesoura de asas lateral; trocar altitude                   |
| 3    | Carbide         | Hélice orbital da broca                      | Investida reta carregada com janela lateral                |
| 4    | Devastador      | Circuitos e motores físicos                  | Descarga setorial após destruir válvula; orbitar o núcleo  |
| 5    | Phoenix         | Asa flamejante / mergulho                    | Raio solar da crista; escapar do eixo                      |
| 6    | Colossus Europa | Pinça criogênica / onda de gelo              | Estacas no solo; subir para escapar                        |
| 7    | Hydra           | Cabeças em padrões alternados                | Cobertura cruzada independente das cabeças                 |
| 8    | Omega           | Bateria lateral, mordida, garras, tentáculos | Artilharia de flanco com pontos de origem próprios         |
| 9    | Orion           | Iris de gravidade / varredura                | Pulso que muda zona segura, com aviso visível              |
| 10   | Marvin          | Coroa imperial e adaptação ao piloto         | Contra-ataque que muda conforme robô, boost e órbita       |

**Não implementar ataques novos sem origem física visível, área de risco sincronizada com o radar e defesa legível.** Não substituir as lutas e fases previamente aprovadas.

## Gates

- Node: dez identidades de cor, boca/muzzle coincidentes, flashing real e componentes desabilitados com perda do gerador; pool sem regressão de dano/velocidade.
- Browser: chefes diferentes emitindo projéteis reais em modo QA desktop e mobile; captura de ao menos dois chefes.
- Visual: iPhone retrato/paisagem, legibilidade de boca, carga, rastro, radar, ponto fraco, performance Alto/Médio.
- Prod bloqueado até aprovação visual; branches e PRs empilhados, preservando v1.27.75.
