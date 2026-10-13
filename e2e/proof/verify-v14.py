# /// script
# dependencies = ["numpy", "pillow", "scipy"]
# ///
"""Verify v14 capture provenance, edit constraints, badge pixels and exact cleanup."""
import hashlib, json, socket, subprocess, sys
import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects
from pathlib import Path
out=Path(sys.argv[1]).expanduser().resolve()
meta=json.loads((out/'v14-metadata.json').read_text())
evidence=Path(meta['sourceEvidence'])
take=Path(meta['source']); scenario=json.loads((take/'portfolio-scenario.json').read_text())
assert scenario['passed'] and scenario['continuousTake']
assert scenario['finalDocuments'][0]==scenario['finalDocuments'][1]
assert not take.is_symlink() and take.parent==evidence and take.name=='take-7'
at={e['name']:e['seconds'] for e in scenario['events']}
assert at['offline-typing']-at['offline-badge']<=.5
assert at['sentence-typing']-at['sentence']>=1
assert at['sentence-end']-at['sentence-visible']>=1
assert 45<=meta['duration']<=65
assert len(meta['transitions'])==8*(len(meta['shots'])+1)
for q in meta['shots']:
 for i in range(8):
  assert (out/'v14-transitions'/f"{q['name']}-{i}.png").exists()
  assert (out/'v14-transitions-phone'/f"{q['name']}-{i}.png").exists()
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
assert json.loads((evidence/'production-key-verification.json').read_text())['configuredProductionKey']
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
 if q['caption'] in ['Offline. Still writing.','Swift Author is back online. Both edits merge.']:
  # Test delivered pixels at first fully visible caption and throughout the shot.
  for dt in [0,.1,.3,min(1,q['duration']-.04),q['duration']-.04]:
   px=colors(rgb(out/'hotpress-collaboration-v14.mp4',q['timeline']+dt,(1180,20,420,135)))
   expected='red' if q['caption'].startswith('Offline') else 'green'
   assert px[expected]>100,(q['name'],dt,px)
   checks.append({'shot':q['name'],'dt':dt,'colors':px})
# Independently inspect the guest's LIVE pixels at the selected receiving cut.
merge=next(q for q in meta['shots'] if q['name']=='11-merge')
assert merge['s']>=meta['guestLivePixel'] and merge['s']<meta['mergeAppearance']
assert colors(rgb(take/'raw-guest.webm',meta['starts'][str(take/'raw-guest.webm')]+merge['s']+.02,(1100,0,350,120)))['green']>100
# The receiving shot must contain actual pre-arrival pixels, then the complete line.
scan=ff('-ss',merge['timeline'],'-i',out/'hotpress-collaboration-v14.mp4','-t','0.4','-vf','crop=1000:80:100:860,format=gray','-f','rawvideo','-')
arrival_ink=[sum(v<100 for v in scan[i:i+80000]) for i in range(0,len(scan),80000)]
assert arrival_ink[0]<100 and max(arrival_ink)>1000
# The join pointer label is a real blue product label, large enough in output pixels.
join=next(q for q in meta['shots'] if q['name']=='02-arrival')
data=rgb(out/'hotpress-collaboration-v14.mp4',join['timeline']+1.5,(0,700,1920,266))
rows=[]
for y in range(266):
 row=data[y*1920*3:(y+1)*1920*3]
 if sum(b>150 and r<100 and g<170 for r,g,b in zip(row[::3],row[1::3],row[2::3]))>100:rows.append(y)
assert rows and max(rows)-min(rows)+1>=20
sentence=next(q for q in meta['shots'] if q['name']=='04-sentence');assert sentence['duration']>=3.5
assert at['sentence-typing']-sentence['s']>=1 and sentence['e']-at['sentence-visible']>=1
match=meta['shots'][-1];assert match['who']=='both' and match['crop']=='match'
assert match['cropRect']==[8,8,1420,950] and match['bodyTextPx']>=38
assert abs(match['bodyTextPx']-60*match['renderSize'][0]/match['cropRect'][2])<.001
assert match['sameTimestamp'] and match['positions']==[[20,130],[980,130]]
assert abs((130+(616+16+80)/2)-972/2)<1
match_checks=[]
for dt in [0,match['duration']/2,match['duration']-.05]:
 for x in [20,980]:
  data=rgb(out/'hotpress-collaboration-v14.mp4',match['timeline']+dt,(x,130,920,616))
  c=colors(data[:920*80*3]);assert c['green']>100
  bands=[]
  for y in [260,344,430,516]:
   band=data[(y-20)*920*3:(y+35)*920*3]
   n=sum(max(r,g,b)<130 for r,g,b in zip(band[::3],band[1::3],band[2::3]));bands.append(n)
  assert all(n>100 for n in bands),(x,dt,bands)
  match_checks.append({'x':x,'dt':dt,'header':c,'paragraphInk':bands})
latency=json.loads((evidence/'suite/latency.json').read_text());assert len(latency['edits']['rawMs'])==30
assert meta['medianMs']==latency['edits']['medianMs']
# Every run, including rejected takes, is represented; no remote enumeration.
manifests=sorted(evidence.glob('take-*/rooms-*.jsonl'))+sorted((evidence/'suite').glob('rooms-*.jsonl'))
ids={json.loads(line)['id'] for f in manifests for line in f.read_text().splitlines() if line}
cleanup=json.loads((evidence/'cleanup-verification-v13-cleanup.json').read_text())
assert ids=={r['id'] for r in cleanup['rooms']}
assert all(r['status']==404 for r in cleanup['rooms'])
for family in [socket.AF_INET,socket.AF_INET6]:
 with socket.socket(family,socket.SOCK_STREAM) as s:
  assert s.connect_ex(('127.0.0.1' if family==socket.AF_INET else '::1',3847))!=0
videos={}
for name in ['hotpress-collaboration-v14.mp4','hotpress-collaboration-v14-web.mp4']:
 file=out/name
 subprocess.run(['ffmpeg','-v','error','-i',str(file),'-f','null','-'],check=True)
 p=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(file)]))
 v=p['streams'][0];assert (v['width'],v['height'],v['r_frame_rate'],v['pix_fmt'])==(1920,1080,'30/1','yuv420p')
 assert abs(float(p['format']['duration'])-meta['duration'])<.05
 data=file.read_bytes();assert data.index(b'moov')<data.index(b'mdat')
 videos[name]={'sha256':hashlib.sha256(data).hexdigest(),'duration':p['format']['duration'],'bitrate':v.get('bit_rate')}
# v14 changes are confined to composition; all source selection remains identical.
old=json.loads((evidence/'v13-metadata.json').read_text())
old_verification=json.loads((evidence/'v13-delivery-verification.json').read_text())
assert old_verification['passed'] and len(old_verification['selfReview']['fixes'])==15
assert all(f['passed'] for f in old_verification['selfReview']['fixes'])
assert sources==old_verification['sourceSHA256']
for q,o in zip(meta['shots'],old['shots']):
 for key in ['name','who','s','e','duration','timeline','holdEnd']:
  assert q[key]==o[key],(q['name'],key)
assert len(meta['shots'])==len(old['shots'])

def video_frames(file,start,duration):
 p=subprocess.Popen(['ffmpeg','-v','error','-ss',str(start),'-i',str(file),'-t',str(duration),'-vf','format=rgb24','-f','rawvideo','-'],stdout=subprocess.PIPE)
 size=1920*1080*3
 while True:
  data=p.stdout.read(size)
  if not data:break
  assert len(data)==size
  yield np.frombuffer(data,np.uint8).reshape(1080,1920,3)
 assert p.wait()==0

# Detect the connected black border/shadow in the source pixels for EVERY frame,
# including hover cards, the reply composer and the two-message Discussion.
popover_checks=[]
for q in meta['shots']:
 if q['name'] not in ['07-guest-reply','08-ana-reply']:continue
 file=take/f"raw-{q['who']}.webm"
 p=subprocess.Popen(['ffmpeg','-v','error','-ss',str(meta['starts'][str(file)]+q['s']),'-i',str(file),'-frames:v',str(round(q['duration']*30)),'-vf','format=rgb24','-f','rawvideo','-'],stdout=subprocess.PIPE)
 frame=0;boxes=[]
 while True:
  data=p.stdout.read(1744*1600*3)
  if not data:break
  assert len(data)==1744*1600*3
  im=np.frombuffer(data,np.uint8).reshape(1600,1744,3)
  labs,_=label(im[700:1480,900:1740].max(2)<100)
  found=[]
  for sy,sx in find_objects(labs):
   if sx.stop-sx.start<300 or sy.stop-sy.start<50:continue
   # A black connected outer border includes the offset shadow.
   raw=[sx.start+900,sy.start+700,sx.stop+900,sy.stop+700]
   assert raw[0]>900 and raw[1]>700 and raw[2]<1740 and raw[3]<1480
   x,y,w,h=q['cropRect'];rw,rh=q['renderSize'];px,py=q['position']
   box=[px+(raw[0]-x)*rw/w,py+(raw[1]-y)*rh/h,px+(raw[2]-x)*rw/w,py+(raw[3]-y)*rh/h]
   assert raw[0]>=x and raw[1]>=y and raw[2]<=x+w and raw[3]<=y+h
   assert box[0]>=0 and box[1]>=0 and box[2]<=1920 and box[3]<=972-24
   found.append(box)
  boxes.append(found);frame+=1
 assert p.wait()==0 and frame==round(q['duration']*30),(q['name'],frame,round(q['duration']*30))
 assert sum(bool(b) for b in boxes)>frame*.5
 # Independently check rendered borders have white pixels below and to the right.
 for i,im in enumerate(video_frames(out/'hotpress-collaboration-v14.mp4',q['timeline'],q['duration'])):
  anchor=im[300:410,710:1280].astype(np.int16)
  assert ((anchor[:,:,0]>180)&(anchor[:,:,1]>140)&(anchor[:,:,2]<180)).sum()>1000
  pin=im[295:350,1180:1280].astype(np.int16)
  assert ((pin[:,:,1]>pin[:,:,0]+25)&(pin[:,:,1]>pin[:,:,2]+20)).sum()>100
  for l,t,r,b in boxes[i]:
   rr,bb=round(r),round(b)
   assert im[bb+3:bb+7,round(l)+10:rr-10].mean()>240
   assert im[round(t)+10:bb-10,rr+2:rr+5].mean()>240,(q['name'],i,(l,t,r,b),im[round(t)+10:bb-10,rr+2:rr+5].mean())
 popover_checks.append({'shot':q['name'],'frames':frame,'visibleFrames':sum(bool(b) for b in boxes),'minimumCaptionClearance':min(972-b[3] for bs in boxes for b in bs),'boxes':boxes})

# Independent rendered-pixel ink bounds and all-frame annotation timing.
annotation_checks=[]
for i,im in enumerate(video_frames(out/'hotpress-collaboration-v14.mp4',merge['timeline'],merge['duration'])):
 for j,m in enumerate(merge['attributions']):
  l,t,r,b=m['ink'];x,y,w,h=m['tint'];pl,pt,pw,ph=m['pillRect']
  assert 16<=pl-r<=24 and abs(pt+ph/2-(t+b)/2)<.1
  assert pl+pw<1872 and pt>=0 and pt+ph<966
  assert [x,y,w,h]==[l-3,t-7,r-l+6,b-t+14]
  assert m['start']>=meta['mergeAppearance']-merge['s']
  assert (j==0 and 1000<=l<1020 and 590<=t<610 and r<1465 and b<650) or (j==1 and 110<=l<125 and 870<=t<890 and r<770 and b<940)
  dt=i/30
  tint=im[y+1:y+5,x+10:x+w-10].mean(axis=(0,1))
  pill=im[round(pt)+ph.__ceil__()//2-3:round(pt)+ph.__ceil__()//2+3,round(pl)+4:round(pl)+8].mean()
  if dt<=m['start']:
   assert tint.min()>245 and pill>240,(i,j,tint,pill)
  if dt>=m['start']+.25:
   assert pill<100
   assert (tint[1]>tint[0]+6 if j==0 else tint[2]>tint[0]+12),(j,tint)
   # Only the background changes: glyph coordinates still agree with measurement.
   roi=im[t:b,l:r];yy,xx=np.where(roi.max(2)<130)
   assert abs(int(xx.min())+l-l)<=2 and abs(int(xx.max())+l+1-r)<=2
 annotation_checks.append({'frame':i,'seconds':i/30})
# Check heading white clearance for every frame, not only metadata.
heading_gaps=[]
for im in video_frames(out/'hotpress-collaboration-v14.mp4',sentence['timeline'],sentence['duration']):
 roi=im[68:210,50:800];ys,xs=np.where(roi.max(2)<100)
 gap=int(ys.min());assert gap>=24
 assert im[68:68+gap,50:800].mean()>250
 heading_gaps.append(gap)
assert meta['shots'][12]['caption']=='Swift Author is back online. Both edits merge.'
assert any('hotpress.app' in s['text'] for s in meta['visibleStrings'])
# Read the delivered URL glyphs: Inter 40 px has a 39 px ink box here.
end_pixels=np.asarray(Image.open(out/'v14-frames/13-end.png').convert('RGB'))
ys,xs=np.where(end_pixels[740:830,800:1120].min(2)>130)
assert int(ys.max()-ys.min()+1)>=30 and len(xs)>1000
assert len(meta['changedSamples'])>=100
for sample in meta['changedSamples']:
 for suffix in ['', '-phone']:
  p=out/f'v14-changed{suffix}'/f"{sample['name']}.png"
  with Image.open(p) as im:assert im.size[0]==(390 if suffix else 1920)
review=json.loads((out/'v14-self-review.json').read_text())
assert review['reviewedFullSize'] and review['reviewed390px'] and all(f['passed'] for f in review['fixes'])
result={'passed':True,'sourceSHA256':sources,'videos':videos,'badgePixels':checks,'matchPixels':match_checks,'bodyTextPx':match['bodyTextPx'],'roomIds':sorted(ids),'port3847Free':True,'noEditorialFreezes':True,'maxUpscale':max(q['upscale'] for q in meta['shots']),'medianMs':meta['medianMs'],'reconnectDelayMs':meta['reconnectDelayMs'],'selfReview':review,'mergeArrivalInk':arrival_ink,'joinLabelHeightPx':max(rows)-min(rows)+1,'popoverChecks':popover_checks,'annotationFrames':len(annotation_checks),'minimumHeadingWhitePx':min(heading_gaps),'changedReviewSamples':len(meta['changedSamples'])}
(out/'v14-delivery-verification.json').write_text(json.dumps(result,indent=2))
print(json.dumps({k:v for k,v in result.items() if k not in ['selfReview','badgePixels','matchPixels','popoverChecks']},indent=2))
