import { chromium } from 'playwright';
import { mkdir,writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { SECTORS } from './src/campaign.js';
const out=process.env.CAPTURE_OUTPUT || 'artifacts/gameplay';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const shots=[{sector:1,mode:'hangar',duration:20},...SECTORS.flatMap((s,sector)=>[{sector,mode:'flight',duration:28},{sector,mode:'boss',duration:30}])];
for(let i=0;i<shots.length;i++){
 if(process.env.SHOT_INDEX!==undefined && i!==Number(process.env.SHOT_INDEX))continue;
 const shot=shots[i],name=String(i).padStart(2,'0'); console.log('START',name,shot);
 const context=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
 const page=await context.newPage();
 const warmup=shot.mode==='flight'?(shot.sector===0?5:27):0;
 await page.addInitScript(({seconds})=>{
  localStorage.setItem('nova-wing-preferences-v1',JSON.stringify({graphics:'medium',language:'pt',subtitles:false}));
  window.audioContexts=[];
  window.AudioContext=class extends OfflineAudioContext {
   constructor(){super(2,Math.ceil(seconds*48000),48000);window.audioContexts.push(this);}
   resume(){return Promise.resolve();}
   suspend(time){return time===undefined?Promise.resolve():super.suspend(time);}
  };
 },{seconds:warmup+shot.duration+1});
 await page.goto(`http://127.0.0.1:4187/__dynamic.html?sector=${shot.sector}&xp=2200&pods=3&encounters=${shot.mode==='hangar'?0:1}${shot.mode==='boss'?'&qaBoss='+shot.sector:''}`);
 await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});
 await page.locator('#pause').click();await page.locator('#pauseResume').click();
 if(shot.mode==='hangar')await page.evaluate(()=>fixture.hangar());

 await page.evaluate(({label,mode})=>{
  const chapter=document.createElement('div');chapter.textContent=label;chapter.style.cssText='position:fixed;left:24px;bottom:20px;z-index:99999;background:#07101ddd;color:#fff;padding:10px 16px;border-left:3px solid #5ee7ff;font:600 17px sans-serif;pointer-events:none';document.body.append(chapter);
  window.captureFrames=0;let event=-1;
  const key=(code,type='keydown')=>dispatchEvent(new KeyboardEvent(type,{code,bubbles:true}));
  if(mode!=='hangar')key('Space');
  window.captureTick=(elapsed)=>{
   const dt=1/30;
   const tick=Math.floor(elapsed);
   if(tick!==event){event=tick;
    if(mode!=='hangar'){
     const s=fixture.game.snapshot();if(s.shield<75)fixture.game.collect('shield');
     if(tick%6===0){key('ArrowLeft','keyup');key('ArrowRight');}if(tick%6===3){key('ArrowRight','keyup');key('ArrowLeft');}
     if(tick===7||tick===19)key('KeyT');if(tick===5)key('KeyV');if(tick===17)fixture.game.switchPilot();
     if(tick%7===2){fixture.game.cycleSpecial();fixture.game.castSpecial();}
     if(tick%9===4)fixture.game.cycleArsenal();
     if(mode==='boss'){fixture.game.orbit(tick%12<6?1:-1);if(tick%8===0)fixture.game.bomb();}
     if(mode==='flight'&&tick===22)key('ShiftLeft');
     if(mode==='flight'&&tick===11)fixture.game.cycleCamera();if(mode==='flight'&&tick===16){fixture.game.cycleCamera();fixture.game.cycleCamera();}
    }
   }
   fixture.advance(dt);captureFrames++;
  };
 },{label:shot.mode==='hangar'?'HANGAR · Arsenal e progressão':`${String(shot.sector+1).padStart(2,'0')} · ${shot.mode==='boss'?SECTORS[shot.sector].boss:SECTORS[shot.sector].name}`,mode:shot.mode});
 const frameDir=`${out}/${name}-frames`;await mkdir(frameDir,{recursive:true});
 await page.evaluate(()=>{
  if(audioContexts.length!==1)throw new Error('Expected one game audio context');
  window.offlineAudio=audioContexts[0];
  window.nextAudio=offlineAudio.suspend(1/30);
  window.renderedAudio=offlineAudio.startRendering();
 });
 for(let frame=0;frame<(warmup+shot.duration)*30;frame++){
  await page.evaluate(async ({frame,warmup})=>{
   if(frame<warmup*30)fixture.advance(1/30,{renderAfter:false});
   else captureTick((frame-warmup*30)/30);
   await nextAudio;
  },{frame,warmup});
  if(frame>=warmup*30){
   await page.screenshot({path:`${frameDir}/${String(frame-warmup*30).padStart(5,'0')}.jpg`,type:'jpeg',quality:92,timeout:120000});
  }
  await page.evaluate(frame=>{
   window.nextAudio=offlineAudio.suspend((frame+2)/30);
   return OfflineAudioContext.prototype.resume.call(offlineAudio);
  },frame);
  if(frame%150===0)console.log('FRAMES',name,frame,'/',(warmup+shot.duration)*30);
 }
 const audio=await page.evaluate(async()=>{
  await nextAudio;await OfflineAudioContext.prototype.resume.call(offlineAudio);
  const b=await renderedAudio;
  const data=new Uint8Array(b.length*4);const v=new DataView(data.buffer);
  for(let i=0;i<b.length;i++)for(let c=0;c<2;c++)v.setInt16(i*4+c*2,Math.max(-1,Math.min(1,b.getChannelData(c)[i]))*32767,true);
  let s='';for(let i=0;i<data.length;i+=8192)s+=String.fromCharCode(...data.subarray(i,i+8192));return btoa(s);
 });
 await writeFile(`${out}/${name}.pcm`,Buffer.from(audio,'base64'));
 const report=await page.evaluate(()=>({frames:captureFrames,state:fixture.game.snapshot()}));
 await page.screenshot({path:`${out}/${name}-end.jpg`});
 await context.close();
 await writeFile(`${out}/${name}.json`,JSON.stringify({...shot,warmup,report},null,2));
 execFileSync('ffmpeg',['-y','-framerate','30','-i',`${frameDir}/%05d.jpg`,'-f','s16le','-ar','48000','-ac','2','-ss',String(warmup),'-i',`${out}/${name}.pcm`,'-t',String(shot.duration),'-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart',`${out}/${name}.mp4`],{stdio:'ignore'});
 console.log('DONE',name,'frames',report.frames);

}
await browser.close();
