# Combate e espetáculo — 1.2

- Chefe: blindagem detalhada, torres, reatores, cabos e dano visual persistente. Entrada de três segundos; dois geradores e núcleo; três etapas com rajadas sinalizadas e intervalos para esquiva. Resistência por segundo limita a explosão de dano de armas máximas; meta de 45–90 segundos em jogo, sem prometer tempo igual para todos os pilotos.
- Subchefe distinto permanece à frente até ser derrotado. Tem barra própria, rajadas e resistência a bombas; aparece antes do túnel. Túnel aguarda sua derrota e chefe final aguarda a saída do túnel, evitando sobreposição que esconda os encontros.
- Verde vivo com cruz = escudo +25; azul com dupla seta = upgrade de tiro. Materiais exclusivos não mudam quando o canhão evolui. Alternância garante ambos os tipos de anel.
- Pods originais inspirados no conceito de módulos de R-Type: núcleo energético, carcaça, garras e anéis; três evoluções legíveis. Formação frontal/lateral e destacamento via V/toque preservados, com tiros mais fortes e teleguiados no estágio III.
- Ao zerar o núcleo, oito segundos de colapso com pequenas explosões, destroços, clarão gradual, onda de choque e desintegração; só depois crédito, hangar ou vitória. Sem dano ao jogador durante a cena. Pausa/perda de foco congelam e reinício limpa a cena.
- Música: arranjo com acordes, baixo, melodia, arpejo e bateria sintetizada, dez tonalidades/temas, estados de subchefe, chefe, fúria, colapso e vitória. Sem assets proprietários. Reutiliza contexto, respeita mute/pausa e libera nós e vozes. Efeitos independentes da música.

## Evidência

Testes de duração mínima de resistência, mudanças de fase, subchefe persistente e derrotável, cores e coleta de anéis, evolução dos pods, colapso e transição única, pausa/reset, temas e limpeza de áudio. CI WebGL desktop e mobile com capturas de modelos e colapso. Renderização OfflineAudioContext verifica sinal finito e não silencioso, não substitui avaliação musical humana ou teste em aparelhos físicos.
