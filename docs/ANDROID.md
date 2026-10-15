# Android

O projeto em `android/` instala o mesmo jogo como aplicativo Capacitor. O pacote é `com.fivecats.novawing`; compile/target SDK 36, minSdk 24. É necessário um Android System WebView atualizado com suporte a WebGL2. O minSdk informa o limite de instalação, não garante desempenho ou execução em todo dispositivo dessa geração.

## Construir

Instale Node 22+ (referência do projeto: 24), JDK 21, Android SDK platform 36 e build-tools 36.0.0. Configure `JAVA_HOME` e `ANDROID_HOME` conforme suas instalações e aceite as licenças do SDK. Android Studio Otter ou mais recente pode abrir a pasta `android/`.

```sh
npm ci
npm run android:sync
npm run android:apk
npm run android:aab
```

`android:sync` recompõe `android-web/` a partir de `src/` e sincroniza plugins/assets; não copie o HTML manualmente. `android:apk` e `android:aab` já executam essa preparação. O jogo Android remove a referência opcional a Google Fonts e inclui retrato, Three.js, modelos procedurais, música e licenças. Não há `server.url` remoto. O build requer acesso às dependências; a partida instalada funciona sem rede.

| Saída       | Local após build                                           | Uso                                                                      |
| ----------- | ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| APK debug   | `android/app/build/outputs/apk/debug/app-debug.apk`        | Instalar para testes; assinado com a chave debug local/CI                |
| AAB release | `android/app/build/outputs/bundle/release/app-release.aab` | Bundle sem assinatura; não é diretamente instalável nem pronto para Play |

Instale o APK com `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`. Builds de CI e locais podem usar chaves debug diferentes: a atualização só funciona com a mesma assinatura. Desinstalar apaga checkpoints; preserve o dispositivo de teste quando possível.

A CI gera ambos no artefato `android-builds`, incluindo log Gradle e SHA-256; compara o HTML dentro de APK/AAB com os assets preparados. Após os gates e Pages, o job release anexa à GitHub Release o APK debug, o AAB sem assinatura e seus hashes, com nomes que incluem a versão. Não usa chave release e não publica no Google Play. Para publicação na loja, mantenha keystore/credenciais fora do repositório e configure assinatura no ambiente privado. Não use a chave debug para distribuição final.

## Sessão e tela

Home, bloqueio e pausa da atividade liberam ponteiros e teclas, pausam combate/respawn/colapso e suspendem o AudioContext. A volta deixa a missão pausada até tocar ▶. No hangar, a continuação do setor retoma o áudio. Voltar durante combate pausa; outro Voltar minimiza, mantendo a sessão em memória. Se Android encerrar o processo, a recuperação usa o último checkpoint de setor, não o instante exato da partida.

O aplicativo prefere paisagem nos telefones e aceita resize em telas grandes. SystemBars oculta as barras e fornece insets CSS de recortes/gestos; apenas a interface recebe esses recuos, mantendo a cena em toda a tela. O sistema pode revelar barras temporariamente por gesto. Checkpoints do aplicativo são independentes dos checkpoints do site. Backup Android está desativado; limpar dados ou desinstalar remove progresso.

`versionName` vem de `package.json`; `versionCode = MAJOR × 1.000.000 + MINOR × 1.000 + PATCH` (cada componente de 0 a 999). A versão 1.5.0 usa 1005000. Nunca reduza/reutilize códigos em publicação.

## Validar em aparelho

- Instalar o APK, abrir em modo avião e iniciar/continuar uma missão.
- Segurar movimento, tiro e boost com vários dedos; cancelar gestos e pressionar por tempo prolongado sem seleção ou menu do navegador.
- Sair por Home, bloquear/desbloquear, receber uma interrupção e retornar: tempo/recursos ficam congelados, áudio para e a retomada exige ▶.
- Repetir durante respawn, colapso e hangar; conferir vidas, recompensa única e checkpoint após reiniciar o processo.
- Conferir Back: primeira ação pausa, segunda minimiza; retorno não dispara sozinho.
- Conferir recorte/câmera frontal, navegação por gestos e três botões, barras temporárias, ambos os lados da paisagem e tablet/redimensionamento.
- Registrar aparelho, Android/WebView, aquecimento, estabilidade e fluidez em combate denso.

Testes Node comprovam contratos de estado; Chromium verifica layout web com insets simulados; Gradle comprova compilação e inclusão de assets. Nenhum deles substitui essas verificações físicas.

Referências: [Capacitor Android](https://capacitorjs.com/docs/android), [migração/contratos da versão 8](https://capacitorjs.com/docs/updating/8-0), [App lifecycle e Back](https://capacitorjs.com/docs/apis/app), [SystemBars e insets](https://capacitorjs.com/docs/apis/system-bars).
