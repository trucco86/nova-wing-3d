/**
 * Progressive title navigation. Keeps the original Five Cats artwork and the
 * original game actions in the DOM; this module only changes presentation.
 */
export function installTitleFlow(doc = document) {
  const menu = doc.getElementById('menu');
  const content = menu?.querySelector('.title-content');
  const oldSquad = doc.getElementById('prepareSquad');
  if (!menu || !content || !oldSquad) return () => {};

  const css = doc.createElement('style');
  css.id = 'nova-title-flow-styles';
  css.textContent = `
    #menu.nova-title-flow { position:relative; isolation:isolate; }
    #menu.nova-title-flow.nova-gate-open { overflow:hidden; display:flex; justify-content:center; }
    #menu.nova-title-flow.nova-gate-open .title-content,
    #menu.nova-title-flow.nova-gate-open .title-brand,
    #menu.nova-title-flow.nova-gate-open .title-footer { display:none !important; }
    #menu.nova-title-flow .nova-gate {
      display:none; position:relative; z-index:8; min-height:100%; width:100%;
      flex-direction:column; align-items:center; justify-content:flex-end;
      padding: max(32px, 6vh) 20px max(38px, 10vh);
      text-align:center; pointer-events:none;
    }
    #menu.nova-title-flow.nova-gate-open .nova-gate { display:flex; }
    #menu.nova-title-flow .nova-gate-heading { color:#f0fbff; font-size:clamp(34px,7vw,90px);
      font-weight:800; line-height:1; letter-spacing:.11em; text-shadow:0 4px 28px #010a14; }
    #menu.nova-title-flow .nova-gate-subtitle { font-size:clamp(11px,1.5vw,16px);
      color:#b4ffec; letter-spacing:.24em; margin:8px 0 22px; text-shadow:0 2px 12px #030c14; }
    #menu.nova-title-flow .nova-gate-start { pointer-events:auto; border:1px solid #7cebd5;
      background:#061b2edb; color:#f3ffff; font-size:clamp(17px,2.6vw,25px);
      letter-spacing:.16em; padding:14px 36px; border-radius:8px; cursor:pointer;
      box-shadow:0 0 22px #42c7cd44; animation:nova-start-pulse 2.2s ease-in-out infinite; }
    #menu.nova-title-flow .nova-gate-start:focus-visible,
    #menu.nova-title-flow .nova-nav button:focus-visible { outline:3px solid #94ffe4; outline-offset:3px; }
    @keyframes nova-start-pulse { 50% { box-shadow:0 0 35px #5effcf88; } }
    #menu.nova-title-flow:not(.selecting) { background-position:center !important; }
    #menu.nova-title-flow:not(.nova-gate-open) .title-content { width:min(450px,92vw); }
    #menu.nova-title-flow:not(.nova-gate-open):not(.selecting) h1 {
      font-size:clamp(46px,6vw,90px); margin:0 0 12px;
    }
    #menu.nova-title-flow:not(.nova-gate-open):not(.selecting) #brief {
      font-size:12px; margin:0 0 18px;
    }
    #menu.nova-title-flow .nova-nav { display:grid; gap:10px; max-width:320px; margin:0 0 12px; }
    #menu.nova-title-flow .nova-nav button { cursor:pointer; padding:14px 18px;
      text-align:center; border:1px solid #6ce9d288; border-radius:8px; background:#071a2ce8;
      color:#e8ffff; font:700 16px 'Chakra Petch',sans-serif; letter-spacing:.08em; }
    #menu.nova-title-flow .nova-nav button[aria-current="page"] {
      background:#183f49f0; border-color:#88ffe1; }
    #menu.nova-title-flow .nova-subheading { display:none; color:#aef5e5;
      font-size:13px; letter-spacing:.16em; margin:0 0 12px; }
    #menu.nova-title-flow .nova-back { display:none; border:1px solid #7799a1;
      color:#d5f2f4; background:#061826c9; padding:10px 16px; border-radius:8px;
      margin-bottom:12px; cursor:pointer; }
    #menu.nova-title-flow .title-actions,
    #menu.nova-title-flow .title-extras,
    #menu.nova-title-flow .title-help,
    #menu.nova-title-flow #novaAuth,
    #menu.nova-title-flow #novaRanking,
    #menu.nova-title-flow #developerPanel { display:none !important; }
    #menu.nova-title-flow.nova-section-play .title-actions,
    #menu.nova-title-flow.nova-section-hangar .title-actions,
    #menu.nova-title-flow.nova-section-extras .title-actions { display:grid !important; }
    #menu.nova-title-flow.nova-section-extras .title-extras { display:flex !important; flex-wrap:wrap; gap:8px; }
    #menu.nova-title-flow.nova-section-extras .title-help,
    #menu.nova-title-flow.nova-section-extras #novaAuth:not([hidden]),
    #menu.nova-title-flow.nova-section-extras #novaRanking,
    #menu.nova-title-flow.nova-section-extras #developerPanel:not([hidden]) { display:block !important; }
    #menu.nova-title-flow.nova-section-play #prepareSquad,
    #menu.nova-title-flow.nova-section-play #optionsFromMenu,
    #menu.nova-title-flow.nova-section-hangar #prepareSquad,
    #menu.nova-title-flow.nova-section-hangar #optionsFromMenu { display:none !important; }
    #menu.nova-title-flow.nova-section-extras .mission-entry,
    #menu.nova-title-flow.nova-section-extras #continue { display:none !important; }
    #menu.nova-title-flow.nova-section-extras .nova-subheading,
    #menu.nova-title-flow.nova-section-hangar .nova-subheading,
    #menu.nova-title-flow.nova-section-play .nova-subheading,
    #menu.nova-title-flow.nova-section-extras .nova-back,
    #menu.nova-title-flow.nova-section-hangar .nova-back,
    #menu.nova-title-flow.nova-section-play .nova-back { display:block; }
    #menu.nova-title-flow:not(.nova-section-main) .nova-nav { display:none; }
    #menu.nova-title-flow.nova-section-main #squadSelection { display:none !important; }
    #menu.nova-title-flow.nova-section-hangar #squadSelection:not([hidden]) { display:block; }
    #menu.nova-title-flow .nova-gate { background:linear-gradient(0deg,#04111fdd 0%,#04111f55 25%,transparent 62%); }
    @media(max-width:700px) {
      #menu.nova-title-flow.nova-gate-open { padding:0 !important; }
      #menu.nova-title-flow.nova-gate-open .nova-gate { padding:14px 12px max(20px,5vh); }
      #menu.nova-title-flow .nova-gate-heading { font-size:clamp(26px,6vw,47px); }
      #menu.nova-title-flow .nova-gate-subtitle { margin:5px 0 10px; font-size:10px; }
      #menu.nova-title-flow .nova-gate-start { padding:10px 24px; font-size:15px; }
      #menu.nova-title-flow:not(.nova-gate-open) .title-content { width:92vw; }
      #menu.nova-title-flow .nova-nav { max-width:100%; gap:7px; }
      #menu.nova-title-flow .nova-nav button { padding:9px; font-size:13px; }
    }
    @media(prefers-reduced-motion:reduce) { #menu.nova-title-flow .nova-gate-start { animation:none; } }
  `;
  doc.head.append(css);

  const gate = doc.createElement('div');
  gate.className = 'nova-gate';
  gate.innerHTML = '<strong class="nova-gate-heading">NOVA WING</strong><span class="nova-gate-subtitle">FIVE CATS · FLIGHT SQUADRON</span><button type="button" class="nova-gate-start" id="novaPressStart">PRESS START</button>';
  menu.append(gate);

  const nav = doc.createElement('nav');
  nav.className = 'nova-nav';
  nav.setAttribute('aria-label', 'Navegação principal');
  nav.innerHTML = '<button type="button" data-nova-section="play">JOGAR</button><button type="button" data-nova-section="hangar">HANGAR</button><button type="button" data-nova-section="extras">EXTRAS</button>';
  const back = doc.createElement('button');
  back.type = 'button';
  back.className = 'nova-back';
  back.textContent = '← MENU PRINCIPAL';
  const heading = doc.createElement('div');
  heading.className = 'nova-subheading';
  content.insertBefore(nav, content.querySelector('.title-actions'));
  content.insertBefore(back, nav);
  content.insertBefore(heading, nav);

  const sections = ['main', 'play', 'hangar', 'extras'];
  let current = 'main';
  function select(section) {
    if (!sections.includes(section)) return;
    if (current === 'hangar' && section !== 'hangar' && !doc.getElementById('squadSelection').hidden) oldSquad.click();
    if (section === 'hangar' && doc.getElementById('squadSelection').hidden && !oldSquad.hidden) oldSquad.click();
    current = section;
    for (const item of sections) menu.classList.toggle('nova-section-' + item, item === section);
    heading.textContent = ({play:'CAMPANHA',hangar:'OS FIVE CATS · PILOTOS E NAVES',extras:'EXTRAS E CONFIGURAÇÕES'})[section] || '';
    nav.querySelectorAll('[data-nova-section]').forEach(button => {
      if (button.dataset.novaSection === section) button.setAttribute('aria-current','page');
      else button.removeAttribute('aria-current');
    });
    menu.scrollTop = 0;
  }
  menu.classList.add('nova-title-flow','nova-gate-open');
  select('main');
  const press = gate.querySelector('button');
  function enter() {
    if (!menu.classList.contains('nova-gate-open')) return;
    menu.classList.remove('nova-gate-open');
    nav.querySelector('button')?.focus({preventScroll:true});
  }
  press.addEventListener('click', enter);
  back.addEventListener('click',()=>select('main'));
  nav.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>select(button.dataset.novaSection)));
  // Keyboard access is intentionally limited to the title state.
  const onKey = event => {
    if (!doc.body.classList.contains('menu') || !menu.classList.contains('nova-gate-open')) return;
    if (event.key === 'Enter' || event.key === ' ') {
      if (event.target === doc.body || event.target === press || event.target === menu) {
        event.preventDefault(); enter();
      }
    }
  };
  doc.addEventListener('keydown', onKey);
  const observer = new MutationObserver(()=>{
    if (doc.body.classList.contains('menu') && !menu.classList.contains('nova-gate-open') && current !== 'main') {
      // Existing game code may toggle menu visibility; preserve submenu in-session.
    }
  });
  observer.observe(doc.body,{attributes:true,attributeFilter:['class']});
  return () => { doc.removeEventListener('keydown',onKey); observer.disconnect(); css.remove(); gate.remove(); nav.remove(); back.remove(); heading.remove(); };
}
