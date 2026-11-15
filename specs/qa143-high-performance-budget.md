# QA143: gráficos em HIGH com renderização proporcional ao viewport

## Causa principal verificada no código
Em desktops Full HD, ratio=1.7 resulta em 1920×1080×1.7² =
5.992.704 pixels na composição 3D, antes de considerar antialiasing 4×
e os três passes de bloom. A malha e os materiais são os mesmos entre
supersampling 1.7 e 1.3; o supersampling adicional aumenta GPU sem
detalhar o prédio.

## Intervenções
1. Limitar a área interna de HIGH a 3.700.000 pixels em desktop e
   900.000 em pointer-coarse. Manter ratio nominal em telas menores.
   A escala adaptativa continua valendo sobre o ratio capado.
2. Aplicar o mesmo limite em mudança de orientação, sem reconfigurar
   a geometria quando a qualidade não mudou.
3. Manual HIGH preserva geometria sempre. Apenas Auto pode trocar
   High por Medium, se pressão de GPU continuar acima do aceitável.
4. Evitar getObjectByName por frame para subcenas da cidade, beacons
   de publicidade e rotores de máquinas. Referências são por tile e
   não ligadas ao userData para clones corretos.

## Restrições
Sem remover efeitos, transparências, luzes, texturas, sombras,
elementos urbanos, inimigos, HUD, bloom nem MSAA. A redução do nível
de supersampling pode alterar ligeiramente nitidez de pixels no
desktop, mas não reduz detalhes, materiais, resolução de textura ou
design. Nenhum novo collider.

## Medição
- FPS, média, tempo de quadro p95/p99 e presença de stutter.
- Draw calls, triângulos, resolução real, programa e texturas GPU
  (contagens não equivalem a bytes de VRAM).
- Capturas lado a lado QA142/QA143 em Médio/Alto,
  desktop 1920×1080 DPR2, desktop 1440×900 DPR2,
  mobile 932×430 DPR3 e portrait 430×932 DPR3.
- Passar nos testes automatizados e nos Playwright shards.

## Segurança de release
CI anterior #368 tem navegador pendente/insuficiente para merge.
Publicação de preview é isolada. Merge/produção só com aprovação.
