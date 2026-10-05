# Roteamento de modelos por tarefa

Status: implemented

## Objetivo e escopo

Selecionar modelo de desenvolvimento por tarefa, risco e recursos disponíveis. O seletor é local, determinístico e não chama APIs. O runtime externo executa o modelo; o jogo e seu bundle não recebem dependências de LLM.

## Critérios de aceite

- Planejamento prioriza perfil deep; implementação/testes balanced; documentação fast; revisão prioriza outro fornecedor.
- Risco alto e nova tentativa exigem deep. Nenhum fallback pode reduzir esse requisito.
- Ausência de ID configurado, contexto insuficiente, ausência de visão e falha anterior excluem candidatos.
- Revisão com identidade do autor informada exclui a mesma combinação fornecedor/ID, mesmo sob outro nome na política.
- Orçamento de tentativas esgotado e ausência de candidato bloqueiam a seleção, com motivo observável.
- Pedido/política inválidos falham; cada resultado declara limites e não equivale a execução ou aprovação.
- Gates existentes continuam independentes da seleção. Tokens, timeout e tentativas devem ser aplicados pelo runtime que chamar a API.

## Validação

`tests/model-router.test.mjs`, `npm run validate`, exemplos de CLI selecionada e bloqueada.
