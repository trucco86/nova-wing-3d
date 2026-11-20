# Integração das artes oficiais Five Cats no Nova Wing

## Fontes e identidade

- Fontes principais: artes individuais de destaque de Bia, Bob, Christopher, Calvinho e Jenifer, além da composição original com cinco pilotos e suas naves de 19/11/2026.
- Retrato individual de Bob: usar a versão mais recente, com traje escuro e detalhes turquesa, substituindo o recorte anterior do painel coletivo.
- As ilustrações de conceito usam o texto “Boa” e “Luna”; o jogo mantém a identidade já implementada **Bia** e **Jenifer**. Recortes removem legendas incorretas, sem modificar o roster, as habilidades e a nave selecionada.
- Os arquivos WebP da branch são derivados localmente das artes já geradas pelo usuário; não são imagens obtidas de terceiros.

## Regras de apresentação

1. Retratos no seletor dos cinco pilotos, painel individual, HUD e quadro de patentes devem refletir o piloto selecionado.
2. O painel de Bob usa `bob-spotlight.webp` como única arte de destaque. Nunca exibir a versão antiga do Bob nesse painel.
3. A opção **ARTE DOS GATOS** é visual e reversível; **NAVE 360°** e **PILOTO 360°** continuam usando os modelos Three.js reais.
4. A imagem conceitual de nave é rotulada como arte de referência, diferente do modelo 3D configurável. Não inferir modelo, cor, stats ou upgrades a partir do desenho.
5. O catálogo de patente mantém as **10** patentes e thresholds de `src/cat-rank-catalog.js`. A prancha de arte fornece **8** emblemas decorativos; classes avançadas podem compartilhar emblema, mas não nome, rank nem dados.
6. Painéis de armas e pods são opcionais no arsenal, com carregamento adiado e rótulos de conceito. Não criar upgrades ou prometer funcionalidades da ilustração.
7. Assets WebP são estáticos, sem texturas GPU da cena Three.js. Dev local, Cloudflare, GitHub Pages e Android/iOS offline precisam servir as mesmas onze imagens, incluindo o dossiê individual de Marvin.
8. CSS e imagens não podem cobrir controles, bloquear foco de teclado, gerar scroll obrigatório para a missão ou impedir pausa/reinício.

## QA

- Teste Node confere formato WebP e distribuição para destino offline, sem sobrescrever arte.
- Teste Playwright percorre seletor de Bob, arte, retorno ao 3D, troca de nave e cor, conceito da frota, arsenal e patente mobile.
- Validar visualmente em desktop, 390x844 e landscape pequeno; controlar métricas de layout, FPS e uso de memória.
- Não aprovar merge ou deploy sem CI FULL e aceitação explícita.

## Checklist de revisão da prévia

1. Abrir `https://pr-406.nova-wing-preview.pages.dev` e entrar em **ESCOLHER PILOTO E NAVE**.
2. Selecionar **BOB** e **ARTE DOS GATOS**; o destaque deve exibir a arte individual de Bob, com uniforme escuro e luzes ciano.
3. Voltar a **NAVE 360°**, selecionar SPECTER-X e OURO e confirmar que a nave jogável permanece customizável.
4. Conferir arte conceitual de nave separada do chassi 3D e painéis de armas e pods em ARSENAL.
5. Conferir as dez patentes nomeadas e suas insígnias decorativas em mobile, sem elementos obstruídos.
6. Abrir cada asset via `/src/assets/<nome>.webp`; verificar HTTP 200 e formato `image/webp` no preview, em Pages e offline.

Esses passos são critérios de revisão, não evidência de que o navegador foi inspecionado manualmente.

- Para destaques individuais, utilizar `{bia,bob,christopher,calvin,jenifer}-spotlight.webp` em resolução própria, e nunca ampliar a colagem dos retratos pequenos.

## Retratos consistentes e Marvin (20/11/2026)

- O seletor, HUD do piloto, rádio, diálogo cinematográfico e cards de patente usam individualmente os WebP de Bia, Bob, Christopher, Calvinho e Jenifer.
- Bob usa o mesmo retrato corrigido em TODAS essas superfícies; a montagem antiga deixa de aparecer em avatares pequenos.
- Marvin recebe uma arte própria e um dossiê recolhível na Central, separado dos cinco pilotos jogáveis.
- O dossiê só carrega a imagem quando expandido. Não altera o loop 3D, piloto selecionado, progresso, colisões ou balanceamento.
- O painel conceitual de naves e as insígnias permanecem identificados como referência visual.
- QA deve inspecionar a imagem do Marvin, os cinco retratos e os assets no domínio publicado em mobile e desktop.

## Revisão de enquadramento individual (20/11/2026)

- **Não trocar as ilustrações aprovadas**. Especialmente Bob mantém a nova arte solo com armadura escura e detalhes ciano.
- Avatares de roster, rádio, história e patentes utilizam recorte facial ampliado (`175% auto`) para tornar olhos, orelhas e focinho legíveis, sem exibir o corpo inteiro em 42 a 54 pixels.
- O retrato horizontal do perfil usa enquadramento de cabeça, ombros e armadura (`auto 155%`).
- O destaque no hangar usa cabeça e tronco superior (`128% auto`) com pontos focais próprios para cada um dos cinco gatos.
- Os pontos focais são declarados por personagem na folha de estilo, não em números globais que distorçam o enquadramento dos demais gatos.
- Usar captura real do Playwright em desktop e portrait para verificar que nenhum rosto/orelha é cortado; os testes de CSS verificam os recursos e seus parâmetros, não substituem inspeção visual.
- Não editar a arte original, alterar piloto, nave/skin selecionadas ou aumentar a memória WebGL para corrigir o enquadramento.

## Convergência entre o HUD e o 3D (20/11/2026)

- O retrato de piloto `#pilotHudAvatar` do gameplay deve sempre usar `{id}-spotlight.webp` com o mesmo recorte facial aprovado no hangar, **sem depender** de estar no modo de showroom. Trocas manuais e substituição após dano preservam o piloto atual e atualizam nome, `data-pilot` e imagem.
- Bob mantém `bob-spotlight.webp` corrigido e olhos **âmbar**, não verdes. Christopher e Bob têm pelagem escura e cabeça robusta, com Christopher ligeiramente maior. Jenifer tem olhos verdes e traje claro/turquesa. Bia veste armadura clara com detalhes ciano; Calvinho é menor, de orelhas relativamente altas e detalhes verdes.
- `PILOT_ART_DIRECTION` em `showroom-models.js` descreve apenas materiais, feições e acessórios 3D; não altera `PILOT_PROFILES`, vantagens, armas, patente, colisões nem câmeras.
- Reaproveitar a mesma geometria de piloto na inspeção 360° e na apresentação do hangar da fase 1; não instanciar gatos 3D de maneira permanente dentro do gameplay. Armadura e arreios têm geometria leve, descartada com o showroom.
- **Aceite**: cada gato é reconhecível na comparação entre arte e 3D, Bob/Christopher não se confundem, olhos/armaduras estão coerentes, HUD mostra a arte correta antes e depois da troca de piloto, UI portrait mantém espaço de combate e não há alteração de balanceamento.
- Cobertura: testes Node para materiais, geometria finita, insígnias e disposição; teste Playwright para o retrato real antes/depois do relay e respawn. Exigir CI completa e screenshots nos viewports web/mobile antes do merge.
