# P0 — Áudio do Nova Wing nos alto-falantes do iPhone

## Problema observado

Música audível em fones, porém silenciosa no alto-falante do iPhone.
O jogo usa Web Audio para música e efeitos; Safari iOS pode silenciar a categoria
ambient no modo Silencioso. Não mudar partituras, volumes salvos ou mixagem.

## Contrato

- Na primeira ação explícita que inicializa Web Audio, solicitar
  `navigator.audioSession.type = 'playback'` se a API existir.
- Ao retomar a sessão do jogo, reafirmar a categoria antes do `AudioContext.resume()`.
- Não iniciar áudio automaticamente no menu, nem criar loops silenciosos auxiliares.
- Browser sem a API ou com erro de acesso: manter o fluxo de áudio existente,
  sem mensagens falsas de sucesso ou bloqueio.
- Não alterar a política de pausa, modo SOM OFF, música, SFX, preferências ou foco.

## Validação

- Teste automatizado: a categoria é solicitada durante a inicialização por
  gesto, apenas quando suportada, preservando a criação de um único AudioContext.
- Teste automatizado: Safari sem API e setter com exceção não travam o jogo.
- QA manual iPhone/Safari: modo Silencioso ativado/desativado; alto-falante,
  fones/Bluetooth; iniciar missão, tema do menu, retomar após bloquear/trocar
  de app, SOM OFF, volume geral, música e efeitos.
- Regressão de Android e desktop: controles/áudio sem alteração.
- Preview isolado; não promover sem FULL CI e validação em dispositivo físico.

## Referências

- WebKit Bug 237322: https://bugs.webkit.org/show_bug.cgi?id=237322
- MDN Audio Session API: https://developer.mozilla.org/en-US/docs/Web/API/AudioSession/type
