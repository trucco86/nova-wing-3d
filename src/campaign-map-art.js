/**
 * Lightweight, self-contained concept art for the galaxy campaign UI.
 * Each route card gets distinct vector scenery without image downloads,
 * canvases, WebGL allocations, or assets that can block offline play.
 */
const SKY = {
  city: ['#073a58', '#19bdda', '#ffbd76'],
  mars: ['#582919', '#ff7c43', '#ffd09a'],
  asteroids: ['#131c3c', '#7894d0', '#e9a3ff'],
  station: ['#0c2a45', '#78d8ff', '#f47588'],
  sun: ['#2b2054', '#40c8ff', '#ef69ff'],
  ice: ['#123b5e', '#7bcaff', '#f5fcff'],
  nebula: ['#341657', '#ac5af6', '#f59aff'],
  fleet: ['#232b4a', '#ffc789', '#f5e0ae'],
  void: ['#121336', '#5c5ed0', '#d08dff'],
  throne: ['#1d1c39', '#fc6081', '#ffae7d'],
};
const ART = {
  city: [
    '<path d="M0 188 L0 120 35 120 35 76 68 76 68 130 100 130 100 56 128 56 128 15 141 15 141 56 167 56 167 141 197 141 197 42 226 42 226 105 261 105 261 73 298 73 298 133 328 133 328 29 349 29 349 10 362 10 362 29 393 29 393 123 429 123 429 70 463 70 463 188Z" fill="#0b304c"/>',
    '<path d="M0 215 L0 165 58 165 58 143 94 143 94 186 137 186 137 113 159 113 159 159 218 159 218 131 257 131 257 187 295 187 295 148 340 148 340 185 400 185 400 124 437 124 437 174 480 174 480 240 0 240Z" fill="#164662"/>',
    '<g fill="#70dcff" opacity=".75"><path d="M107 65h3v11h-3zm9 0h3v11h-3zm9 0h3v11h-3zm74-13h4v13h-4zm11 0h4v13h-4zm116-12h3v14h-3zm12 0h3v14h-3zM39 144h4v9h-4zm12 0h4v9h-4zm318 25h5v12h-5zm14 0h5v12h-5z"/></g>',
    '<path d="M185 97l27 -5 12 5 25 -2 -22 8 -14 -2z" fill="#ffe8ba"/><path d="M203 99l-19 5 32 -1z" fill="#5ae6ff"/>',
    '<path d="M0 220Q100 195 230 226T480 208" fill="none" stroke="#54edff" stroke-width="3" opacity=".65"/>',
  ],
  mars: [
    '<circle cx="356" cy="65" r="76" fill="#fa8d5d" opacity=".73"/>',
    '<circle cx="333" cy="40" r="19" fill="#783d35" opacity=".23"/><circle cx="390" cy="84" r="12" fill="#783d35" opacity=".25"/>',
    '<path d="M0 176 72 98 108 146 157 66 217 165 290 135 321 110 376 182 480 143 480 240H0z" fill="#8c3b36"/>',
    '<path d="M0 192Q95 149 160 183T307 174 480 189V240H0Z" fill="#da6c43"/>',
    '<path d="M0 228Q116 188 229 220T480 205" fill="none" stroke="#ffce86" stroke-width="5" opacity=".5"/>',
    '<path d="M250 175v-39h5v39m12 1v-57h7v57m-20-34h24" fill="none" stroke="#ffd09a" stroke-width="3" opacity=".7"/>',
  ],
  asteroids: [
    '<path d="M85 83 130 22 190 45 214 111 155 151 100 132Z" fill="#62728e"/>',
    '<path d="M330 31 403 58 444 121 419 173 349 152 310 78Z" fill="#495f84"/>',
    '<path d="M201 159 230 110 283 140 285 211 231 225Z" fill="#8d83aa"/>',
    '<path d="M94 81 130 22 142 83 112 115zm235-39 74 16 -49 45z" fill="#b9abc9" opacity=".47"/>',
    '<ellipse cx="245" cy="123" rx="150" ry="55" fill="none" stroke="#95ccff" stroke-width="6" opacity=".43" transform="rotate(-25 245 123)"/>',
    '<path d="m36 205 22-37 41 6 9 36-30 22zm394-23 30-19 22 23-6 38-39-11z" fill="#7a81a5"/>',
  ],
  station: [
    '<circle cx="268" cy="121" r="132" fill="#203e5b" stroke="#6aaeca" stroke-width="5"/>',
    '<circle cx="268" cy="121" r="108" fill="#0a223a" stroke="#6dcfff" stroke-width="5" opacity=".78"/>',
    '<circle cx="268" cy="121" r="78" fill="none" stroke="#3d719e" stroke-width="17" stroke-dasharray="35 17"/>',
    '<circle cx="268" cy="121" r="46" fill="#942e58" opacity=".8"/><circle cx="268" cy="121" r="21" fill="#ff979c"/>',
    '<path d="M0 240 205 127 238 140 128 240zM480 240 325 127 293 140 364 240z" fill="#153a58"/>',
    '<path d="m0 240 200-114m280 114L330 125" stroke="#70d9ff" stroke-width="4" opacity=".65"/>',
  ],
  sun: [
    '<circle cx="246" cy="118" r="89" fill="none" stroke="#36d2ff" stroke-width="23" opacity=".38"/>',
    '<circle cx="246" cy="118" r="52" fill="none" stroke="#b06dff" stroke-width="11" opacity=".75"/>',
    '<circle cx="246" cy="118" r="30" fill="#e883ff"/>',
    '<path d="M0 90Q120 210 245 121T480 62M0 176Q132 49 246 118T480 188" fill="none" stroke="#59d9ff" stroke-width="15" opacity=".6"/>',
    '<path d="m30 25 38 30-16 23-38-21m395 147 44-25 18 24-41 26m-230-213 24-38 20 14-14 39" fill="#e56fff" opacity=".8"/>',
  ],
  ice: [
    '<circle cx="390" cy="44" r="72" fill="#a7dfff" opacity=".48"/>',
    '<path d="M0 187 71 87 107 145 159 33 210 173 250 120 299 45 359 161 413 71 480 178V240H0Z" fill="#83c7e4"/>',
    '<path d="M71 87 96 118 85 122zM159 33l25 85 -39 -26zM299 45l29 86-46-54zM413 71l30 69-45-35z" fill="#eafcff"/>',
    '<path d="M0 206Q80 181 174 212T369 198 480 211V240H0" fill="#b2e6f0"/>',
    '<path d="M40 220h380" stroke="#f5ffff" opacity=".55" stroke-width="4"/>',
  ],
  nebula: [
    '<circle cx="240" cy="122" r="110" fill="#b460ff" opacity=".22"/>',
    '<circle cx="240" cy="122" r="78" fill="none" stroke="#bf84ff" stroke-width="26" opacity=".65"/>',
    '<circle cx="240" cy="122" r="50" fill="#64359e"/><circle cx="240" cy="122" r="26" fill="#f5a6ff"/>',
    '<path d="M0 195Q105 38 240 120T480 58M0 48Q125 210 240 125T480 216" fill="none" stroke="#ad4df0" stroke-width="22" opacity=".35"/>',
    '<g stroke="#e9b9ff" stroke-width="3" opacity=".8"><path d="m240 8v41m0 145v41M108 121h56m152 0h58M147 34l26 29m126 116 28 30m0-172-29 27M175 178l-29 32"/></g>',
  ],
  fleet: [
    '<ellipse cx="355" cy="85" rx="126" ry="105" fill="#d7aa79"/>',
    '<ellipse cx="355" cy="85" rx="189" ry="37" transform="rotate(-17 355 85)" fill="none" stroke="#ffe6b4" stroke-width="22" opacity=".83"/>',
    '<ellipse cx="355" cy="85" rx="164" ry="29" transform="rotate(-17 355 85)" fill="none" stroke="#a87c64" stroke-width="6"/>',
    '<ellipse cx="355" cy="85" rx="126" ry="105" fill="none" stroke="#ffe8ad" stroke-width="2" opacity=".5"/>',
    '<path d="m36 177 57-28 41 11-17 25-62 16zm112 21 44-25 38 9-18 22-53 14z" fill="#7d95b5"/>',
    '<path d="m120 209 14-13 17 4-7 12z" fill="#fabd77"/>',
  ],
  void: [
    '<circle cx="240" cy="120" r="117" fill="#ac61ea" opacity=".12"/>',
    '<ellipse cx="240" cy="120" rx="137" ry="85" transform="rotate(-26 240 120)" stroke="#7d7ef4" stroke-width="23" fill="none" opacity=".7"/>',
    '<ellipse cx="240" cy="120" rx="104" ry="62" transform="rotate(39 240 120)" stroke="#d58bff" stroke-width="12" fill="none" opacity=".65"/>',
    '<circle cx="240" cy="120" r="47" fill="#070d25"/><circle cx="240" cy="120" r="50" stroke="#c799ff" stroke-width="3" fill="none"/>',
    '<path d="M0 95Q126 200 229 120T480 141" fill="none" stroke="#5bd6fa" stroke-width="9" opacity=".4"/>',
  ],
  throne: [
    '<path d="M167 240 150 98 208 35 269 23 331 55 358 113 337 240Z" fill="#172236"/>',
    '<path d="m165 101 52-65 43 18 38-10 38 55-25 72-96 7z" fill="#34344b" stroke="#b25d79" stroke-width="3"/>',
    '<path d="m182 123 66 14 77-16-26 29-98-1z" fill="#ff4c68"/>',
    '<path d="m176 112 44 19m109-19-43 19" stroke="#ffe0b1" stroke-width="5"/>',
    '<path d="M170 169 113 196 76 240h321l-54-56-24-15-70 50z" fill="#282942" stroke="#eb5473" stroke-width="4"/>',
    '<path d="m247 158 0 65m-46-42 11 25m86-25-12 25" stroke="#ff6d89" stroke-width="4"/>',
  ],
};

function starfield() {
  const stars = [];
  for (let i = 0; i < 27; i++) {
    const x = (i * 79 + 31) % 479;
    const y = (i * 53 + 17) % 231;
    stars.push(
      '<circle cx="' +
        x +
        '" cy="' +
        y +
        '" r="' +
        (i % 7 === 0 ? 1.7 : 0.75) +
        '" fill="#d8f4ff" opacity="' +
        (i % 5 === 0 ? '.85' : '.43') +
        '"/>',
    );
  }
  return stars.join('');
}
const STARS = starfield();
const CACHE = new Map();

export function campaignSectorArtwork(theme) {
  if (CACHE.has(theme)) return CACHE.get(theme);
  const [dark, tint, glow] = SKY[theme] ?? SKY.void;
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 240" preserveAspectRatio="xMidYMid slice">' +
    '<defs><linearGradient id="space" x1="0" y1="0" x2="1" y2="1"><stop stop-color="' +
    dark +
    '"/><stop offset=".68" stop-color="' +
    tint +
    '" stop-opacity=".45"/><stop offset="1" stop-color="' +
    dark +
    '"/></linearGradient>' +
    '<radialGradient id="atmo"><stop stop-color="' +
    glow +
    '" stop-opacity=".4"/><stop offset="1" stop-color="' +
    tint +
    '" stop-opacity="0"/></radialGradient></defs>' +
    '<rect width="480" height="240" fill="url(#space)"/><ellipse cx="340" cy="70" rx="200" ry="150" fill="url(#atmo)"/>' +
    STARS +
    (ART[theme] ?? ART.void).join('') +
    '</svg>';
  const value = 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  CACHE.set(theme, value);
  return value;
}
