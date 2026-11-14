import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve, join } from 'node:path';
const dest=resolve('artifacts/nova-wing-qa128-enemy-waves');
const frameDir=join(dest,'frames');
await mkdir(frameDir,{recursive:true});
const scenes=[
  {id:'mars-combat-wave',sector:1,candidates:[30,36,42,48,54,60]},
  {id:'venus-plasma-wave',sector:4,candidates:[27,35,44,52,63,70]},
  {id:'neptune-swarm',sector:6,candidates:[26,34,43,51,62,72]},
];
const fps=30;
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
const report={source:'Nova Wing real Three.js engine, no generated enemies or compositing',nativeFps:30,scenes:[],frames:0};
const url=s=>'http://127.0.0.1:4173/__dynamic.html?sector='+s.sector+'&encounters=1';
async function load(scene,at){
  await page.goto(url(scene),{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:120000});
  await page.evaluate(at=>window.fixture.advance(at),at);
  return page.evaluate(()=>{const state=window.fixture.game.snapshot();return {enemies:state.entities.enemies,hostile:state.entities.hostile,render:window.fixture.renderStats(),state:state.state}});
}
try{
  let n=0;
  for(const sc of scenes){
    let winner={seconds:sc.candidates[0],score:-1};
    for(const at of sc.candidates){
      const p=await load(sc,at);
      const score=(p.enemies||0)*2+(p.hostile||0)*0.4;
      if(p.state==='playing' && score>winner.score)winner={seconds:at,score,enemies:p.enemies,hostile:p.hostile};
    }
    await load(sc,winner.seconds);
    const start=n;let maxEnemies=0;const sampled=[];
    const pressed=new Set();
    for(let i=0;i<120;i++){
      const keys=new Set();
      if(i%35<27)keys.add('Space');
      if(i%55<18) keys.add('d');
      else if(i%55>=18 && i%55<36)keys.add('a');
      if(i%68>45 && i%68<62)keys.add('w');
      for(const x of pressed)if(!keys.has(x)){await page.keyboard.up(x);pressed.delete(x)}
      for(const x of keys)if(!pressed.has(x)){await page.keyboard.down(x);pressed.add(x)}
      await page.evaluate(()=>window.fixture.advance(1/30));
      if(i%12===0){
        const e=await page.evaluate(()=>window.fixture.game.snapshot().entities);
        sampled.push(e);maxEnemies=Math.max(maxEnemies,e.enemies);
      }
      await page.screenshot({path:join(frameDir,String(n++).padStart(6,'0')+'.jpg'),type:'jpeg',quality:87,timeout:120000,animations:'disabled'});
    }
    for(const x of pressed)await page.keyboard.up(x);
    report.scenes.push({id:sc.id,sector:sc.sector,firstFrame:start,frames:n-start,selection:winner,maxEnemies,sampled});
    console.log('[QA128 enemy reel]',JSON.stringify(report.scenes.at(-1)));
  }
  report.frames=n;
  if(n!==360)throw Error('Expected 360 distinct real WebGL frames');
  const present=report.scenes.filter(s=>s.maxEnemies>=2).length;
  if(present<1)console.warn('QA128: no dense wave with >=2 simultaneously active enemies, capture is documentary only');
  const out=join(dest,'nova-wing-qa128-real-enemies-720p30-12s.mp4');
  const args=['-hide_banner','-loglevel','error','-y','-framerate','30','-i',join(frameDir,'%06d.jpg'),
    '-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p','-r','30','-t','12','-movflags','+faststart',out];
  const enc=spawnSync('ffmpeg',args,{encoding:'utf8',maxBuffer:1e6});
  if(enc.status!==0)throw Error('Encode failed: '+enc.stderr);
  await writeFile(join(dest,'provenance.json'),JSON.stringify(report,null,2));
  console.log('[complete]',out);
}finally{await browser.close();}
