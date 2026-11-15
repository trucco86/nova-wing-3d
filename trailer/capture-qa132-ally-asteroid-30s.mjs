import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve, join } from 'node:path';

const output = resolve('artifacts/nova-wing-qa132-trailer-extensions');
const frameDir = join(output, 'frames');
await mkdir(frameDir,{recursive:true});
const fps=30;
const scenes=[
  // Authored QA126 real gameplay: second ally sortie arrives into atmospheric
  // combat at t=42, escorts and exits tangentially by ~t=50.2.
  {id:'qa126-ascent-allied-escort',sector:0,seconds:10,stage:'atmosphere',opening:true},
  // Physical asteroid course: do not mock walls, hide collisions or teleport.
  {id:'asteroid-cavern-real-course',sector:2,seconds:9,stage:'asteroid',opening:24},
  // Different classes and climates of regular real enemies.
  {id:'venus-plasma-fighters',sector:4,seconds:6,stage:'encounter',opening:32},
  {id:'europa-ice-ambush',sector:5,seconds:5,stage:'encounter',opening:28},
];
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
const page=await ctx.newPage();
const report={type:'QA132 footage from actual game state, not simulated media',
  sourceBranch:'feat/qa126-ally-continuity-ascent-combat-20261113',fps,scenes:[],frames:0,errors:[]};
page.on('pageerror',e=>report.errors.push(String(e)));
const snapshot=()=>page.evaluate(()=>{
 const s=window.fixture.game.snapshot();
 return {state:s.state,seconds:s.seconds,orbital:s.orbitalLaunch?.phase||null,
  allies:s.fiveCats?.visible?.map(x=>({name:x.pilot||x.name,x:x.x,y:x.y,z:x.z}))||[],
  enemies:s.entities?.enemies,shots:s.entities?.shots,hostile:s.entities?.hostile,
  asteroid:s.asteroidCourse||s.asteroidInterior?.course||null,
  render:window.fixture.renderStats()};
});
const activeKeys=new Set();
async function keys(next) {
 for(const key of [...activeKeys])if(!next.has(key)){await page.keyboard.up(key);activeKeys.delete(key);}
 for(const key of next)if(!activeKeys.has(key)){await page.keyboard.down(key);activeKeys.add(key);}
}
try{
 let frame=0;
 for(const scene of scenes){
  const query='sector='+scene.sector+'&encounters=1&asteroidCourse=1&citySetpieces=1';
  await page.goto('http://127.0.0.1:4173/__dynamic.html?'+query,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:120000});
  if(scene.stage==='atmosphere'){
    await page.evaluate(()=>window.fixture.advance(23));
    await keys(new Set(['Shift']));
    await page.evaluate(()=>window.fixture.advance(3.6));
    await keys(new Set());
    await page.evaluate(()=>window.fixture.advance(14.9)); // ~41.5 s into stage
    const orbital=await snapshot();
    if(orbital.orbital!=='atmosphere')throw Error('QA132 real boost did not enter atmosphere: '+JSON.stringify(orbital));
  } else {
    await page.evaluate(seconds=>window.fixture.advance(seconds),scene.opening);
  }
  let baseline=await snapshot();
  let samples=[],start=frame,visibleFrames=0,enemyMax=0;
  for(let k=0;k<scene.seconds*fps;k++){
    const t=k/fps;
    const next=new Set();
    // Keep flight steady while allies arrive and leave naturally.
    if(scene.stage==='atmosphere'){
      if(k%58<42)next.add('Space');
      if(t>=0.7&&t<1.35)next.add('w');
      if(t>=3.0&&t<3.6)next.add('a');
      if(t>=6.1&&t<6.65)next.add('d');
    }else if(scene.stage==='asteroid'){
      if(t<2.0)next.add('Space');
      if(t>=2.2&&t<3.1)next.add('d');
      if(t>=3.1&&t<4.2)next.add('a');
      if(t>=5.2&&t<5.9)next.add('w');
      if(t>=6.5&&t<7.4)next.add('s');
    }else{
      if(k%48<36)next.add('Space');
      if(k%70<21)next.add('d');
      if(k%70>=35&&k%70<52)next.add('a');
      if(t>1.7&&t<2.3)next.add('w');
    }
    await keys(next);
    await page.evaluate(()=>window.fixture.advance(1/30));
    if(k%10===0){
      const snap=await snapshot();
      samples.push({frame:k,...snap});
      if(snap.allies.length>0)visibleFrames++;
      enemyMax=Math.max(enemyMax,snap.enemies||0);
    }
    await page.screenshot({path:join(frameDir,String(frame++).padStart(6,'0')+'.jpg'),
      type:'jpeg',quality:86,animations:'disabled',timeout:120000});
  }
  await keys(new Set());
  const sceneResult={id:scene.id,firstFrame:start,frames:frame-start,
    baseline,samples,allyVisibleSamples:visibleFrames,maxEnemies:enemyMax,after:await snapshot()};
  report.scenes.push(sceneResult);
  console.log('[QA132 scene]',scene.id,JSON.stringify({
    frames:sceneResult.frames,allyVisibleSamples:visibleFrames,maxEnemies:enemyMax,
    initialState:baseline.state,endingState:sceneResult.after.state,orbit:baseline.orbital}));
 }
 report.frames=frame;
 if(frame!==900)throw Error('Expected 900 individually captured WebGL frames, got '+frame);
 const allyScene=report.scenes[0];
 if(allyScene.allyVisibleSamples<5)throw Error('QA126 ally path not visibly present in real scene');
 if(report.errors.length)throw Error('Browser errors: '+report.errors.join('; '));
 await writeFile(join(output,'provenance.json'),JSON.stringify(report,null,2));
 const target=join(output,'nova-wing-qa132-new-scenes-720p30-30s.mp4');
 const enc=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate','30',
  '-i',join(frameDir,'%06d.jpg'),'-c:v','libx264','-preset','veryfast','-crf','20',
  '-pix_fmt','yuv420p','-r','30','-t','30','-movflags','+faststart',target],
  {encoding:'utf8',maxBuffer:2e6});
 if(enc.status!==0)throw Error('FFmpeg failed: '+enc.stderr);
 console.log('[QA132 complete]',target);
}finally{await browser.close()}
