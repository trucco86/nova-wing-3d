# Marte — orçamento visual Médio/Alto · QA 01/11/2026

## Intenção

Reduzir transparências e partículas da tempestade de areia de Marte apenas
na configuração gráfica **Médio** (inclusive Automático resolvido para Médio),
preservando a cena premium no modo **Alto** e **sem alterar a física**.

## Contrato de implementação

- Alto: **240 partículas** no campo, **3 bancos** de névoa.
- Médio: **144 partículas** no mesmo buffer, **2 bancos** de névoa.
- Reutilizar a geometria, os materiais e as matrizes; apenas atualizar
  `BufferGeometry.drawRange` e a visibilidade de um banco distante.
- `marsSandstormAt` permanece totalmente inalterado: vento lateral,
  duração 61–84s, fase de aviso e possibilidade de compensar no controle.
- Planeta/orbita/descida, terreno, Olympus Mons, Cydonia, ruínas fictícias,
  Curiosity, Fobos/Deimos, mecha, chefe e áudio são intocados.
- Trocar Médio/Alto durante Marte e entrar na fase com qualquer perfil deve
  aplicar o orçamento correto; trocar de setor elimina efeitos da fase anterior.
- O visual extra do modo Alto sempre retorna após qualquer alternância;
  nenhum collider ou hitbox é introduzido.

## Critérios e evidências

1. Testes Node verificam densidade, bancos visíveis, identidade da geometria,
   cena ao trocar de setor e **vento idêntico** com os perfis.
2. Quality, build sincronizado, quatro shards Playwright e preview de PR no
   SHA de candidato **sem merge para produção**.
3. Realizar benchmark visual/físico Alto e Médio com cenário fixo no mesmo
   iPhone: 390×844, 844×390 e 1366×768 em desktop; comparar FPS médio,
   tempo de quadro p95, draw calls, triângulos e resolução interna; alvo
   preliminar de até 10% de regressão no p95 comparado à v1.27.61.
4. Evidenciar capturas na janela de tempestade a 70 segundos, verificando
   visibilidade da nave, retículo e Fobos/Deimos, sem retorno de anéis ou
   arranhões na entrada orbital. Captura sintética não substitui aceite humano.

**Status:** implementação candidata, QA pendente. Não declarar ganho real
de FPS/GPU antes da comparação no dispositivo.
