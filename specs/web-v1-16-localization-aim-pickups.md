# Web v1.16 | Idiomas completos, mira e coleta de pickups

Status: em implementação na branch `feat/web-v1-16-i18n-aim-pickup`

## Objetivo e hipótese

A experiência deve ser legível no idioma selecionado e deve dar ao jogador informação clara sobre para onde está mirando e se um pickup foi coletado. Esse conjunto elimina atritos que surgiram após a v1.15, preservando os cinco pilotos, gameplay, checkpoints, menus e áudio.

## Contrato 1 — Localização de todo texto visível

- Opções `Português (Brasil)`, `English` e `Español` traduzem textos de **todas** as superfícies: capa, menus, hangar, fichas, arsenal, configuração, ajuda, campanha, mensagens de combate, HUD, setor/chefes, loja, minigame, finais, introdução e confirmações.
- Nomes próprios (`NOVA WING`, `Five Cats`, nomes dos cinco pilotos, `Marvin`, designações técnicas como `NOVA-7`) permanecem próprios, quando aplicável. Traduções não devem alterar IDs usados em saves.
- Aplicar a preferência imediatamente sem recarregar e preservá-la entre sessões, sem afetar checkpoints.
- Atributos de acessibilidade (`aria-label`), texto de ajuda e conteúdo previamente oculto também são localizados, inclusive quando aparecem depois.
- Variáveis numéricas devem ser interpoladas, evitando montar frases usando trechos fixos em português.
- Verificação: teste de chaves em PT/EN/ES, inspeção de todas as superfícies no browser em cada idioma e nenhum texto misturado, inclusive pausa, bosses, minigame, créditos e final.

## Contrato 2 — Mira confiável

- Mira presente durante voo nas câmeras de perseguição, cockpit e combate, com posição calculada a partir da trajetória frontal dos projéteis e da câmera ativa.
- Não deslocar de modo falso a mira para o centro fixo: quando a nave se move para os lados ou a câmera acompanha com atraso, a mira deve projetar a direção real do disparo.
- Visibilidade e contraste estáveis sobre cenas escuras e claras; tamanho reduzido em mobile.
- Indicar impacto confirmado sem bloquear campo de visão; ocultar durante menu, loja, pausa modal e minigame.
- Preservar os pontos fracos e as regras de órbita dos chefes.

## Contrato 3 — Coleta previsível e inequívoca

- Atravessar a área do anel perto da nave em alta velocidade deve resultar em coleta consistente. Usar teste de cruzamento varrido no eixo de avanço e aproximação lateral moderada; não permitir coleta arbitrária à longa distância.
- Magnetismo moderado ao se aproximar e tolerância adaptada ao tamanho visual (anel azul/verde e suprimentos); diferenciar claramente aproximação de coleta.
- Ao coletar, mostrar feedback visual positivo (brilho/partículas + texto breve de recurso recebido) e som distinto, mesmo quando a mensagem de comunicação estiver ocupada. Em mudo, o feedback visual continua funcionando.
- Recompensar **uma única vez** por pickup e garantir remoção da cena sem vazamento ou contagem dupla.
- Verificar centro, aproximação diagonal, alta velocidade, near miss fora do raio, pickup de suprimento, pausa e checkpoint.

## Preservações e limites

- Não alterar dano de armas, progressão, chefes, balística dos projéteis, lógica de UI original, suporte touch, compatibilidade de save ou valores existentes sem spec e teste.
- Não editar `index.html` diretamente; é um artefato gerado.
- Executar `npm run format && npm run build && npm run validate -- --browser` no SHA final.
- Não publicar v1.16 antes de todos os três contratos estarem concluídos e validados.
