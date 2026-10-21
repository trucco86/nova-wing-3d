# Plano de captura de gameplay — vídeo do case

**Objetivo:** gravar imagens autênticas da versão publicada para ilustrar o aprendizado sobre desenvolvimento, não apenas fazer um trailer do jogo. Este documento é um checklist de produção; nenhum vídeo foi gravado aqui.

## Configuração recomendada

- Prioridade: **desktop**, 1920×1080, 16:9; alvo de 60 fps **apenas se o jogo e o computador sustentarem**.
- Ferramentas possíveis: OBS Studio, gravador nativo do sistema ou captura do navegador.
- Grave a janela inteira, sem notificações, abas privadas, identificadores ou informações sensíveis.
- Grave ao menos uma sequência **sem cortes**, para servir como prova de gameplay real.
- Depois, capture mobile separadamente: toque, HUD, pausa e opções (rotular dispositivo e navegador).
- Capturar som do jogo e voz em trilhas separadas quando possível; usar trilha/músicas com direitos adequados.
- Não filmar vídeos gerados como se fossem cenas do próprio jogo; distinguir gameplay real de motion graphics.

## Shot list — gravar nesta ordem

| Arquivo sugerido | Duração bruta | Cena e ação | Uso no case |
| --- | --- | --- | --- |
| `01-menu-capa.mp4` | 15–20 s | Capa aprovada; navegar em iniciar/opções | Ideia vira produto |
| `02-hangar-five-cats.mp4` | 20–30 s | Escolher Bia/Jenifer/Christopher/Bob/Calvinho e nave 360° | Incrementos visíveis |
| `03-voo-continuo.mp4` | 40–60 s | Decolar, mover, desviar, atirar, boost, coletar item | Prova do protótipo |
| `04-armas-colisao.mp4` | 20–30 s | Plasma carregado, impacto e explosão | Caso de feedback verificável |
| `05-boss.mp4` | 40–60 s | Chegada do chefe, flancos/núcleo, morte e voo após vitória | Complexidade e regressões |
| `06-hud-pausa-mobile.mp4` | 25–35 s | HUD compacta, pausa, confirmação, opções | Mudança orientada por critérios |
| `07-dev-pipeline.mp4` | 30–45 s | `specs/`, `AGENTS.md`, testes, workflow e PR em GitHub | Engenharia por trás |
| `08-ci-evidencia.mp4` | 15–25 s | Check de um **SHA real** com status e job visíveis | Entrega com evidência |

**Importante:** se uma cena não estiver disponível, marcar como pendente e usar somente gráfico conceitual rotulado, nunca fabricar um vídeo de gameplay.

## Orientação para edição

O tom é o de um case de engenharia: cortes em mudanças de pergunta, não a cada frase. Na narração, mostrar o gameplay no gancho, o protótipo enquanto se fala de feedback, e *tela do código/CI* durante harness e gates. Em caso de screenshot real, adicionar legenda de origem e commit quando relevante.

Inserir legendas PT-BR, taxa de contraste adequada, trilha baixa sob a voz e créditos de assets. Usar vinhetas só quando ajudam a explicar a passagem de **hipótese → spec → validação**.

## Organização sugerida (não obriga nova pasta no repositório)

```text
case-media/
  raw/              # capturas sem corte; NÃO subir arquivos grandes automaticamente
  selects/          # trechos aprovados
  audio/            # narração e trilha licenciada
  exports/          # render final e versões curtas
  manifest.csv      # nome, data, SHA, fonte, licença, status
```

Não publicar gravação de tela sem inspecionar dados privados. O vídeo final pode ser editado em software de sua preferência e linkado no [índice do case](README.md).

[Roteiro e storyboard](VIDEO.md).
