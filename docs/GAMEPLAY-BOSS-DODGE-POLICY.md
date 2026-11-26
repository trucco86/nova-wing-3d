# Política de esquiva de chefes

Primeiro componente de um jogador sintético reativo. Usa direção publicada no HUD do radar, ameaça e fase de aviso/ataque observada pela fixture. Converte as setas em teclas ou deslocamento do joystick; não consulta coordenadas ocultas do chefe nem modifica escudo ou física.

O agente mantém a posição quando está seguro. Sem direção específica, não inventa uma rota.

## Executor experimental

A mesma fixture de Rok e Colossus (Europa) é aberta separadamente para o perfil passivo e reativo, por até 30 segundos simulados. Desktop usa teclado e mobile usa joystick CDP. O executor coleta o HUD real a cada 0,25 segundo simulado, posições, escudo, comandos e janelas de ataque. Anexa JSON comparativo e screenshots finais ao Playwright. São quatro testes parametrizados e oito trajetórias potenciais.

```sh
node --test tests/gameplay-boss-dodge-policy.test.mjs tests/gameplay-boss-encounter-metrics.test.mjs
npm run test:browser -- gameplay-boss-reactive.spec.mjs
```

A comparação é consultiva. Se os tempos, escudo inicial ou exposição forem insuficientes, não calcular vantagem. Mesmo em janelas comparáveis, não inferir causalidade: sequências de ataques podem divergir em resposta ao comportamento. Não usar teleporte ou recuperação artificial de escudo. Não afirmar dificuldade justa, vitória, gameplay autônomo completo ou diversão. Não há gravação de clipe de combate nesta etapa.

## Evidência da primeira execução

Run 45528983123, SHA b46dae6: sete testes Node e quatro comparações WebGL aprovados; o job permaneceu vermelho por formatação de um teste. Em 30 segundos simulados, escudo inicial 202, desktop e mobile apresentaram os mesmos valores registrados no JSON: Rok perdeu 38 pontos no passivo e zero no reativo; Colossus perdeu 70 no passivo e 20 no reativo. Ambos observaram duas assinaturas físicas distintas. Esta é uma amostra controlada, não uma estimativa de desempenho humano. O novo commit persiste o JSON diretamente e publica métricas nos logs para auditoria; requer reexecução.

Preservar a PR #447 e integrar posteriormente ao seu relatório e vídeo, após calibração.

## Observação de repetição de ataques

O relatório passa a contar janelas que contêm tanto aviso quanto ataque, e não cada frame repetido do mesmo golpe. A heurística inicial sinaliza três ataques iguais em ciclos consecutivos somente com ao menos quatro janelas completas. Com exposição menor, registra `INSUFFICIENT_EXPOSURE`. Esses limiares são hipóteses de calibração, não regras de design aprovadas. A coleta atual de 30 segundos pode ser insuficiente; uma futura sessão mais longa deve validar a diversidade sem alterar a física ou o escudo do jogador. O detector não avalia a animação do ataque, dificuldade, diversão ou qualidade do enquadramento.

## Sonda de HUD no Reator

A observação experimental amostra rótulos reais de pontos fracos, nome, estado e aviso durante a órbita. Mede a interseção dos retângulos de DOM em relação ao menor rótulo. Pelo menos 20% de interseção por três amostras consecutivas gera candidato consultivo com screenshot e coordenadas. Limiares iniciais sujeitos a calibração. Retângulos de elementos não comprovam sobreposição dos glifos, oclusão 3D, ordem de pintura ou legibilidade; elementos sobrepostos intencionalmente precisam ser excluídos após revisão. O teste em desktop e mobile ainda precisa ser executado.

## Primeiro piloto ofensivo

O piloto experimental alterna disparos reais (Space ou botão de tiro) e esquivas orientadas pelo radar. Em perigo físico com direção desconhecida, espera em vez de assumir uma trajetória segura. Em recuperação, volta a disparar. Uma rota de até 60 segundos simulados contra Rok em desktop e mobile registra decisões, quantidade de projéteis e HP do chefe, além das métricas de exposição. Não usa API de dano nem altera a física. Não implementa mira automática, especiais, transformação, vitória integral ou bônus de contra-ataque da candidata QA184. Este teste ainda requer execução, e a duração não garante cobertura de todos os ataques.
