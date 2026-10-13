# iOS e App Store

O projeto `ios/App/App.xcodeproj` usa Capacitor 8.5.2, Swift Package Manager e o identificador `com.fivecats.novawing`. A campanha é empacotada localmente e funciona sem servidor. Requer iOS 15 ou posterior; a compilação usa Xcode 26 ou posterior e Node 24.

## Preparar em um Mac

```sh
npm ci
npm run ios:sync
npm run ios:open
```

`ios:sync` recria os assets offline, sincroniza os plugins e alinha versão e número de build com `package.json`. Use o projeto Xcode, selecione o esquema App e um simulador iPhone ou iPad. `npm run ios:build` compila um `.app` sem assinatura para simulador em `artifacts/ios/DerivedData/Build/Products/Debug-iphonesimulator/App.app`.

O CI disponibiliza o artefato `ios-simulator` e a captura de inicialização. Ele não contém um IPA de distribuição. A compilação sem assinatura permite validar o projeto sem conta Apple.

## Próxima etapa: TestFlight

1. Na conta Apple Developer do titular, confirme a disponibilidade e registre `com.fivecats.novawing`. Se for necessário outro identificador, altere tanto `capacitor.config.json` quanto o projeto Xcode antes da primeira publicação.
2. Em Signing & Capabilities do target App, selecione a equipe e configure assinatura automática pelo Xcode. Mantenha certificados e perfis fora do Git.
3. No App Store Connect, crie o registro Nova Wing com o mesmo identificador.
4. Selecione um destino iOS físico/genérico no Xcode e use Product → Archive. Em Organizer, valide o archive e distribua para App Store Connect.
5. Após o processamento, configure TestFlight e teste em iPhone/iPad reais: áudio após bloqueio, retorno pausado, três toques simultâneos, recortes da tela, reinício e checkpoint offline.
6. Prepare capturas reais, descrição, categoria, classificação etária, URL de suporte e política de privacidade; preencha as declarações de dados conforme o comportamento efetivo do app e seus SDKs. Envie para análise após os testes.

Não envie senhas, chaves privadas ou certificados pela conversa. A configuração da equipe pode ser feita pelo titular no Xcode.

## Privacidade e comportamento

Esta versão não inclui login, anúncios, analytics, compras ou backend. Checkpoints e preferências do jogo ficam no armazenamento local do WebView. O manifesto do aplicativo declara ausência de rastreamento e coleta; manifestos dos SDKs acompanham suas dependências. Reavalie essas declarações ao adicionar plugins ou serviços. O app não solicita câmera, microfone, localização ou notificações.

Ainda é necessário validar desempenho, controles e interrupções em dispositivos reais. Um CI verde confirma os testes executados e a compilação, não a aprovação da App Store.

## Referências

- [Capacitor: iOS](https://capacitorjs.com/docs/ios)
- [Capacitor: manifesto de privacidade](https://capacitorjs.com/docs/ios/privacy-manifest)
- [Capacitor: distribuição na App Store](https://capacitorjs.com/docs/ios/deploying-to-app-store)
- [Apple: envio de aplicativos](https://developer.apple.com/app-store/submitting/)
