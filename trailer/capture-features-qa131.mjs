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
  await page.goto(base+'/__dynamic.html?sector=0',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:120000});
  await page.evaluate(()=>window.fixture.hangar());
  await page.locator('#shop').waitFor({state:'visible',timeout:30000});
  await snap('06-upgrade-before');
  for(const id of ['buyweapon','buyvolley','buyrapid','buypods','buyarmor']){
    const btn=page.locator('#'+id);
    if(await btn.isEnabled())await btn.click();
  }
  await snap('07-upgrade-after-real-purchases');
  await writeFile(join(dest,'provenance.json'),JSON.stringify(report,null,2));
  if(report.errors.length)throw Error('Browser errors: '+report.errors.join(';'));
  console.log('[complete] Real hangar pilots, ships, arsenal and upgrade purchase screenshots');
}finally{await browser.close()}
