import { test } from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_SETTINGS,readSettings,loadSettings,storeSettings,UI_COPY,uiText} from '../src/ui-preferences.js';
test('settings sanitize corrupt and out-of-range values without mutating defaults',()=>{
  const out=readSettings({language:'jp',master:Infinity,music:-1,sfx:2,opacity:0.1,sensitivity:9,intro:'false'});
  assert.deepEqual({language:out.language,master:out.master,music:out.music,sfx:out.sfx,opacity:out.opacity,sensitivity:out.sensitivity,intro:out.intro},
    {language:'pt',master:0.85,music:0,sfx:1,opacity:0.4,sensitivity:1.6,intro:true});
  assert.equal(DEFAULT_SETTINGS.music,0.7);
});
test('settings persist when available and fall back when blocked',()=>{
  let value=null;const storage={getItem:()=>value,setItem:(_k,v)=>value=v};
  assert.equal(storeSettings(storage,{language:'es',music:0.2,subtitles:false}),true);
  assert.equal(loadSettings(storage).language,'es');
  assert.equal(loadSettings(storage).subtitles,false);
  assert.equal(storeSettings({setItem(){throw Error('blocked')}},{}),false);
  assert.equal(loadSettings({getItem(){throw Error('blocked')}}).intro,true);
});
test('all supported languages cover the main settings and pause commands',()=>{
  for(const language of ['pt','en','es'])
    for(const key of Object.keys(UI_COPY.pt))
      assert.ok(UI_COPY[language][key]?.length>0,language+':'+key);
  assert.equal(uiText('xx','options'),'OPÇÕES');
});
