import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join,resolve } from 'node:path';
const dest=resolve('artifacts/nova-wing-qa131-rpg-powers');
const frames=join(dest,'frames');
await mkdir(frames,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
const report={source:'Original Nova Wing game and RPG controls (real browser inputs)',scenes:[],frames:0,notes:'Scenes are discrete real game takes. In editing, never portray time jumps as continuous gameplay.'};
const before=()=>page.evaluate(()=>{const s=window.fixture.game.snapshot();return {state:s.state,arcana:s.strategy?.arcana,level:s.strategy?.stage,weapon:s.strategy?.arsenal,special:s.strategy?.special,robot:s.robotMode,entities:s.entities,render:window.fixture.renderStats()}});
let errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:4173/__dynamic.html?sector=4&xp=8000&pods=3',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:120000});
 await page.evaluate(()=>window.fixture.advance(21));
 await page.keyboard.press('KeyF');
 await page.keyboard.press('KeyF');
 await page.keyboard.press('KeyF');
 let n=0;
 const capture=async(id,setup)=>{
   const pre=await before();
   await setup();
   const activated=await before();
   const start=n;
   const pressed=new Set();
   for(let k=0;k<60;k++){
      const keys=new Set();
      if(k%33<25)keys.add('Space');
      if(k>9&&k<25)keys.add('d');
      if(k>35&&k<48)keys.add('a');
      for(const x of pressed)if(!keys.has(x)){await page.keyboard.up(x);pressed.delete(x);}
      for(const x of keys)if(!pressed.has(x)){await page.keyboard.down(x);pressed.add(x);}
      await page.evaluate(()=>window.fixture.advance(1/30));
      await page.screenshot({path:join(frames,String(n++).padStart(6,'0')+'.jpg'),type:'jpeg',quality:88,animations:'disabled',timeout:120000});
   }
   for(const x of pressed)await page.keyboard.up(x);
   const after=await before();
   report.scenes.push({id,start,frames:60,pre,activated,after});
   console.log('[QA131]',JSON.stringify(report.scenes.at(-1)));
 };
 await capture('01-five-cats-super-formation',async()=>{await page.keyboard.press('KeyO')});
 await page.evaluate(()=>window.fixture.advance(21));
 await capture('02-rpg-nova-blast',async()=>{await page.keyboard.press('KeyH');await page.keyboard.press('KeyG')});
 await page.evaluate(()=>window.fixture.advance(21));
 await capture('03-mecha-plasma-titan',async()=>{await page.keyboard.press('KeyT');await page.keyboard.press('KeyY')});
 report.frames=n;
 if(n!==180)throw Error('180 distinct captured frames required');
 if(errors.length)throw Error('Browser errors: '+errors.join(';'));
 if(!report.scenes.every(x=>x.after.render?.triangles>0))throw Error('Missing true 3D scene geometry');
 const a=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','30','-i',join(frames,'%06d.jpg'),'-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p','-r','30','-movflags','+faststart',join(dest,'nova-wing-qa131-rpg-fivecats-nova-robot-plasma-6s.mp4')],{encoding:'utf8',maxBuffer:1e6});
 if(a.status!==0)throw Error('FFmpeg: '+a.stderr);
 await writeFile(join(dest,'provenance.json'),JSON.stringify(report,null,2));
 console.log('[complete] 6s RPG gameplay capture');
}finally{await browser.close();}
