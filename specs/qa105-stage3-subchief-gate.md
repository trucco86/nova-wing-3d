# QA105: encontro obrigatório com subchefe na fase 3

## Problema observado
Na homologação manual da candidata QA104 (PR #304), o jogador aprovou a fase 3, mas não encontrou o subchefe. A ausência visual não prova inexistência no código: investigar sequência de spawn, condições de ativação, renderização e possíveis pulos de etapa.

## Contrato funcional
1. A fase 3 preserva a entrada cinematográfica no asteroide e o percurso de obstáculos aprovados.
2. Depois do trecho de GIRO/desvio e **antes** do chefe principal, a progressão obrigatoriamente aciona um encontro de subchefe, sem permitir skip por avanço do trilho, mudança de câmera ou temporizador.
3. O subchefe deve ser visualmente identificável, ter ataques próprios com telegraph e origem física dos tiros, colisões corretas, indicador de vida e feedback de dano. Não usar clone genérico com HP aumentado.
4. Ao derrotá-lo, remover ataques/projéteis pendentes com segurança, liberar o avanço e iniciar o chefe principal uma única vez.
5. Morte, retry, pausa, retomada e reinício não duplicam o subchefe, não travam a fase nem pulam o encontro.
6. Preservar controles teclado/toque, GIRO mantido, liberdade de navegação e orçamento de desempenho.
7. **Regra da campanha:** cada fase com chefe principal deve apresentar um subchefe distinto antes dele. Auditar as dez fases e registrar as lacunas sem alterar fases já aprovadas inadvertidamente.

## Evidências obrigatórias
- Teste de progressão automatizado: ordem `entrada -> obstáculos -> subchefe -> chefe`, spawn único, derrota e retry.
- Teste de regressão da fase 3 em desktop e mobile, com capturas e logs dos eventos de progressão.
- CI: format:check, lint, build:check, testes Node e 4 shards browser no SHA final.
- QA visual do jogador no preview isolado antes de promover para DEV ou PROD.

## Critérios de aceite
- [ ] Causa raiz documentada (ausência, condição de spawn, skip ou problema visual).
- [ ] Encontro obrigatório, visível e jogável.
- [ ] Ordem de eventos protegida por teste.
- [ ] Fases 1 e 2 não sofreram regressões.
- [ ] Auditoria de subchefes nas demais fases registrada.
- [ ] CI e validação manual aprovadas.

Referências: issue #306, PR #304, issue #305. Esta especificação **não representa implementação concluída**.