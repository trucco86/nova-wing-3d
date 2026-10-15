# Android offline e ciclo de vida

- Aplicativo Capacitor 8, pacote `com.fivecats.novawing`, minSdk 24, compile/targetSdk 36. O projeto Gradle e wrapper ficam versionados; assets web são recompostos e sincronizados antes de cada build.
- APK debug contém o jogo, retrato, modelos procedurais e música sintetizada. Não usa servidor remoto nem fontes externas. Checkpoints continuam locais, sem login ou serviço de backend.
- Abrir Home, bloquear tela ou perder atividade suspende Web Audio, libera ponteiros/teclas e pausa missão, respawn e colapso de forma idempotente. Voltar não retoma combate ou áudio sozinho; o botão de pausa retoma explicitamente. Hangar/menu permanecem na tela anterior e o áudio só volta com uma ação de início/continuação.
- Voltar durante missão/respawn/colapso pausa; Voltar novamente ou no menu/hangar/resultados minimiza o aplicativo, sem navegar para uma página vazia nem apagar a sessão.
- Barras nativas ficam ocultas com suporte a gesto temporário do sistema; retorno à atividade reaplica tela imersiva. HUD e toque respeitam insets CSS nativos/cutouts. Orientação sensorLandscape é preferida no telefone; resize continua funcionando quando Android ignora a preferência em telas grandes.
- `android:sync`, `android:apk` e `android:aab` produzem assets, APK debug instalável e AAB release sem assinatura respectivamente. Nenhuma chave, conta Play ou publicação automática é incluída.
- CI compila API 36 e preserva APK debug/AAB sem assinatura. Testes de simulação/Chromium não comprovam FPS, gestos nativos, interrupções do sistema ou compatibilidade em aparelho físico; checklist físico é obrigatório antes de distribuição.
