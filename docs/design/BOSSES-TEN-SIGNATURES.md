# Bosses 3.1 · Dez chefes, dez assinaturas de combate

**Candidata v1.27.8 · empilhada sobre v1.27.7 / PR #140.** Não altera ambientes homologados.

O objetivo é evoluir a campanha para confrontos que exigem leituras espaciais distintas. A primeira onda (PR #140) introduziu Perfurador, Colosso, Hidra e Marvin. Esta onda cobre **Rok, Ferrão, Fortaleza Órbita, Fênix, Couraçado Ômega e Núcleo Bastião**.

| Setor                     | O que muda visualmente           | Leitura tática                          | Efeito de quebrar gerador           |
| ------------------------- | -------------------------------- | --------------------------------------- | ----------------------------------- |
| **01 · Caça-líder Rok**   | Baterias laterais articuladas    | Pinça que converge e inverte a abertura | Um flanco para de disparar          |
| **02 · Nave-Ferrão**      | Cauda independente em movimento  | Varredura alta/baixa alternada          | Perde metade das rajadas            |
| **04 · Fortaleza Órbita** | Íris do reator abre/fecha        | Cruz orbital que altera ângulo          | Fechamento de metade dos raios      |
| **05 · Fênix de Plasma**  | Asas de fogo com carga própria   | Feixes alternados em mergulho           | Asa avariada interrompe seu ataque  |
| **08 · Couraçado Ômega**  | Canhões de bordo móveis          | Broadside lateral concentrado           | Bateria do bordo é desativada       |
| **09 · Núcleo Bastião**   | Lente gravitacional pulsa e gira | Linhas focais em altura variável        | Perde emissão de um dos hemisférios |

## Regras que não mudam

- O golpe na **carcaça** reduz pouco HP; geradores são objetivos-chave, e o **núcleo** permanece protegido por fases.
- Baterias ainda ativas disparam até dez projéteis por janela especial; após quebrar todas, o núcleo conserva uma arma defensiva.
- As origens dos projéteis são locais ao modelo, transformadas em coordenadas 3D no próprio runtime.
- Os avisos permanecem na faixa superior, sem cobrir centro e controles.
- As câmeras e cenas da 1.27.6 são mantidas; não alterar gravidade ou hitbox de forma invisível.

## Qualidade e aceite

1. Testar cada chefe pelo modo Developer/QA em [preview da PR](https://github.com/trucco86/nova-wing-3d/pulls).
2. Comparar ataques da fase 1 com os da fase 3 e a reação após quebrar apenas um gerador.
3. Inspecionar a animação das peças, HUD, performance no celular e facilidade de reconhecer as partes frágeis.
4. Verificar todos os testes Node e os quatro shards Playwright no mesmo SHA.
5. **Não promover para DEV/HML/PROD sem revisão e aceite.** A v1.27.5 continua sendo a última homologada.

## Ainda pendente

A diversidade de salvas e animações não representa **ataques físicos exclusivos completos**. Pisões com onda de choque, impacto da broca, campos de gravidade que alteram trajetórias, destruição individual de cabeças e mudanças de arena continuam como fases seguintes. A exploração Five Cats Universe também permanece separada.
