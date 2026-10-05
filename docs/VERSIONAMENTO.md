# Versionamento e releases

Usamos SemVer: `MAJOR.MINOR.PATCH`, com tags `vMAJOR.MINOR.PATCH`. A versão do produto vem de `package.json`, é consistente com o lockfile e é incorporada à capa pelo build.

| Mudança | Exemplo       | Quando usar                                                    |
| ------- | ------------- | -------------------------------------------------------------- |
| Patch   | 1.4.0 → 1.4.1 | Correção que preserva o comportamento contratado               |
| Minor   | 1.4.1 → 1.5.0 | Nova funcionalidade compatível, fase, mecânica ou apresentação |
| Major   | 1.5.0 → 2.0.0 | Ruptura de compatibilidade, como formato de save sem migração  |

## Referência inicial

A versão 1.3.0 publicada corresponde ao commit `45167f6c8cadd72fb0e0b5e37b48963c0ad92921`. É a referência histórica antes da formalização deste fluxo. A primeira release criada por este workflow é a 1.4.0; não se fabricam datas de lançamento ou tags retroativas.

## Preparar uma versão

1. Escolha o incremento de acordo com a alteração.
2. Atualize `package.json` e `package-lock.json` (por exemplo, `npm version minor --no-git-tag-version`).
3. Registre o resumo em `CHANGELOG.md` e notas específicas em `releases/vX.Y.Z.md`.
4. Execute format, build e validação completa. O build preenche `BUILD:VERSION` na capa.
5. Abra PR. Alterações no código distribuído exigem versão maior que a da base; docs isoladas podem manter a versão.
6. Após merge e sucesso do Pages, o job `release` cria tag e GitHub Release apontando exatamente para o commit entregue.

Não crie tag durante desenvolvimento, antes dos gates. Não mova tags publicadas. Uma correção posterior deve receber outra versão. Branches continuam identificando trabalho em andamento; tags identificam entregas.

## Automação e consistência

`tools/version.mjs` verifica formato SemVer, lockfile, changelog, notas da versão e número incorporado no HTML. A CI fornece a revisão-base e faz checkout do histórico para verificar incrementos quando há mudanças distribuídas. O gate integra `check:repo`.

O job `release` só roda em `main` após `pages`. Usa `contents: write` apenas nesse job, com o token efêmero do Actions. Se uma release desse número já existe, a execução é idempotente e não a altera. O restante do pipeline mantém permissões mínimas.

Se o Pages publicar, mas a criação da release falhar, não declare a release criada: corrija a integração e reexecute o job. A publicação do site e o registro da release são resultados distintos.

## Recuperação

Reverter uma funcionalidade também é uma alteração distribuída: faça o revert em branch, atribua a próxima versão patch e mantenha o registro da reversão nas notas. Execute os gates antes de publicar. Nunca reutilize uma tag antiga para apontar a código novo.
