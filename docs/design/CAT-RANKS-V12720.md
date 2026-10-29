# Patentes e Condecorações Five Cats — v1.27.20

## Objetivo
Progressão militar espacial carismática, **separada** dos troféus do jogador, XP/RPG, créditos, ranking e poderes. Cada um dos cinco pilotos tem patente, pontos de serviço, uniforme e medalhas próprias. Todas as mudanças visuais são cosméticas.

## Patentes oficiais e limiares
| Nível | Patente | Pontos acumulados | Aparência |
|---|---|---:|---|
| 1 | Recruta · Primeira Patrulha | 0 | Uniforme de voo inicial, uma pata |
| 2 | Cadete · Bigodes em Formação | 120 | Uniforme inicial, segunda pata |
| 3 | Aspirante · Primeira Garra | 310 | Jaqueta Mk-II, primeira garra |
| 4 | Tenente · Asas de Órion | 550 | Jaqueta Mk-II, dupla garra |
| 5 | Capitão · Guardião das Nove Vidas | 850 | Oficial, cabeça felina no peito |
| 6 | Major · Sentinela das Estrelas | 1.230 | Oficial com estrela |
| 7 | Comandante · Líder da Patrulha | 1.700 | Comando, dois ombros com patentes |
| 8 | Coronel Estelar · Garra de Órion | 2.270 | Comando com emblema alado |
| 9 | General de Esquadra · Nove Galáxias | 2.950 | Uniforme lendário, asas |
| 10 | Lenda Five Cats · Constelação Imortal | 3.750 | Condecoração máxima |

## Modelo de pontuação
Cada **fase concluída, validada e identificada por runId** concede 70 pontos-base, até +140 por abates, até +100 por pontuação, até +24 por anéis, +55 por chefe, +25 sem dano, +30 difícil, +20 tempo-alvo, +22 novo recorde, +18 chefe apenas com tiro principal, +12 finalização em mecha, +12 especial do esquadrão, +10 por troféu novo (limitado a 5), e até +22 de destaque conforme especialidade.
- Bia: chefe / especial da equipe.
- Bob: sem dano / velocidade.
- Christopher: vitória em Difícil / golpe final no mecha.
- Calvinho: especial / troféu novo.
- Jenifer: recorde / duelo somente com armas primárias.
- **Pontos de serviço não melhoram dano, velocidade ou energia**, evitando vantagem acumulativa.
- **Patente do esquadrão** considera apenas a soma dos cinco pilotos, com cinco títulos.

## Medalhas felinas
12 por gato: Garra de Bronze, Prata e Ouro; Olho de Gato; Nove Vidas; Bigode de Aço; Cauda Relâmpago; Escudo Felino; Pata de Titânio; Coração de Esquadrão; Constelação Felina; Sombra de Marvin. Emblemas de cabeça com orelhas, patas, bigodes e estrelas com cores correspondentes.

## UX
- **Seleção de personagem:** patente, barra de progresso e pequena insígnia. Reação visual do uniforme conforme graduação, sem mudar a aparência real de cada gato ou o perfil da nave.
- **Hall da Patrulha:** cinco cartões, progresso por gato, medalhas, 5º título global e histórico de condecorações.
- **Pós-fase:** aviso de pontos recebidos; promoção e novas medalhas somente quando ocorrerem; notificação discreta no topo, fora do gameplay.
- **Persistência:** novo armazenamento `nova-wing-five-cats-service-v1`, sem alterar o save principal. Funciona offline/visitante; nenhuma sincronização cloud/antifraude declarada.
- **Privacidade:** progressão local, sem expor dados de conta, perfil, Firebase nem Cloudflare.
- **Limite visual:** 5 uniformes CSS; adicionar equipamento 3D do hangar futuramente após QA de proporção e identidade.

## Dependências
A nova PR é **stacked sobre #159** (troféus) e não deve ser promovida a DEV enquanto o fluxo de resultado local do #159 estiver em revisão.
Testar ganho uma única vez por run, troca de piloto, derrota, QA/dev, economia de pontos, cinco medalhas, responsividade 320px, modo paisagem, acesso no menu e progresso após reload. A PR não altera DEV, HML ou produção.
