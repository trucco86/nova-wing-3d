import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
const output = resolve('artifacts/nova-wing-qa126-shot-review');
await mkdir(output,{recursive:true});
const browser = await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context = await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
const page = await context.newPage();
const report = [];
const snaps = [
  {id:'01-city-before-launch',sector:0,query:'citySetpieces=1&encounters=1',pre:22.9},
  {id:'02-real-atmosphere-transition',sector:0,query:'citySetpieces=1&encounters=1',boost:true,after:10},
  {id:'03-real-earth-orbit',sector:0,query:'citySetpieces=1&encounters=1',boost:true,after:40,requireOrbit:true},
  {id:'04-mars-entry',sector:1,query:'encounters=1',pre:18},
  {id:'05-reactor-in-combat',sector:3,query:'qaBoss=3&encounters=1',pre:2,camera:'combat',firing:true},
  {id:'06-purple-core-boss',sector:6,query:'qaBoss=6&encounters=1',pre:2,camera:'combat',firing:true},
  {id:'07-saturn-reveal',sector:7,query:'encounters=1',pre:13,camera:'chase'},
  {id:'08-saturn-dreadnought',sector:7,query:'qaBoss=7&encounters=1',pre:2,camera:'combat',firing:true},
  {id:'09-marvin-face',sector:9,query:'qaBoss=9&encounters=1',pre:1.2},
  {id:'10-reactor-chase-orbit-left',sector:3,query:'qaBoss=3&encounters=1',pre:1.2,camera:'chase',steer:'j',steerSeconds:2.8,firing:true},
  {id:'11-reactor-combat-orbit-right',sector:3,query:'qaBoss=3&encounters=1',pre:0.5,camera:'combat',steer:'l',steerSeconds:3.5,firing:true},
  {id:'12-reactor-cockpit-forward',sector:3,query:'qaBoss=3&encounters=1',pre:1.3,camera:'cockpit',steer:'j',steerSeconds:2,firing:true},
  {id:'13-reactor-chase-elevated',sector:3,query:'qaBoss=3&encounters=1',pre:2.1,camera:'chase',steer:'w',steerSeconds:3,firing:true},
];
try {
  for (const shot of snaps) {
    await page.goto('http://127.0.0.1:4173/__dynamic.html?sector='+shot.sector+'&'+shot.query,{waitUntil:'domcontentloaded',timeout:120000});
    await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:120000});
    if (shot.boost) {
      await page.evaluate(()=>window.fixture.advance(23));
      await page.keyboard.down('Shift');
      await page.evaluate(()=>window.fixture.advance(3.6));
      await page.keyboard.up('Shift');
      const boostPhase=await page.evaluate(()=>window.fixture.game.snapshot().orbitalLaunch.phase);
      if (!['atmosphere','orbit'].includes(boostPhase))throw new Error('BOOST failed to change phase: '+boostPhase);
      await page.evaluate(s=>window.fixture.advance(s),shot.after);
    } else await page.evaluate(s=>window.fixture.advance(s),shot.pre||0);
    if (shot.camera==='combat') {await page.keyboard.press('c');await page.keyboard.press('c');}
    if (shot.camera==='cockpit') await page.keyboard.press('c');
    if (shot.steer) {await page.keyboard.down(shot.steer);await page.evaluate(s=>window.fixture.advance(s),shot.steerSeconds);await page.keyboard.up(shot.steer);}
    if (shot.firing) {await page.keyboard.down('Space');await page.evaluate(()=>window.fixture.advance(0.8));await page.keyboard.up('Space');}
    await page.evaluate(()=>window.fixture.advance(0));
    const snap=await page.evaluate(()=>({sector:window.fixture.game.snapshot().sector,orbital:window.fixture.game.snapshot().orbitalLaunch?.phase,journey:window.fixture.game.snapshot().journey?.phase,render:window.fixture.renderStats(),camera:document.getElementById('cameraView')?.textContent}));
    if(shot.requireOrbit && snap.orbital!=='orbit') throw new Error('Expected orbit; got '+snap.orbital);
    if(!snap.render?.triangles) throw new Error('No game WebGL geometry: '+shot.id);
    await page.screenshot({path:join(output,shot.id+'.jpg'),type:'jpeg',quality:88,timeout:120000});
    report.push({id:shot.id,...snap});
    console.log('[QA126]',shot.id,JSON.stringify(snap));
  }
  await writeFile(join(output,'shot-review.json'),JSON.stringify(report,null,2));
} finally {await browser.close();}
