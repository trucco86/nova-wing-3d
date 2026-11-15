import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join,resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const base='http://127.0.0.1:4173';
const dest=resolve('artifacts/nova-wing-qa131-showcase');
const frames=join(dest,'frames');
await mkdir(frames,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1,reducedMotion:'reduce'});
const page=await context.newPage();
const report={source:'Actual Nova Wing HTML/CSS/WebGL; click-driven hangar and QA-only progression; not promotional mockups',captures:[],errors:[]};
page.on('pageerror',e=>report.errors.push(e.message));
async function snap(id){
 await page.screenshot({path:join(dest,id+'.png'),animations:'disabled',timeout:120000});
 report.captures.push({id,at:new Date().toISOString()});
 console.log('[shot]',id);
}
try{
  // 1) Actual public player setup: original five pilot portraits & 3D models.
  await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:120000});
  await page.locator('#pressStart').click();
  await page.locator('#menuHangar').click();
  await page.locator('#squadSelection').waitFor({state:'visible'});
  await page.locator('#pilot-bia').click();
  await snap('01-hangar-pilots-bia');
  await page.locator('#pilot-christopher').click();
  await snap('02-hangar-pilots-christopher');
  await page.locator('#hangarTabShips').click();
  await page.locator('#ship-specter').click();
  await snap('03-hangar-ships-specter');
  await page.locator('#ship-aegis').click();
  await snap('04-hangar-ships-aegis');
  await page.locator('#hangarTabArsenal').click();
  await page.locator('#loadoutCatalog').evaluate(n=>n.open=true);
  await snap('05-hangar-arsenal-gallery');
  // 2) Earn credits and buy real weapon, armor and pod upgrades, visible in shop.
  await page.goto(base+'/__dynamic.html?sector=1&encounters=1',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:120000});
  await page.evaluate(()=>window.fixture.hangar());
  await page.locator('#shop').waitFor({state:'visible',timeout:90000});
  await snap('06-upgrade-before');
  for(const id of ['buyweapon','buyvolley','buyrapid','buypods','buyarmor']){
    const btn=page.locator('#'+id);
    if(await btn.isEnabled())await btn.click();
  }
  await snap('07-upgrade-after-real-purchases');
  // 3) Advanced loadout, actual RPG system and actual game combat.
  await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:120000});
  await page.locator('#pressStart').click();
  await page.locator('#menuQA').click();
  await page.locator('#developerPanel > summary').click();
  await page.locator('#developerSector').selectOption('4');
  await page.locator('#developerEncounter').selectOption('stage');
  await page.locator('#developerTier').selectOption('18');
  await page.locator('#developerShip').selectOption('aegis');
  await page.locator('#developerArsenal').selectOption('3');
  await page.locator('#developerSpecial').selectOption('1');
  await page.locator('#developerLaunch').click();
  await page.waitForFunction(()=>document.body.classList.contains('in-mission') && document.querySelector('#menu').hidden,{timeout:120000});
  await page.locator('#strategyDrawer').evaluate(n=>n.open=true);
  await snap('08-rpg-upgraded-stage-level');
  await page.locator('#strategyDrawer').evaluate(n=>n.open=false);
  const frameMetrics=[];
  for(let i=0;i<180;i++){
    if(i===10)await page.keyboard.press('KeyT');
    if(i===24)await page.keyboard.press('KeyG');
    if(i===65)await page.keyboard.press('KeyY');
    if(i===112)await page.keyboard.press('KeyO');
    if(i%38===0)await page.keyboard.down('Space');
    if(i%38===24)await page.keyboard.up('Space');
    if(i%35===1)await page.keyboard.down('d');
    if(i%35===14)await page.keyboard.up('d');
    await page.evaluate(()=>window.fixture.advance(1/30));
    if(i%20===0){
      const s=await page.evaluate(()=>({snap:window.fixture.game.snapshot(),render:window.fixture.renderStats()}));
      frameMetrics.push({frame:i,entities:s.snap.entities,robot:s.snap.robotMode,arcana:s.snap.strategy?.arcana,render:s.render});
    }
    await page.screenshot({path:join(frames,String(i).padStart(6,'0')+'.jpg'),type:'jpeg',quality:88,animations:'disabled',timeout:120000});
  }
  await page.keyboard.up('Space');await page.keyboard.up('d');
  report.frameMetrics=frameMetrics;
  const encode=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','30','-i',join(frames,'%06d.jpg'),'-c:v','libx264','-preset','veryfast','-crf','21','-r','30','-pix_fmt','yuv420p','-movflags','+faststart',join(dest,'09-rpg-abilities-mecha-6s.mp4')],{encoding:'utf8',maxBuffer:1e6});
  if(encode.status!==0)throw Error('ffmpeg encoding failure '+encode.stderr);
  if(frameMetrics.every(m=>!m.render || m.render.triangles<=0))throw Error('No rendered 3D geometry in RPG clip');
  if(report.errors.length)throw Error('Browser errors: '+report.errors.join(';'));
  await writeFile(join(dest,'provenance.json'),JSON.stringify(report,null,2));
  console.log('[complete] assets 8 png + 6s RPG screenshot-by-screenshot gameplay');
}finally{await browser.close()}
