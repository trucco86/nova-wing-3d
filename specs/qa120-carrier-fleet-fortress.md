# QA120 | Nave-mãe, Saturno, Órion e Titã: geometria premium sem regressão

## Contexto

QA116 (cidade), QA117 (inimigos), QA118 (ambiente das dez fases) e QA119 (geologia Marte/asteroides/Europa) são bases da revisão empilhada. A QA119 possui validação Node, quatro Playwright FULL e Cloudflare preview aprovados no SHA `8727ce13`. Esta tarefa é um lote adicional de refinamento de arquitetura visual: **não modifica mecânicas, progressão, chefes, pontos fracos, direção de dano, colisores nem HUD.**

## Fase 4: interiores da nave-mãe Devastador

- Substituir 48 janelas luminosas independentes (quatro em cada parede lateral, seis módulos) por 24 lotes de fachadas detalhadas, com 48 painéis de vidro PBR e 48 molduras metálicas físicas, todos realmente apoiados nos painéis laterais.
- Duas salas de motores, quatro turbinas no total: cada conjunto de quatro bobinas de arrefecimento e cada turbina de cinco pás usam um `InstancedMesh` próprio em vez de quatro/cinco objetos independentes.
- Economia arquitetural esperada: **52 chamadas de desenho** a menos em toda a malha de módulos, sem novos loops no `update`, sem novos alvos, preservando rotação, hangares, reator, passarela, limite de voo, entrada/saída e arena 360.
- Ajustar estética com metal PBR, vidros esfumaçados, anéis de refrigeração discretos. Proibido recriar corredores de aros coloridos.

## Fase 8: Saturno

- Substituir 8 silhuetas distantes genéricas de caixas por encouraçados compostos (10 componentes mesclados numa geometria indexada), com asas estruturais, casco, ponte e motores.
- Manter o mesmo lote de renderização, mesmas posições, rotas, cores por instância, apresentação dos anéis reais e Divisão de Cassini.
- Não alterar meteoros reais ou sequência de chefe.

## Fase 9: Órion

- Estruturas gravitacionais remotas deixam de usar um icosaedro isolado; passam a lentes fragmentadas com vigas, suportes e arco quebrado. Oito componentes mesclados em cada um dos 32 objetos instanciados.
- Não adicionar hitboxes, cosmética não pode atravessar a trajetória da nave.

## Fase 10: Titã/Marvin

- As 28 torres remotas ganham pés apoiados, contrafortes laterais, escudos no topo e antenas: 10 componentes mesclados em geometria compartilhada, uma chamada de desenho para o conjunto.
- Pintura em chumbo, aço ferrugem e vermelho industrial controlado, com lagos de metano, superfície de Titã e perseguição de Marvin preservados.

## Regras de desempenho e aceitação

1. Os `InstancedMesh` novos substituem lotes existentes. Sem aumento de luzes, materiais por objeto, draw calls no update, física decorativa ou texturas externas.
2. Preservar Medium/High e o teste QA114 da cidade inferior a 3% de geometria extra.
3. Testes de regressão cobrindo módulos, contagem de vidros e bobinas, rota de motores, pausa/reset, silhuetas indexadas, travessia da missão, troca de setores, máscaras de qualidade e ausências de colisores fantasmas.
4. Sincronizar release `1.27.120`; format, build, validate Node, Playwright FULL quatro shards em SHA final e screenshots de fases 4, 8, 9 e 10 no desktop/mobile com WebGL real.
5. Revisão visual humana e FPS em celular físico continuam obrigatórios antes de produção. **Nunca fazer merge ou deploy de produção sem autorização.**

## Próximo lote fora deste PR

Fases 5 e 7: simulação visual e silhuetas de Vênus e Netuno. Revisão de efeitos de arma, transição de túnel e impacto de chefes em cada fase exige tarefa própria e gates de gameplay.
