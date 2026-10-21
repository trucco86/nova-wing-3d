# Vídeo do case — roteiro e storyboard

**Título de trabalho:** *Nova Wing: o aprendizado maior do que o jogo*  
**Audiência:** líderes de engenharia, tecnologia, produto e negócios.  
**Formato:** 16:9, 1080p; duração estimada de **2min15s**.  
**Tom:** autoral, claro e técnico; menos trailer, mais relato de decisão.  
**Estado:** roteiro/storyboard prontos. **Edição e exportação aguardam gameplay gravado ou uso de assets reais do repositório.** Não declarar vídeo renderizado/publicado.

## Narração principal (texto pronto para gravação)

> Tudo começou com uma pergunta simples: até onde eu conseguiria levar uma ideia de jogo usando inteligência artificial para acelerar o desenvolvimento?
>
> O primeiro resultado foi um protótipo. Uma nave, um cenário, algo que já dava para controlar. E isso mudou a dinâmica: em vez de passar semanas tentando explicar a ideia, eu podia jogar, perceber o que funcionava e decidir o próximo passo.
>
> Só que fazer a primeira versão não era a parte mais difícil.
>
> Conforme o Nova Wing cresceu, apareceram os problemas que qualquer time de software conhece. Uma melhoria no visual podia prejudicar a performance. Um ajuste no tiro afetava o controle do celular. Uma mudança no chefe podia travar o jogo depois da vitória.
>
> Foi aí que o experimento ficou interessante. A questão deixou de ser o quanto a IA conseguia programar. Passou a ser: como fazer mudanças rápidas sem perder o controle do produto?
>
> Comecei a organizar o contexto do projeto, escrever critérios de aceite e separar responsabilidades. O objetivo era chegar a um fluxo em que descoberta, arquitetura, implementação, validação e entrega tivessem entradas e saídas claras — com agentes especializados como uma evolução desse modelo.
>
> O harness ganhou um papel central. Ele permite testar a lógica real do jogo com cenários reproduzíveis. Depois, os testes no navegador ajudam a verificar o que só aparece na tela: o movimento, a interface, os controles e a renderização.
>
> E o CI/CD fecha esse ciclo. Cada mudança precisa passar por verificações antes de seguir para publicação. Quando algo falha, a ideia não é esconder a falha; é usar a evidência para corrigir e aprender.
>
> O Nova Wing ainda tem muita coisa para melhorar. E é justamente essa a graça do case.
>
> O maior aprendizado não foi construir um jogo com IA. Foi entender que, para desenvolver mais rápido de maneira sustentável, precisamos dar mais importância ao contexto, às especificações, aos testes e às decisões que conectam tudo isso.
>
> Porque gerar código ficou mais fácil. Construir software confiável continua sendo trabalho de engenharia.

*Notas editoriais:* “comecei” refere-se ao processo do autor/projeto; não significa execução pessoal exclusiva. "Agentes especializados" é a direção operacional documentada, **não** uma afirmação de agentes independentes em execução automática hoje.

## Storyboard de edição

| Tempo aproximado | Cena | Tela/asset recomendado | Mensagem |
| --- | --- | --- | --- |
| 00:00–00:16 | A ideia | Capa do Nova Wing + 5–8 segundos de gameplay **real** | Hipótese que vale testar |
| 00:16–00:33 | Protótipo | Voo com nave, cenário, controle e feedback | Ver antes de discutir por semanas |
| 00:33–00:52 | Fricções | HUD mobile, tiros, chefe, bugs demonstráveis (sem fabricar falhas) | Evoluir implica regressões |
| 00:52–01:12 | Mudança de pergunta | Animação gráfica *Ideia → Spec → Código → Teste → Feedback* | Processo verificável |
| 01:12–01:31 | Contexto e papéis | Captura autêntica de `AGENTS.md`, skills, spec; fluxograma rotulado “modelo proposto” | Agentes com responsabilidade |
| 01:31–01:49 | Harness | Trecho de teste em `tests/harness.mjs` e cenário de navegador | Validar cedo, sem simular sucesso |
| 01:49–02:04 | CI/CD | PR #24 + execução de pipeline v1.15 concluída com sucesso | Evidência por SHA |
| 02:04–02:15 | Fechamento | Gameplay + URL do repositório, frase final | O aprendizado maior do que o jogo |

**Observação de montagem:** as janelas são aproximadas; ajuste cortes à narração real, nunca acelere artificialmente a fala para caber. Use capturas reais com [plano de gravação](CAPTURA.md). Qualquer gráfico animado deve ser rotulado como diagrama, não footage do produto.

## Três textos na tela que valem a retenção

1. **Protótipo rápido ≠ software pronto**
2. **Contexto + specs + harness + revisão**
3. **O diferencial não é gerar código. É conseguir confiar na próxima mudança.**

## Som, acessibilidade e publicação

- Narração PT-BR com entonação conversada, pausa em “não era a parte mais difícil”.
- Música instrumental discreta, original ou licenciada, sem competir com a narração.
- Legendas PT-BR em .srt e arquivo editável de projeto.
- Evitar mostrar tokens, nomes de usuário desnecessários e URLs de ambientes privados.
- Encerramento com **[Repositório](https://github.com/trucco86/nova-wing-3d)** e **[Demo](https://trucco86.github.io/nova-wing-3d/)**.
- Se filmar pipelines, **confirmar status e SHA correspondentes ao conteúdo da cena**.
- Não inserir imagens falsas de gameplay, nem representar papéis futuros como bots operacionais já presentes.
- Antes de publicar, conferir créditos de imagens, áudio e conformidade da música de fundo.

## Alternativa curta — teaser de 35 segundos

> Eu comecei o Nova Wing para testar uma ideia: até onde a IA poderia me ajudar a construir um jogo de nave? O protótipo veio rápido, mas a parte difícil apareceu depois: evoluir sem quebrar o que já funcionava. Foi aí que entraram contexto, specs, harness, testes em navegador e CI/CD. Hoje o Nova Wing é mais do que um jogo. É um laboratório de como acelerar desenvolvimento sem abrir mão de engenharia. O código e as evidências estão no GitHub.

## Próximo passo de produção

Quando o gameplay estiver gravado, seguir [CAPTURA.md](CAPTURA.md), marcar o que é footage real e o que é diagrama, editar a timeline e validar a versão final por uma pessoa antes da publicação. **O projeto está preparado para edição; o vídeo final ainda não foi produzido.**
