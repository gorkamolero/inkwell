"""Verify v13 capture provenance, edit constraints, badge pixels and exact cleanup."""
import hashlib, json, socket, subprocess, sys
from pathlib import Path
out=Path(sys.argv[1]).expanduser().resolve()
meta=json.loads((out/'v13-metadata.json').read_text())
take=Path(meta['source']); scenario=json.loads((take/'portfolio-scenario.json').read_text())
assert scenario['passed'] and scenario['continuousTake']
assert scenario['finalDocuments'][0]==scenario['finalDocuments'][1]
assert not take.is_symlink() and take.parent==out
at={e['name']:e['seconds'] for e in scenario['events']}
assert at['offline-typing']-at['offline-badge']<=.5
assert at['sentence-typing']-at['sentence']>=1
assert at['sentence-end']-at['sentence-visible']>=1
assert 45<=meta['duration']<=65
assert len(meta['transitions'])==8*(len(meta['shots'])+1)
for q in meta['shots']:
 for i in range(8):
  assert (out/'v13-transitions'/f"{q['name']}-{i}.png").exists()
  assert (out/'v13-transitions-phone'/f"{q['name']}-{i}.png").exists()
sources={}
def ff(*args):return subprocess.check_output(['ffmpeg','-v','error',*map(str,args)])
def rgb(file,t,rect):
 x,y,w,h=rect
 return ff('-ss',t,'-i',file,'-frames:v',1,'-vf',f'crop={w}:{h}:{x}:{y},format=rgb24','-f','rawvideo','-')
def colors(data):
 return {'green':sum(g>175 and r<100 and b<190 for r,g,b in zip(data[::3],data[1::3],data[2::3])), 'red':sum(r>180 and g<110 and b<150 for r,g,b in zip(data[::3],data[1::3],data[2::3]))}
for who in ['ana','guest']:
 file=take/f'raw-{who}.webm'; sources[file.name]=hashlib.sha256(file.read_bytes()).hexdigest()
 p=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',str(file)]))['streams'][0]
 assert (p['width'],p['height'])==(1744,1600)
 frames=json.loads((take/f'cdp-{who}'/'frames.json').read_text())
 assert all(b['timestamp']>=a['timestamp'] for a,b in zip(frames,frames[1:]))
 assert all(Path(f['file']).parent==take/f'cdp-{who}' for f in frames)
 assert len(frames)>100
 for frame in frames:
  data=Path(frame['file']).read_bytes()
  assert data[:8]==b'\x89PNG\r\n\x1a\n'
  assert int.from_bytes(data[16:20],'big')==1744 and int.from_bytes(data[20:24],'big')==1600
 # Check recording duration covers the last selected source range.
 duration=float(json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-of','json',str(file)]))['format']['duration'])
 assert duration>=meta['starts'][str(file)]+meta['shots'][-1]['e']-.04
 assert p['r_frame_rate']=='30/1'
assert json.loads((out/'production-key-verification.json').read_text())['configuredProductionKey']
previous=0;checks=[]
for q in meta['shots']:
 assert Path(q['source'])==take
 assert q['s']>=previous-.001 and q['e']>q['s']
 assert q['holdEnd']==0 and not q.get('holdStart')
 assert abs(q['duration']-(q['e']-q['s']))<=1/30
 assert q['upscale']<=1.25
 assert q['upscale']==max(q['renderSize'][i]/q['cropRect'][i+2] for i in range(2))
 assert q.get('captionFadeStart',0)<=.1
 for attribution in q.get('attributions',[]):
  assert q['duration']-attribution['start']>=1.5
 previous=q['e']
 if q['caption'] in ['Offline. Still writing.','Back online. Both edits merge.']:
  # Test delivered pixels at first fully visible caption and throughout the shot.
  for dt in [0,.1,.3,min(1,q['duration']-.04),q['duration']-.04]:
   px=colors(rgb(out/'hotpress-collaboration-v13.mp4',q['timeline']+dt,(1180,20,420,135)))
   expected='red' if q['caption'].startswith('Offline') else 'green'
   assert px[expected]>100,(q['name'],dt,px)
   checks.append({'shot':q['name'],'dt':dt,'colors':px})
# Independently inspect the guest's LIVE pixels at the selected receiving cut.
merge=next(q for q in meta['shots'] if q['name']=='11-merge')
assert merge['s']>=meta['guestLivePixel'] and merge['s']<meta['mergeAppearance']
assert colors(rgb(take/'raw-guest.webm',meta['starts'][str(take/'raw-guest.webm')]+merge['s']+.02,(1100,0,350,120)))['green']>100
# The receiving shot must contain actual pre-arrival pixels, then the complete line.
scan=ff('-ss',merge['timeline'],'-i',out/'hotpress-collaboration-v13.mp4','-t','0.4','-vf','crop=1000:80:100:860,format=gray','-f','rawvideo','-')
arrival_ink=[sum(v<100 for v in scan[i:i+80000]) for i in range(0,len(scan),80000)]
assert arrival_ink[0]<100 and max(arrival_ink)>1000
# The join pointer label is a real blue product label, large enough in output pixels.
join=next(q for q in meta['shots'] if q['name']=='02-arrival')
data=rgb(out/'hotpress-collaboration-v13.mp4',join['timeline']+1.5,(0,700,1920,266))
rows=[]
for y in range(266):
 row=data[y*1920*3:(y+1)*1920*3]
 if sum(b>150 and r<100 and g<170 for r,g,b in zip(row[::3],row[1::3],row[2::3]))>100:rows.append(y)
assert rows and max(rows)-min(rows)+1>=20
sentence=next(q for q in meta['shots'] if q['name']=='04-sentence');assert sentence['duration']>=3.5
assert at['sentence-typing']-sentence['s']>=1 and sentence['e']-at['sentence-visible']>=1
match=meta['shots'][-1];assert match['who']=='both' and match['crop']=='match'
assert match['cropRect']==[8,8,1728,950] and match['bodyTextPx']>=22
# Both uninterrupted rectangular crops contain their own bright LIVE header and body.
match_checks=[]
for dt in [0,match['duration']/2,match['duration']-.05]:
 for x in [40,980]:
  data=rgb(out/'hotpress-collaboration-v13.mp4',match['timeline']+dt,(x,230,900,494))
  c=colors(data[:900*70*3]);assert c['green']>100
  bands=[]
  for y in [210,277,344,411]:
   band=data[(y-15)*900*3:(y+30)*900*3]
   n=sum(max(r,g,b)<130 for r,g,b in zip(band[::3],band[1::3],band[2::3]));bands.append(n)
  assert all(n>100 for n in bands),(x,dt,bands)
  match_checks.append({'x':x,'dt':dt,'header':c,'paragraphInk':bands})
latency=json.loads((out/'suite/latency.json').read_text());assert len(latency['edits']['rawMs'])==30
assert meta['medianMs']==latency['edits']['medianMs']
# Every run, including rejected takes, is represented; no remote enumeration.
manifests=sorted(out.glob('take-*/rooms-*.jsonl'))+sorted((out/'suite').glob('rooms-*.jsonl'))
ids={json.loads(line)['id'] for f in manifests for line in f.read_text().splitlines() if line}
cleanup=json.loads((out/'cleanup-verification-v13-cleanup.json').read_text())
assert ids=={r['id'] for r in cleanup['rooms']}
assert all(r['status']==404 for r in cleanup['rooms'])
for family in [socket.AF_INET,socket.AF_INET6]:
 with socket.socket(family,socket.SOCK_STREAM) as s:
  assert s.connect_ex(('127.0.0.1' if family==socket.AF_INET else '::1',3847))!=0
videos={}
for name in ['hotpress-collaboration-v13.mp4','hotpress-collaboration-v13-web.mp4']:
 file=out/name
 subprocess.run(['ffmpeg','-v','error','-i',str(file),'-f','null','-'],check=True)
 p=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(file)]))
 v=p['streams'][0];assert (v['width'],v['height'],v['r_frame_rate'],v['pix_fmt'])==(1920,1080,'30/1','yuv420p')
 assert abs(float(p['format']['duration'])-meta['duration'])<.05
 data=file.read_bytes();assert data.index(b'moov')<data.index(b'mdat')
 videos[name]={'sha256':hashlib.sha256(data).hexdigest(),'duration':p['format']['duration'],'bitrate':v.get('bit_rate')}
review=json.loads((out/'v13-self-review.json').read_text());assert len(review['fixes'])==15
assert all(f['passed'] for f in review['fixes'])
result={'passed':True,'sourceSHA256':sources,'videos':videos,'badgePixels':checks,'matchPixels':match_checks,'bodyTextPx':match['bodyTextPx'],'roomIds':sorted(ids),'port3847Free':True,'noEditorialFreezes':True,'maxUpscale':max(q['upscale'] for q in meta['shots']),'medianMs':meta['medianMs'],'reconnectDelayMs':meta['reconnectDelayMs'],'selfReview':review,'mergeArrivalInk':arrival_ink,'joinLabelHeightPx':max(rows)-min(rows)+1}
(out/'v13-delivery-verification.json').write_text(json.dumps(result,indent=2));print(json.dumps({k:v for k,v in result.items() if k not in ['selfReview','badgePixels','matchPixels']},indent=2))
