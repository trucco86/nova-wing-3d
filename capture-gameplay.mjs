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
 const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:out,size:{width:1280,height:720}}});
 const page=await context.newPage();
 await page.addInitScript(()=>{
  const Original=window.AudioContext; const mix=new Original(); const dest=mix.createMediaStreamDestination();
  const outputs=new WeakMap(); const connect=AudioNode.prototype.connect;
  AudioNode.prototype.connect=function(target,...args){
   if(target instanceof AudioDestinationNode && this.context!==mix){
    let output=outputs.get(this.context);
    if(!output){output=this.context.createMediaStreamDestination();outputs.set(this.context,output);connect.call(mix.createMediaStreamSource(output.stream),dest);}
    connect.call(this,output);
   }
   return connect.call(this,target,...args);
  };
  window.startAudio=async()=>{await mix.resume();window.audioChunks=[];window.rec=new MediaRecorder(dest.stream);rec.ondataavailable=e=>audioChunks.push(e.data);rec.start();};
  window.finishAudio=()=>new Promise(resolve=>{rec.onstop=async()=>{const b=new Uint8Array(await new Blob(audioChunks).arrayBuffer());let s='';for(const n of b)s+=String.fromCharCode(n);resolve(btoa(s));};rec.stop();});
 });
 await page.goto(`http://127.0.0.1:4187/__dynamic.html?sector=${shot.sector}&xp=2200&pods=3&encounters=${shot.mode==='hangar'?0:1}${shot.mode==='boss'?'&qaBoss='+shot.sector:''}`);
 await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:90000});
 await page.locator('#pause').click();await page.locator('#pauseResume').click();
 if(shot.mode==='hangar')await page.evaluate(()=>fixture.hangar());
 await page.evaluate(({label,mode})=>{
  const chapter=document.createElement('div');chapter.textContent=label;chapter.style.cssText='position:fixed;left:24px;bottom:20px;z-index:99999;background:#07101ddd;color:#fff;padding:10px 16px;border-left:3px solid #5ee7ff;font:600 17px sans-serif;pointer-events:none';document.body.append(chapter);
  window.captureFrames=0;window.captureStart=performance.now();let last=performance.now(),event=-1;
  const key=(code,type='keydown')=>dispatchEvent(new KeyboardEvent(type,{code,bubbles:true}));
  if(mode!=='hangar')key('Space');
  window.captureTick=()=>{
   const now=performance.now(),dt=Math.min(.05,(now-last)/1000);last=now;const elapsed=(now-captureStart)/1000;
   const tick=Math.floor(elapsed);
   if(tick!==event){event=tick;
    if(mode!=='hangar'){
     const s=fixture.game.snapshot();if(s.shield<75)fixture.game.collect('shield');
     if(tick%6===0){key('ArrowLeft','keyup');key('ArrowRight');}if(tick%6===3){key('ArrowRight','keyup');key('ArrowLeft');}
     if(tick===7||tick===19)key('KeyT');
     if(tick%7===2){fixture.game.cycleSpecial();fixture.game.castSpecial();}
     if(tick%9===4)fixture.game.cycleArsenal();
     if(mode==='boss'){fixture.game.orbit(tick%12<6?1:-1);if(tick%8===0)fixture.game.bomb();}
     if(mode==='flight'&&tick===22)key('ShiftLeft');
     if(mode==='flight'&&tick===11)fixture.game.cycleCamera();if(mode==='flight'&&tick===16)fixture.game.cycleCamera();
    }
   }
   fixture.advance(dt);captureFrames++;window.captureRaf=requestAnimationFrame(captureTick);
  };window.captureRaf=requestAnimationFrame(captureTick);
 },{label:shot.mode==='hangar'?'HANGAR · Arsenal e progressão':`${String(shot.sector+1).padStart(2,'0')} · ${shot.mode==='boss'?SECTORS[shot.sector].boss:SECTORS[shot.sector].name}`,mode:shot.mode});
 await page.evaluate(()=>startAudio());
 const start=Date.now();await page.screenshot({path:`${out}/${name}-start.jpg`});
 await new Promise(r=>setTimeout(r,shot.duration*1000));
 const report=await page.evaluate(()=>{cancelAnimationFrame(captureRaf);return {frames:captureFrames,state:fixture.game.snapshot()};});
 const audio=await page.evaluate(()=>finishAudio());await writeFile(`${out}/${name}.webm.audio`,Buffer.from(audio,'base64'));
 await page.screenshot({path:`${out}/${name}-end.jpg`});const video=page.video();await context.close();await video.saveAs(`${out}/${name}.webm`);
 await writeFile(`${out}/${name}.json`,JSON.stringify({...shot,start,report},null,2));console.log('DONE',name,'frames',report.frames,'state',report.state.state);
 const duration=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',`${out}/${name}.webm`],{encoding:'utf8'}).trim());
 execFileSync('ffmpeg',['-y','-ss',String(Math.max(0,duration-shot.duration-0.3)),'-i',`${out}/${name}.webm`,'-i',`${out}/${name}.webm.audio`,'-t',String(shot.duration),'-vf','fps=30,scale=1280:720,setsar=1','-af','apad','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart',`${out}/${name}.mp4`],{stdio:'ignore'});
}
await browser.close();
