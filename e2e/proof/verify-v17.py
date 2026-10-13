# /// script
# dependencies = ["numpy", "pillow", "scipy"]
# ///
"""Verify v17 capture provenance, edit constraints, badge pixels and exact cleanup."""
import hashlib, json, socket, subprocess, sys
from collections import Counter
import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects, minimum_filter1d, maximum_filter1d, binary_dilation
from pathlib import Path
out=Path(sys.argv[1]).expanduser().resolve()
meta=json.loads((out/'v17-metadata.json').read_text())
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
  assert (out/'v17-transitions'/f"{q['name']}-{i}.png").exists()
  assert (out/'v17-transitions-phone'/f"{q['name']}-{i}.png").exists()
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
 assert abs(q.get('captionFadeStart',0)-(.8 if q['name']=='10-reconnect' else 0))<1e-8
 for attribution in q.get('attributions',[]):
  assert q['duration']-attribution['start']>=1.5
 previous=q['e']
 if q['caption'] in ['Offline. Still writing.','Swift Author is back online. Both edits merge.'] and q['who']!='both':
  # Test delivered pixels at first fully visible caption and throughout the shot.
  for dt in [0,.1,.3,min(1,q['duration']-.04),q['duration']-.04]:
   px=colors(rgb(out/'hotpress-collaboration-v17.mp4',q['timeline']+dt,(1180,20,420,135)))
   expected='red' if q['caption'].startswith('Offline') else 'green'
   assert px[expected]>100,(q['name'],dt,px)
   checks.append({'shot':q['name'],'dt':dt,'colors':px})
# Reconnect proof uses delivered pixels in one uninterrupted two-window shot.
merge=next(q for q in meta['shots'] if q['name']=='11-merge')
reconnect=next(q for q in meta['shots'] if q['name']=='10-reconnect')
assert reconnect['e']==merge['s'] and reconnect['sameTimestamp']
assert abs(reconnect['s']-(meta['guestLivePixel']-.8))<1e-8
assert abs(reconnect['s']+.5-meta['guestOfflineExitPixel'])<1e-8
assert reconnect['cropRect']==meta['shots'][-1]['cropRect']
assert abs(reconnect['captionFadeStart']-.8)<1e-8
arrival_ink=[];reconnect_checks=[]
w,h=reconnect['renderSize'];sx=w/1448;sy=h/950
for i in range(round(reconnect['duration']*30)):
 t=reconnect['timeline']+i/30
 badge=colors(rgb(out/'hotpress-collaboration-v17.mp4',t,(980+round((1100-8)*sx),130,round(350*sx),round(120*sy))))
 data=rgb(out/'hotpress-collaboration-v17.mp4',t,(20+round(72*sx),130+round(802*sy),round(700*sx),round(80*sy)))
 ink=sum(max(r,g,b)<130 for r,g,b in zip(data[::3],data[1::3],data[2::3]));arrival_ink.append(ink)
 # Caption region is empty until LIVE; then visibly fades in.
 c=np.frombuffer(rgb(out/'hotpress-collaboration-v17.mp4',t,(60,995,1100,45)),np.uint8).reshape(45,1100,3)
 white=int((c.min(2)>150).sum())
 faint=int((c.min(2)>50).sum())
 if i<=24:assert faint==0
 if i>=26:assert faint>1000
 if i<=24:assert white==0,(i,white)
 if i>=32:assert white>1000,(i,white)
 reconnect_checks.append({'frame':i,'sourceTime':reconnect['s']+i/30,'badge':badge,'anaLineInk':ink,'captionInk':white,'captionFaintInk':faint})
live=next(i for i,x in enumerate(reconnect_checks) if x['badge']['green']>100)
line=next(i for i,x in enumerate(reconnect_checks) if x['anaLineInk']>1000)
assert live==24 and all(x['badge']['red']>100 for x in reconnect_checks[:15])
assert all(x['badge']['red']==0 for x in reconnect_checks[15:])
assert all(x['badge']['green']>100 for x in reconnect_checks[live:])
assert arrival_ink[0]<100 and 0<=line-live<=6
assert .56<=reconnect['duration']-line/30<=.67
assert all(n>1000 for n in arrival_ink[line:])
assert merge['s']>=reconnect['s']+line/30
# The join pointer label is a real blue product label, large enough in output pixels.
join=next(q for q in meta['shots'] if q['name']=='02-arrival')
data=rgb(out/'hotpress-collaboration-v17.mp4',join['timeline']+1.5,(0,700,1920,266))
rows=[]
for y in range(266):
 row=data[y*1920*3:(y+1)*1920*3]
 if sum(b>150 and r<100 and g<170 for r,g,b in zip(row[::3],row[1::3],row[2::3]))>100:rows.append(y)
assert rows and max(rows)-min(rows)+1>=20
sentence=next(q for q in meta['shots'] if q['name']=='04-sentence');assert sentence['duration']>=3.5
assert at['sentence-typing']-sentence['s']>=1 and sentence['e']-at['sentence-visible']>=1
match=meta['shots'][-1];assert match['who']=='both' and match['crop']=='match'
assert match['cropRect']==[8,8,1448,950] and match['bodyTextPx']>=38
assert abs(match['bodyTextPx']-60*match['renderSize'][0]/match['cropRect'][2])<.001
assert match['sameTimestamp'] and match['positions']==[[20,130],[980,130]]
assert match['renderSize']==[920,604]
match_checks=[]
for dt in [0,match['duration']/2,match['duration']-.05]:
 for x in [20,980]:
  data=rgb(out/'hotpress-collaboration-v17.mp4',match['timeline']+dt,(x,130,920,604))
  c=colors(data[:920*80*3]);assert c['green']>100
  bands=[]
  for y in [255,337,421,506]:
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
for name in ['hotpress-collaboration-v17.mp4','hotpress-collaboration-v17-web.mp4']:
 file=out/name
 subprocess.run(['ffmpeg','-v','error','-i',str(file),'-f','null','-'],check=True)
 p=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(file)]))
 v=p['streams'][0];assert (v['width'],v['height'],v['r_frame_rate'],v['pix_fmt'])==(1920,1080,'30/1','yuv420p')
 assert abs(float(p['format']['duration'])-meta['duration'])<.05
 data=file.read_bytes();assert data.index(b'moov')<data.index(b'mdat')
 videos[name]={'sha256':hashlib.sha256(data).hexdigest(),'duration':p['format']['duration'],'bitrate':v.get('bit_rate')}
# v17 changes are confined to composition; all source selection remains identical.
old=json.loads((evidence/'v13-metadata.json').read_text())
old_verification=json.loads((evidence/'v13-delivery-verification.json').read_text())
assert old_verification['passed'] and len(old_verification['selfReview']['fixes'])==15
assert all(f['passed'] for f in old_verification['selfReview']['fixes'])
assert sources==old_verification['sourceSHA256']
# Compare by shot name: only the explicitly requested v17 changes may differ.
v16=json.loads((Path.home()/'Downloads/hotpress-v16/v16-metadata.json').read_text())
allowed={
 '01-alone':{'e','duration'}, '05-comment':{'e','duration'},
 '11-merge':{'s','duration','attributions'},
 '12-match':{'cropRect','renderSize','bodyTextPx','upscale'},
}
assert len(meta['shots'])==len(v16['shots'])+1
expected_strings=Counter(x['text'] for x in v16['visibleStrings'])
expected_strings.update([reconnect['caption'], 'Ana’s screen\nSwift Author’s screen'])
assert Counter(x['text'] for x in meta['visibleStrings'])==expected_strings
for prev in v16['shots']:
 q=next(z for z in meta['shots'] if z['name']==prev['name'])
 for key,value in prev.items():
  if key!='timeline' and key not in allowed.get(q['name'],set()):assert q[key]==value,(q['name'],key)
assert meta['shots'][0]['e']==2.5
assert next(q for q in meta['shots'] if q['name']=='05-comment')['e']==at['comment-posted']+1.6
assert merge['e']==next(q for q in v16['shots'] if q['name']=='11-merge')['e']
assert sources==json.loads((Path.home()/'Downloads/hotpress-v16/v16-delivery-verification.json').read_text())['sourceSHA256']

def video_frames(file,start,duration):
 p=subprocess.Popen(['ffmpeg','-v','error','-ss',str(start),'-i',str(file),'-t',str(duration),'-vf','format=rgb24','-f','rawvideo','-'],stdout=subprocess.PIPE)
 size=1920*1080*3
 while True:
  data=p.stdout.read(size)
  if not data:break
  assert len(data)==size
  yield np.frombuffer(data,np.uint8).reshape(1080,1920,3)
 assert p.wait()==0

# Scan toolbar, composer and Discussion border/shadow in every source frame.
# Validate conservative envelopes even during opacity fades, plus delivered pixels.
v14=Path.home()/'Downloads/hotpress-v14'
baseline=json.loads((v14/'v14-metadata.json').read_text())
changed={'05-comment','07-guest-reply','08-ana-reply'}
assert meta['shots'][7]['cropRect']==meta['shots'][8]['cropRect']
v15=json.loads((Path.home()/'Downloads/hotpress-v15/v15-metadata.json').read_text())
popover_checks=[];text_checks=[]
for q in meta['shots']:
 if q['name'] not in changed:continue
 x,y,w,h=q['cropRect'];rw,rh=q['renderSize'];px,py=q['position'];sxscale=rw/w;syscale=rh/h
 def mapped(raw):return [px+(raw[0]-x)*sxscale,py+(raw[1]-y)*syscale,px+(raw[2]-x)*sxscale,py+(raw[3]-y)*syscale]
 def clearance(raw):
  l,t,r,b=mapped(raw)
  gaps=[l-px,t-py,px+rw-r,py+rh-b]
  assert min(gaps)>=24-1e-6,(q['name'],raw,gaps)
  assert min(l,t,1920-r,1080-b,972-b)>=24,(q['name'],raw)
  return min(gaps)
 envelope=[541,557,1290,1053] if q['crop']=='comment' else [1000,768,1728,1368]
 # The visible pin's outer black border, not just its green centre.
 pinbox=[1172,614,1278,668]
 assert clearance(envelope)>=24
 assert clearance(pinbox)>=24
 assert clearance([72,674,1202,750])>=24
 oldq=next(z for z in baseline['shots'] if z['name']==q['name'])
 assert q['upscale']/oldq['upscale']>=1.3
 file=take/f"raw-{q['who']}.webm"
 p=subprocess.Popen(['ffmpeg','-v','error','-ss',str(meta['starts'][str(file)]+q['s']),'-i',str(file),'-frames:v',str(round(q['duration']*30)),'-vf','format=rgb24','-f','rawvideo','-'],stdout=subprocess.PIPE)
 frame=0;boxes=[];gaps=[]
 while True:
  data=p.stdout.read(1744*1600*3)
  if not data:break
  assert len(data)==1744*1600*3
  im=np.frombuffer(data,np.uint8).reshape(1600,1744,3)
  labs,_=label(im[500:1480,450:1740].max(2)<100)
  found=[]
  for sy,sx in find_objects(labs):
   if sx.stop-sx.start<300 or sy.stop-sy.start<50:continue
   raw=[sx.start+450,sy.start+500,sx.stop+450,sy.stop+500]
   assert raw[0]>450 and raw[1]>500 and raw[2]<1740 and raw[3]<1480
   gaps.append(clearance(raw));found.append(mapped(raw))
  # Envelope is checked in every frame, including partial-opacity native fades.
  clearance(envelope);boxes.append(found);frame+=1
 assert p.wait()==0 and frame==round(q['duration']*30)
 assert sum(bool(b) for b in boxes)>frame*.5
 for i,im in enumerate(video_frames(out/'hotpress-collaboration-v17.mp4',q['timeline'],q['duration'])):
  if q['crop']=='reply':
   l,t,r,b=map(round,mapped([560,674,1202,750]));anchor=im[t:b,l:r].astype(np.int16)
   assert ((anchor[:,:,0]>180)&(anchor[:,:,1]>140)&(anchor[:,:,2]<180)).sum()>1000
   l,t,r,b=map(round,mapped(pinbox));pin=im[t:b,l:r].astype(np.int16)
   assert ((pin[:,:,1]>pin[:,:,0]+25)&(pin[:,:,1]>pin[:,:,2]+20)).sum()>100
   # White padding, with no captured black window edge or dark backdrop inside.
   assert im[py:py+20,px:px+rw].mean()>250
   assert im[py:py+rh,px+rw-20:px+rw].mean()>250
  for l,t,r,b in boxes[i]:
   rr,bb=round(r),round(b)
   if b-t>150:assert im[bb+3:bb+7,round(l)+10:rr-10].mean()>240,(q['name'],i,(l,t,r,b))
   assert im[round(t)+10:bb-10,rr+2:rr+5].mean()>240,(q['name'],i,(l,t,r,b))
 popover_checks.append({'shot':q['name'],'frames':frame,'visibleFrames':sum(bool(b) for b in boxes),'minimumWhiteClearance':min(gaps),'minimumCaptionClearance':min(972-b[3] for bs in boxes for b in bs),'boxes':boxes,'envelope':envelope,'envelopeClearance':clearance(envelope),'pinClearance':clearance(pinbox),'scale':sxscale,'gainOverV14':q['upscale']/oldq['upscale']})
# Measure actual encoded glyph ink (not CSS font sizes) in complete, stable text.
# Source-coordinate ROIs are transformed using the verified crop and scale.
for shotname,dt,rois in [
 ('05-comment',5.0,{'composerBody':[586,882,1240,958],'composerTitle':[586,790,930,839]}),
 ('08-ana-reply',2,{'commentBody':[1094,943,1694,1004],'replyBody':[1094,1090,1654,1148],'authorAna':[1094,884,1182,929],'authorSwift':[1094,1031,1354,1078],'discussionTitle':[1030,790,1300,839]}),
]:
 q=next(z for z in meta['shots'] if z['name']==shotname);x,y,w,h=q['cropRect'];rw,rh=q['renderSize'];px,py=q['position']
 for name,(l,t,r,b) in rois.items():
  rect=[round(px+(l-x)*rw/w),round(py+(t-y)*rh/h),round((r-l)*rw/w),round((b-t)*rh/h)]
  a=np.frombuffer(rgb(out/'hotpress-collaboration-v17.mp4',q['timeline']+dt,rect),np.uint8).reshape(rect[3],rect[2],3)
  mask=a.max(2)<135
  # Exclude the narrow blinking insertion caret from glyph-height measurement.
  labs,_=label(mask)
  for component,sl in enumerate(find_objects(labs),1):
   sy,sx=sl
   if sy.stop-sy.start>10*(sx.stop-sx.start):mask[labs==component]=False
  yy,xx=np.where(mask)
  assert len(xx)>50,(name,len(xx))
  height=int(yy.max()-yy.min()+1)
  assert height>=(34 if 'Body' in name else 20 if name=='composerTitle' else 24),(name,height)
  text_checks.append({'shot':shotname,'text':name,'inkHeight1920':height,'inkHeight390':height*390/1920,'roi':rect,'seconds':q['timeline']+dt})

# Every encoded frame of every shot: check 8-pixel inner crop-edge bands.
# Remove only long, straight native window/toolbar rules; retain glyph strokes,
# punctuation, gray placeholders and clipped fragments, including single pixels.
def edge_ink(im, rect, nontext_icons=()):
 x,y,w,h=rect
 a=im[y:y+h,x:x+w].astype(np.int16)
 mask=(a.max(2)<210)&(a.max(2)-a.min(2)<55)
 rules=maximum_filter1d(minimum_filter1d(mask,size=201,axis=1,mode="constant"),size=201,axis=1,mode="constant")|maximum_filter1d(minimum_filter1d(mask,size=151,axis=0,mode="constant"),size=151,axis=0,mode="constant")
 mask &= ~binary_dilation(rules,iterations=2)
 # Optional exclusions retained for regression compatibility; v17 supplies none.
 for l,t,r,b in nontext_icons:mask[t:b,l:r]=False
 edge=np.zeros((h,w),bool)
 edge[:8,:]=True;edge[-8:,:]=True;edge[:,:8]=True;edge[:,-8:]=True
 return int((mask&edge).sum())
edge_checks=[]
for q in meta['shots']:
 rw,rh=q['renderSize']
 positions=q.get('positions',[q.get('position')])
 count=0
 for i,im in enumerate(video_frames(out/'hotpress-collaboration-v17.mp4',q['timeline'],q['duration'])):
  for px,py in positions:
   icons=[] # No icon exclusions in v17; every crop edge must be clear.
   n=edge_ink(im,[px,py,rw,rh],icons)
   assert n==0,('edge-fragment',q['name'],i,[px,py,rw,rh],n)
  count+=1
 assert count==round(q['duration']*30)
 edge_checks.append({'shot':q['name'],'frames':count,'windows':len(positions),'edgeBandPx':8,'textPixels':0,'nontextIconExclusion':None})
# Regression control: the rejected v15 fragment must be detected.
prev=next(q for q in v15['shots'] if q['name']=='08-ana-reply')
im=next(video_frames(Path.home()/'Downloads/hotpress-v15/hotpress-collaboration-v15.mp4',prev['timeline']+2,1/30))
assert edge_ink(im,[*prev['position'],*prev['renderSize']])>0

# Independent rendered-pixel ink bounds and all-frame annotation timing.
annotation_checks=[]
for i,im in enumerate(video_frames(out/'hotpress-collaboration-v17.mp4',merge['timeline'],merge['duration'])):
 for j,m in enumerate(merge['attributions']):
  l,t,r,b=m['ink'];x,y,w,h=m['tint'];pl,pt,pw,ph=m['pillRect']
  assert pl==110 and m['fontSize']==40
  assert not (pl<r and pl+pw>l and pt<b and pt+ph>t)
  # Blank-line pills also avoid the lantern line and native pin.
  assert (j==0 and pt>=648 and pt+ph<=720) or (j==1 and pt>=796 and pt+ph<=866)
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
for im in video_frames(out/'hotpress-collaboration-v17.mp4',sentence['timeline'],sentence['duration']):
 roi=im[68:210,50:800];ys,xs=np.where(roi.max(2)<100)
 gap=int(ys.min());assert gap>=24
 assert im[68:68+gap,50:800].mean()>250
 heading_gaps.append(gap)
assert reconnect['caption']==merge['caption']=='Swift Author is back online. Both edits merge.'
assert any('hotpress.app' in s['text'] for s in meta['visibleStrings'])
# Read the delivered URL glyphs: Inter 40 px has a 39 px ink box here.
end_pixels=np.asarray(Image.open(out/'v17-frames/13-end.png').convert('RGB'))
ys,xs=np.where(end_pixels[740:830,800:1120].min(2)>130)
assert int(ys.max()-ys.min()+1)>=30 and len(xs)>1000
assert len(meta['changedSamples'])>=100
for sample in meta['changedSamples']:
 for suffix in ['', '-phone']:
  p=out/f'v17-changed{suffix}'/f"{sample['name']}.png"
  with Image.open(p) as im:assert im.size[0]==(390 if suffix else 1920)
# Pin duration is measured in the encoded comment shot, from its first colored pixels.
comment=next(q for q in meta['shots'] if q['name']=='05-comment')
x,y,cw,ch=comment['cropRect'];rw,rh=comment['renderSize'];px,py=comment['position']
pin_rect=(round(px+(1172-x)*rw/cw),round(py+(614-y)*rh/ch),round(106*rw/cw),round(54*rh/ch))
pin_scan=ff('-ss',comment['timeline'],'-i',out/'hotpress-collaboration-v17.mp4','-t',comment['duration'],'-vf',f'crop={pin_rect[2]}:{pin_rect[3]}:{pin_rect[0]}:{pin_rect[1]},format=rgb24','-f','rawvideo','-')
a=np.frombuffer(pin_scan,np.uint8).reshape(-1,pin_rect[3],pin_rect[2],3).astype(np.int16)
counts=((a[:,:,:,1]>a[:,:,:,0]+25)&(a[:,:,:,1]>a[:,:,:,2]+20)).sum((1,2))
pin_first=int(np.flatnonzero(counts>100)[0]);pin_duration=(len(a)-pin_first)/30
assert pin_duration>=1.5 and np.all(counts[pin_first:]>100)
# Actual attribution glyph heights, separate from CSS font size.
pill_checks=[]
for j,m in enumerate(merge['attributions']):
 pl,pt,pw,ph=m['pillRect']
 a=np.frombuffer(rgb(out/'hotpress-collaboration-v17.mp4',merge['timeline']+m['start']+.4,(round(pl)+14,round(pt)+7,round(pw)-28,round(ph)-14)),np.uint8).reshape(round(ph)-14,round(pw)-28,3)
 yy,xx=np.where(a.min(2)>200);height=int(yy.max()-yy.min()+1)
 assert height>=30,(j,height)
 pill_checks.append({'text':m['text'],'cssFontPx':m['fontSize'],'encodedInkHeight':height})
# Source motion supports the longer opener; measure the longest identical run.
q=meta['shots'][0];f=take/'raw-ana.webm'
d=ff('-ss',meta['starts'][str(f)],'-i',f,'-t',q['e'],'-vf','crop=1728:900:8:8,format=gray','-f','rawvideo','-')
a=np.frombuffer(d,np.uint8).reshape(-1,900,1728)
changes=np.flatnonzero(np.any(a[1:]!=a[:-1],axis=(1,2)))+1
longest_static=float(np.diff(np.r_[0,changes,len(a)]).max()/30)
assert longest_static<=1.5 and any(changes/30>1.585)
review=json.loads((out/'v17-self-review.json').read_text())
assert review['sampleCount']==80
assert review['reviewedFullSize'] and review['reviewed390px'] and all(f['passed'] for f in review['fixes'])
result={'passed':True,'reconnectPixels':reconnect_checks,'pinDuration':pin_duration,'pillMeasurements':pill_checks,'openerLongestStatic':longest_static,'edgeFragmentChecks':edge_checks,'edgeRegressionControlPassed':True,'sourceSHA256':sources,'videos':videos,'badgePixels':checks,'matchPixels':match_checks,'bodyTextPx':match['bodyTextPx'],'roomIds':sorted(ids),'port3847Free':True,'noEditorialFreezes':True,'maxUpscale':max(q['upscale'] for q in meta['shots']),'medianMs':meta['medianMs'],'reconnectDelayMs':meta['reconnectDelayMs'],'selfReview':review,'mergeArrivalInk':arrival_ink,'joinLabelHeightPx':max(rows)-min(rows)+1,'popoverChecks':popover_checks,'commentTextMeasurements':text_checks,'annotationFrames':len(annotation_checks),'minimumHeadingWhitePx':min(heading_gaps),'changedReviewSamples':len(meta['changedSamples'])}
(out/'v17-delivery-verification.json').write_text(json.dumps(result,indent=2))
print(json.dumps({k:v for k,v in result.items() if k not in ['selfReview','badgePixels','matchPixels','popoverChecks']},indent=2))
