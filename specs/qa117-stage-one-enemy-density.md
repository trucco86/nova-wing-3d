# QA117 | Mais inimigos na cidade sem regressão do visual premium

## Problema observado

Após a homologação visual preliminar da Fase 1 premium, o jogador percebe poucos inimigos. No modo Normal, a cidade abria com um único caça por onda a cada 5,4 segundos, além de uma patrulha terrestre a cada 6 segundos. A área preserva uma sequência cinematográfica de trem, Super Boost e órbita que não pode ser obstruída.

## Escopo

- Manter integralmente o lote QA116, inclusive ônibus, carros voadores, novas pontes ancoradas, paleta PBR e outdoors.
- Cidade (primeiros 13 segundos): formações reais de caças com 1/2/3 integrantes em Fácil/Normal/Difícil. Ritmos de 5,2/4,15/3,7 segundos, respectivamente.
- Órbita depois do trecho de recuperação: formações de 2/3/4 em Fácil/Normal/Difícil. Conservar escalonamento e diferentes papéis (perseguidor, interceptador e bombardeiro).
- Reduzir o intervalo das patrulhas terrestres iniciais, mantendo a alternância entre tanque e walker. Não introduzir um obstáculo físico sem mesh nem posições dentro de prédio, ônibus ou ponte.
- No modo Normal limitar a seis caças hostis ativos, no Fácil quatro e no Difícil oito; não gerar onda quando a capacidade estiver ocupada. O relógio de onda aguarda 1,25s para tentar novamente sem avançar o número da formação.
- Preservar bloqueios do trem, Super Boost, atmosfera, intro do subchefe e chegada do chefe. O aumento de intensidade não desbloqueia encontros prematuramente.
- Setores 2 a 10, som, dano, vida do jogador, munição e dificuldade base permanecem sem alterações. Sem spawn a partir de tempo de parede; manter pausa determinística.

## Validação

1. Teste de unidade para intensidade por dificuldade, limite ativo e encaixe das formações.
2. Teste de integração real da primeira onda e inimigo terrestre via harness.
3. Testes de regressão do Boost, trem, subchefe e boss obrigatórios.
4. `npm run validate`, 4 shards Playwright e preview WebGL na mesma revisão/commit; comparar Medium e High em mobile e desktop.
5. FPS, calls, triângulos e volume de projéteis devem ser revisados em navegação real antes de merge.
6. **Sem merge ou produção até decisão e revisão humana.**

## Riscos

Mais modelos podem aumentar CPU, GPU, projéteis e dificuldade percebida. Contagem ativa é limite de entidades, não comprovação de desempenho. Não mascarar testes falhos; ajustar a carga de combate conforme FPS medido.

## Homologação visual no preview

No mesmo SHA da CI, jogar a abertura da cidade e verificar as ondas às ~2s, ~6s e ~10s, a chegada das patrulhas ao nível do solo e os limites dos 13s. Confirmar ausência de novos inimigos na travessia do trem e durante Super Boost/atmosfera. Após a chegada à órbita, comparar a nova formação de três caças no Normal com a versão QA116, sem perder visibilidade dos projéteis, da nave ou dos indicadores do HUD. Medir FPS e chamadas reais no perfil Médio mobile e Alto desktop; não confundir testes automatizados com aprovação estética.
