# Integração das artes oficiais Five Cats no Nova Wing

## Fontes e identidade

- Fonte principal: composição original de cinco pilotos e suas naves de 19/11/2026.
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
7. Assets WebP são estáticos, sem texturas GPU da cena Three.js. Dev local, Cloudflare, GitHub Pages e Android/iOS offline precisam servir as mesmas seis imagens.
8. CSS e imagens não podem cobrir controles, bloquear foco de teclado, gerar scroll obrigatório para a missão ou impedir pausa/reinício.

## QA

- Teste Node confere formato WebP e distribuição para destino offline, sem sobrescrever arte.
- Teste Playwright percorre seletor de Bob, arte, retorno ao 3D, troca de nave e cor, conceito da frota, arsenal e patente mobile.
- Validar visualmente em desktop, 390x844 e landscape pequeno; controlar métricas de layout, FPS e uso de memória.
- Não aprovar merge ou deploy sem CI FULL e aceitação explícita.
