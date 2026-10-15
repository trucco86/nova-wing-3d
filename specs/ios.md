# iOS e preparação para App Store

## Objetivo

Distribuir a mesma campanha offline em um projeto iOS Capacitor 8, mantendo a versão web e Android. O projeto usa Swift Package Manager e identifica o app como `com.fivecats.novawing`.

## Contratos observáveis

- iPhone e iPad abrem o jogo em paisagem, com controles dentro da área segura e canvas ocupando a tela.
- O pacote incorpora código, imagens, música sintetizada e licenças; não depende do Pages nem de fontes remotas.
- Sair do app, bloquear a tela ou interromper a sessão pausa o combate, libera os toques e suspende o áudio. Retornar exige retomada explícita.
- Eventos de foco do WebView não reativam uma sessão que o sistema marcou como inativa.
- Telas externas não criam outra instância do jogo; apenas sessões de aplicativo recebem o delegado com WebView.
- iOS não registra o botão Voltar nem chama a API Android de minimizar.
- Versão de marketing vem de `package.json`; número de build usa major × 1000000 + minor × 1000 + patch.
- Projeto inclui ícone, tela de abertura, manifesto de privacidade e não declara permissões sem uso.
- CI compila para simulador com Xcode, confirma que os assets embarcados correspondem ao bundle offline e disponibiliza o `.app` de simulador. Esse artefato não é um IPA instalável em iPhone físico.

## Evidências e limites

Testes automatizados cobrem os eventos de ciclo de vida compartilhados e a ausência de ações Android no iOS. O CI registra compilação e inicialização no simulador. Validar multitouch, recortes, interrupções e áudio em iPhone/iPad reais continua sendo parte da aceitação antes da loja.

Assinatura, registro do identificador, TestFlight e envio para análise dependem da equipe Apple Developer do titular. Nenhum certificado ou perfil de provisionamento é versionado. Preparação técnica não significa publicação aprovada.
