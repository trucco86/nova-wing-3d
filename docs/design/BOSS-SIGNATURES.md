# Bosses 3.0 — encontros com identidade e consequências

**Status:** implementação candidata v1.27.7, incremental sobre a v1.27.6 (PR #138). **Aguardando CI e avaliação humana.** Não representa mundo aberto implementado.

## Queixa resolvida em parte

Antes, os dez chefes tinham silhuetas e padrões de tiros variados, mas a maior parte compartilhava a mesma sensação de combate: mesmo armamento central, animação simples e pouco efeito prático ao destruir módulos.

Esta onda acrescenta **quatro arquétipos jogáveis realmente diferentes** e mantém a campanha existente sem regressão deliberada:

| Setor | Chefe | Mecânica exclusiva | Reação à destruição |
| --- | --- | --- | --- |
| 03 | Perfurador | Broca avançando durante investida e ataque helicoidal disparado de pontos do anel | Geradores continuam obrigatórios para expor núcleo |
| 06 | Colosso glacial | Dois braços articulados, salvas independentes e movimento de impacto | Destruir um gerador elimina a bateria correspondente; ambos destruídos, resta canhão de núcleo |
| 07 | Colmeia viva | Sete cabeças animadas, disparos de origens distribuídas e orientação variável | Cabeças da região cujo gerador foi desativado deixam de disparar |
| 10 | Marvin | Coroa pulsante, janela de eclipse e salvas curvas a partir da armadura | Perda de baterias laterais força ataque concentrado no núcleo |

### Contratos

- Projéteis saem de partes reais do modelo, transformadas para coordenadas globais, e usam a simulação normal de tiros.
- Cada janela especial é precedida por aviso no **topo da tela**, sem texto no centro.
- Modelos são animados pelo relógio da simulação; pausa/congelamento preservados.
- Máximo **10 projéteis em cada salva especial**; proteção de performance e de dificuldade mobile.
- A blindagem ainda recebe dano baixo; geradores críticos e núcleo continuam necessários para a vitória.
- Ataques restantes (setores 01, 02, 04, 05, 08 e 09) conservam o contrato aprovado da v1.27.6.
- Developer/QA é o caminho de entrada por chefe, sem progressão ou ranking.

### Como validar

1. No preview da PR desta candidata, use Developer/QA para entrar no chefe do setor 03, 06, 07 e 10.
2. Observe o aviso, a animação da parte do corpo e a origem dos tiros. Alterne nave/robô e orbite.
3. Teste a destruição de apenas um gerador, veja se as salvas mudam, e depois destrua o segundo.
4. Verifique saúde, retícula de ponto fraco, travamento/rolagem, FPS e controles no celular.
5. Registre evidências antes de promover a branch; **nada aqui altera DEV, HML ou produção**.

### Próximas ondas, ainda não implementadas

- **Bosses restantes:** comportamento exclusivo dos setores 01, 02, 04, 05, 08, 09.
- **Colosso:** hitboxes separadas por braço + pisão com onda física e dano por proximidade.
- **Hidra:** cabeças destrutíveis individualmente + comportamento adaptativo após perder uma cabeça.
- **Perfurador:** colisão física da investida e mudança de rota no túnel.
- **Marvin:** transições de arena e perseguição no espaço profundo.
- **Diretor de encontros:** telemetria de duração, dano no casco e pontos fracos, densidade por tela e dispositivos mobile.

Atribuir ganhos de engajamento somente após instrumentação e baseline.
