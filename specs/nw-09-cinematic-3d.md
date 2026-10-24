# NW-09 — Cinemática 3D Five Cats (fase de preparação)

## Objetivo

Substituir a abertura atual de estrelas e silhuetas CSS por encenação Three.js
utilizando os modelos reais dos pilotos e naves já disponíveis no hangar.
Conservar a história aprovada: Marvin roubou suprimentos e será perseguido
até a galáxia mais distante. Não revelar uma contagem fixa de setores.

## Storyboard de cinco cenas

1. Estabelecimento do universo: planeta, estação orbital e suprimentos Five Cats.
2. Roubo: nave de Marvin escapa com carga visível; Marvin é um pitbull atlético
   marrom e branco, com focinho rosa e olhos mel-esverdeados.
3. Reunião: Bia, Jenifer, Christopher, Bob e Calvinho surgem em grupo. Respeitar
   silhuetas e tamanhos do hangar, com Calvinho menor e Christopher mais robusto.
4. Decolagem: formação de naves e impulso, com câmera seguindo os propulsores.
5. Perseguição: aceleração pelo espaço; transição direta ao voo jogável.

## Contratos de interface e compatibilidade

- Executar apenas no canal web até homologação; caminhos nativos continuam
  com o fluxo anterior e sem dependência de assets externos.
- Pular abre a missão uma única vez. Assistir à abertura retorna ao menu.
- Legendas PT/EN/ES seguem o idioma escolhido, com opção de ocultar.
- Respeitar `prefers-reduced-motion`, parâmetros de volume e política
  de desbloqueio do Web Audio mediante interação.
- Não tocar em progresso, saldo, dificuldade, atributos ou checkpoints.
- Limitar geometrias/vozes, descartar recursos privados e preservar o
  orçamento de HTML de 2 MB.
- Uma falha WebGL deve manter o prólogo textual existente acessível.

## Qualidade / aceite

- Testes determinísticos: storyboard cronológico, corte, skip e retomada.
- Playwright: desktop, 390×844 e 320×568; texto sem colisões; sem erro
  de shader/console e transição para missão.
- Evidência visual real do render 3D por cena no SHA final, com descrição
  dos modelos, iluminação, câmera e quantidade de draw calls quando aferida.
- Pipeline quality + quatro shards browser verdes; revisão visual humana
  antes do merge e da publicação.
- Declarar explicitamente o que é protótipo, o que foi renderizado e
  o que está homologado; evitar alegações de teste físico não realizado.

## Plano incremental

1. Isolar dados de cenas e transições do loop de jogo.
2. Compor cena 3D com nave e modelo de piloto real reutilizados.
3. Acrescentar Marvin e apresentação de todo o esquadrão.
4. Sincronizar texto, música e cortes com animação, com acessibilidade.
5. Criar screenshots, medir impacto no bundle e integrar após validação.
