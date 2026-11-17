"""Build an unapproved editorial candidate; visual/audio review remains mandatory."""
import json, pathlib, subprocess
root = pathlib.Path('artifacts/native-4k60')
output = pathlib.Path('artifacts/delivery-candidate')
output.mkdir(parents=True, exist_ok=True)
clips = []
frames = 0
for sector in range(1, 11):
    for kind in ('flight', 'boss'):
        stem = f'{sector:02}-{kind}'
        report = json.loads((root / (stem + '.json')).read_text())
        if report['errors'] or report['duplicateFrames'] or report['frames'] != report['shot']['seconds']*60:
            raise RuntimeError('Rejected source: '+stem)
        if report['width'] != 3840 or report['height'] != 2160:
            raise RuntimeError('Non-native source: '+stem)
        clips.append((root / (stem+'.mp4')).resolve())
        frames += report['frames']
if frames != 36000:
    raise RuntimeError(f'Expected 36000 captured frames, got {frames}')
manifest = output / 'concat.txt'
manifest.write_text(''.join("file '"+str(p)+"'\n" for p in clips))
main = output / 'NovaWing_Gameplay_10min_4K60.mp4'
subprocess.run(['ffmpeg','-y','-f','concat','-safe','0','-i',str(manifest),'-c:v','copy','-c:a','aac','-b:a','256k','-movflags','+faststart',str(main)],check=True)
mobile = output / 'NovaWing_Gameplay_10min_1080p60.mp4'
subprocess.run(['ffmpeg','-y','-i',str(main),'-vf','scale=1920:1080','-c:v','libx264','-crf','23','-preset','fast','-fps_mode','passthrough','-c:a','copy','-movflags','+faststart',str(mobile)],check=True)
validation = {'review':'PENDING_FULL_VISUAL_AND_AUDIO_REVIEW','continuous_campaign':False,'test_scenarios':True,'files':{}}
for file, width, height in [(main,3840,2160),(mobile,1920,1080)]:
    probe = json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(file)]))
    video = next(s for s in probe['streams'] if s['codec_type']=='video')
    assert video['width']==width and video['height']==height
    assert video['avg_frame_rate']=='60/1' and int(video['nb_read_frames'])==36000
    assert abs(float(video['duration'])-600)<0.001
    assert any(s['codec_type']=='audio' and s['codec_name']=='aac' for s in probe['streams'])
    validation['files'][file.name]=probe
(output/'validation.json').write_text(json.dumps(validation,indent=2))
