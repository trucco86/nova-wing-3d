# P0 — Hotfix de ergonomia do botão ROBÔ em produção

## Contexto

A versão Web 1.24.1 contém um sexto botão ROBÔ no grid de cinco ações touch. Em telas pequenas ou orientação paisagem, a linha implícita pode deslocar controles e sobrepor HUD/RPG.

## Contrato funcional

- Somente CSS de HUD e teste browser; sem mudanças de engine, armas, nave, save ou autenticação.
- ROBÔ aparece separado da grade, acima dos cinco comandos e dentro das safe areas.
- ROBÔ mede pelo menos 60 px de largura e altura; os demais cinco comandos também respeitam esse mínimo e não se sobrepõem.
- HUD do chefe não invade controles RPG ou botões touch em paisagem 844×390.
- Validação em 320×568, 390×844 e 844×390 com chefe ativo, menu e pausa preservados.

## Evidência e gates

- Teste `tests/browser/mobile-hud-audit.spec.mjs` cobre seis botões, sem remoção de assertions e captura de screenshot por viewport.
- Partir da versão de produção, não da branch DEV. Revalidar npm ci, npm run build, npm run validate, browser desktop/mobile e SHA final.
- Aprovado na PR #70 DEV é referência, **não evidencia aprovação** automática deste backport.
- Teste visual e toque em dispositivo real, HML, aceite do usuário e rollback continuam obrigatórios para produção.
