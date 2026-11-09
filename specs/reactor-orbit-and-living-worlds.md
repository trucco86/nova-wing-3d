# Nova Wing — órbita física e cenários vivos

Status: candidata em QA na PR #245, sobre a PR #240. Não autoriza publicação.

## Contrato da fase 4

O jogador pilota nave ou robô no espaço interno da Devastador. A nave e a câmera orbitam o reator fixo; o salão, os quatro setores de maquinaria e o núcleo não giram em torno do jogador. A representação de renderização é transformada em torno do centro do reator, preservando o referencial lógico de colisões, hitboxes, tiros, mira, bombas e persistência. Um erro de renderização deve restaurar a transformação de cena.

O salão deve manter folga em 360 graus. Os componentes do reator, seus HP, sua ordem de sabotagem, o HUD de radar e os controles J/L e toque não mudam. A arquitetura externa da nave-mãe não pode reaparecer na arena.

## Contrato de camadas de mundo

Todos os dez biomas recebem duas camadas distintas: segundo plano com tráfego ou atividade relativamente rápida e terceiro plano de escala maior, movimento mais lento e profundidade. Os elementos extras não podem ser colisíveis, oferecer alvos, gerar pontuação ou tapar o retículo central. O número de draw calls adicionais deve ficar limitado aos meshes instanciados.

Os perfis são diferentes para cidade, Marte, asteroides, nave-mãe, sol/Vênus, gelo/Europa, nebulosa, frota/Saturno, vazio/Órion e trono/Titã. Alta qualidade exibe mais instâncias; qualidade média reduz densidade preservando leitura. Repetir o mesmo tempo simulado não movimenta o cenário. Pausar congela a atividade.

## Contrato dos chefes

Todos os dez chefes precisam de blindagem, mecanismos articulados e sinais de energia associados à sua identidade. Movimento depende do tempo simulado e do estado de combate. Nenhuma peça decorativa muda hitboxes, posição dos geradores, origens dos tiros, vida ou orçamento de projéteis. A fase quatro usa seu próprio núcleo sabotável e salão industrial; a identidade do chefe final permanece preservada.

## Homologação visual necessária

1. Fase quatro: escolher TESTAR FASES no ambiente QA, entrar no núcleo e segurar J/L; observar a nave percorrendo 360 graus ao redor do reator, o salão parado no referencial global e ausência de clipping.
2. Fases 1 a 3: observar tráfego e profundidade sem poluição do HUD, entrada em Marte, turbulência e espaço do asteroide.
3. Fases 5 a 10: verificar assinatura distinta do segundo e terceiro planos, movimento contínuo, sem repetição de portal artificial genérico.
4. Chefes: avaliar formas e mecanismos nos dez encontros, inclusive as partes traseiras, laterais e o caça final de Marvin.
5. Alternar Alto/Médio em desktop e celular horizontal; medir FPS, draw calls e falhas de renderização. Garantir estabilidade e preservar controles, pausa/reinício, mira e áudio.
6. Conferir o SHA final, quality Node, quatro shards Playwright, preview Cloudflare e aceite humano antes de merge ou produção.

## Evidência e pendências

A PR usa testes automatizados de transformação da órbita, restauração do estado de render, profundidade determinística, limites de draw calls e geometria decorativa dos chefes. A preparação de QA aprovou 522 testes Node; o preview FAST aprovou 50 testes na revisão anterior ao commit sincronizado do bundle. Os shards Playwright e a homologação visual em aparelho físico permanecem sujeitos a verificação no SHA final.
