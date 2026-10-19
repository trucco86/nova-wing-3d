# Histórico

## 1.9.0 — Evolução contínua web

- RPG em gaveta lateral e especialidades Ataque, Defesa e Espiritual.
- Progressão após nível 10; carga acompanha armas, XP e pods.
- Subchefe inicial mais curto e impactos visíveis ao causar dano.
- Instrumentos iluminados no cockpit, ascensão orbital e detalhes nos inimigos.

## 1.8.0 — Combate estratégico web

- Dez evoluções por XP, módulos visuais, agilidade gradual e cinco famílias de armas.
- Barreira, nova e estase com energia arcana e recarga; fraquezas elementais.
- Pods acoplados amplificam dano; lançados perseguem inimigos com tiro guiado.
- Três variantes de tanques, robôs e caças com peças e silhuetas adicionais.
- Subchefes com chegada protegida, escudo cíclico e três fases de ataque.
- Arena relativa de 360°: J/L ou toque orbitam chefes e expõem geradores laterais.
- Checkpoints antigos aceitos; apps mantêm a versão anterior destas mecânicas.

## 1.7.0 — Câmeras e navegação ampla (web)

- Área de voo ampliada e perseguição com liberdade de enquadramento.
- Câmeras cockpit, perseguição e combate distante alternadas por C ou toque.
- Cockpit com painel e canhões, preservando projéteis e colisões da missão.
- Recursos disponíveis primeiro na web para validação; apps mantêm voo anterior.

## 1.6.0 — Validação web

- Trajetórias curvas, subida orbital e conduítes espaciais; voo guiado e controles preservados.
- Desafios laterais 2D nos setores 3 e 7, com pausa da campanha e prêmio único no retorno.
- Buraco negro estilizado com disco de acreção no setor final.
- Cinco pinturas no hangar, compradas com créditos e requisitos de acertos; propriedade e escolha persistem no checkpoint.
- Funcionalidades novas desativadas nos aplicativos até validação web. Release deste ciclo não distribui APK/AAB/IPA; metadados de versão permanecem sincronizados para os gates de compatibilidade.

## 1.5.0

- Projeto iOS com Swift Package Manager, pacote offline, versão sincronizada, ícone e manifesto de privacidade. CI compila e inicializa no simulador; assinatura e TestFlight ficam para a conta Apple do titular.

- Aplicativo Android Capacitor 8 com jogo e licenças incluídos, sem dependência de conexão durante a partida; compile/target API 36.
- Pausa idempotente e suspensão de áudio ao sair da atividade, inclusive durante respawn e colapso; retomada explícita preserva a sessão.
- Voltar pausa antes de minimizar. Tela imersiva, orientação de paisagem preferida e HUD/toque respeitando recortes e barras do sistema.
- Projeto Gradle, ícone Nova Wing, scripts de sincronização/APK/AAB e CI com APK debug e AAB release sem assinatura, sem chaves de publicação.

## 1.4.1

- Impulso esgotado encerra sem oscilar entre velocidades ou piscar os jatos; a energia recarrega continuamente enquanto o comando permanece pressionado.
- Comunicação explica como rearmar: soltar Shift/BOOST e pressionar novamente. Teclado, toque e cancelamento compartilham a regra, inclusive entre quadros.
- Regressões de esgotamento em três deltas e controles mistos; capturas WebGL desktop/mobile de impulso esgotado e reativado.

## 1.4.0

- Versionamento SemVer, número na capa, notas por release e GitHub Release após Pages.

- Capa simplificada, ajuda recolhida e painel de combate oculto no menu.
- Proteção de tiro no teclado e de seleção/callout no toque; foco no canvas.
- Extração de entrada para `src/input.js`, com cleanup e regressões.
- README consolidado, mapa de módulos e matriz de specs/testes; harness documentado por responsabilidade e gate.

## 1.3.0

- Boost com jato laranja alongado e rastros periféricos.
- Upgrades alcançáveis em telas estreitas, atração próxima e coleta varrida.
- Pods lançáveis com posição independente, retorno, leque e interceptação de projéteis.
- Dez anatomias de chefes e dez subchefes com identidade e ataques próprios.

## 1.2.0 — Chefes, evolução e trilha dinâmica

- Chefes com placas, canhões, cabos, reatores e dano visual; três etapas, resistência temporal e núcleo com janelas de ataque.
- Subchefe com modelo e barra próprios permanece na arena; encontros não se escondem dentro do túnel.
- Anéis verdes/cruz recuperam escudo e azuis/setas evoluem arma, alternadamente.
- Pods com núcleo, garras e carcaça em três evoluções e formação destacável.
- Colapso de oito segundos, explosões progressivas, destroços e onda de choque antes da recompensa.
- Arranjos musicais com bateria, harmonia e seis estados; proteção contra clipping e artefato WAV de validação.
- Removida imunidade permanente a projéteis na combinação máxima de arma/pods; giro defensivo preservado.

## 1.1.0 — Voo e instalação industrial

- Câmera com paralaxe lateral e inclinação suave; comunicações mais discretas.
- Controles móveis maiores, pressão prolongada protegida e liberação consistente.
- Tanques, robôs articulados, pórticos, reatores e trecho de batalha em túnel.
- Chefes biomecânicos preservando dez silhuetas e pontos fracos.
- Harness ampliado para câmera, colisões, combate terrestre, toque e capturas WebGL.

## 1.0.0 — Campanha Five Cats

- Dez setores, cenários próprios e chefes colossais com geradores destrutíveis.
- Subchefes, rivais, bases-servidor e obstáculos por ambiente.
- Loja, créditos, seis níveis de arma, plasma carregado, pods e três pilotos.
- Dez músicas e tema de chefe; controles independentes de áudio.
- Checkpoints locais e publicação Pages condicionada à CI.
- Testes da campanha completa e capturas de chefes desktop/mobile.

## 0.3.0 — Fundação para desenvolvimento com agentes

- Fontes modulares e HTML único gerado.
- Harness determinístico exercitando a lógica real.
- Documentação, skills de domínio, invariantes e CI.
- Caminho unificado de dano do chefe e proteção de ações fora da partida.

## 0.2.0 — Temática Nova Wing

- Piloto Bia, Marvin e identidade Five Cats.
- Cidade neon, água procedural, lua fragmentada e bloom.

## 0.1.0 — Protótipo de voo

- Missão 3D com inimigos, obstáculos, anéis e chefe.
- Teclado, controles de toque, escudo, bombas e aceleração.
