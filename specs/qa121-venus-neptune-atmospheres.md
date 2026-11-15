# QA121 | Atmosferas premium de Vênus e Netuno

## Base e objetivo

Continuação empilhada em QA120 (#331), ainda sujeita à verificação final dos quatro shards Playwright após reparo de timeout mobile. O padrão premium transversal da QA118 já cobre as dez fases. Este PR melhora a geometria distintiva de Vênus (fase 5) e Netuno (fase 7) sem alterar história, chefes, armas ou colisões.

## Implementação

### Vênus, fase 5

- As 38 nuvens atmosféricas distantes deixam de ser esferas simples e usam volumes turbulentos com três lóbulos geometricamente reais, em **um InstancedMesh** já existente.
- As 26 formações vulcânicas distantes tornam-se chaminés modeladas com estratos, suporte basal, bocal de caldeira e fumarolas laterais. São oito partes mescladas num único índice de geometria, instanciado em **um draw call**.
- Preservar nuvens elétricas, flashes em alta qualidade, trajetória e ataques de plasma; cores, névoa e luz solar da QA118 permanecem.
- Deriva horizontal, subida convectiva e inclinação lentas, determinísticas com o relógio da fase (pausa, reset e replay idênticos).

### Netuno, fase 7

- As 34 massas atmosféricas distantes deixam de ser esferas regulares e passam a bancos de tempestade com três volumes geométricos e silhueta alongada.
- As 28 torres de colônia/hive deixam de ser cones genéricos, com núcleo orgânico, três raízes, cúpula, espira central e três apêndices inclinados. São nove peças mescladas na **mesma chamada instanciada**.
- Preservar ciclone, ataques, subchefe, chefe e percurso de desvio.
- Movimento de nuvem sob vento cruzado e giro sutil, sincronizados ao tempo da missão.

## Engenharia

- Geometrias indexadas com normais e UV, com no máximo 550 vértices em cada modelo base, sem textura remota.
- Não adicionar novos materiais por instância, luzes, sombras, passes ou colisores; nenhuma alocação por frame no movimento de clima.
- Medium mantém massas ambientais; High habilita detalhe de formações laterais. Tudo fica a no mínimo 120 unidades do centro do voo.
- Riscos visuais: excesso de transparência e overdraw mobile; medir tempo real de frame após testes automáticos e homologação humana.
- Rodar regressões de QA120 e das dez fases. Teto QA114 estrito: menos de 3% de triângulos incrementais no cenário da cidade, sem afrouxar testes.

## Gate de release

1. Sincronizar candidata 1.27.121 com `release:prepare`, format, build e validate.
2. Node QA121, landmarks, chegada de planetas, graduação premium e testes de missão.
3. Playwright FULL quatro shards e capturas mobile/desktop de Vênus e Netuno no SHA final.
4. Publicar somente preview isolado do PR após FAST.
5. Sem merge, deploy de produção ou declaração de FPS em celular físico sem validação.

## Próxima etapa

Melhorar efeitos de armas, ataques de chefes e impactos físicos usando um backlog de VFX específico, com telegráficos legíveis e ensaio de performance, sem refazer a mecânica por fora.
