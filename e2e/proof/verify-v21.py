# /// script
# dependencies = ["numpy", "pillow", "scipy", "opencv-python-headless"]
# ///
"""Verify a v20-only recompose: provenance, encoded pixels, timing and cameras."""
import hashlib, json, socket, subprocess, sys
from collections import Counter
import numpy as np
import cv2
from PIL import Image
from scipy.ndimage import label, find_objects, minimum_filter1d, maximum_filter1d, binary_dilation
from pathlib import Path
out=Path(sys.argv[1]).expanduser().resolve()
meta=json.loads((out/'v21-metadata.json').read_text())
evidence=Path(meta['sourceEvidence'])
take=Path(meta['source']); scenario=json.loads((take/'portfolio-scenario.json').read_text())
assert scenario['passed'] and scenario['continuousTake']
assert scenario['finalDocuments'][0]==scenario['finalDocuments'][1]
assert not take.is_symlink() and take.parent==evidence and take.name.startswith('take-')
at={e['name']:e['seconds'] for e in scenario['events']}
assert at['offline-typing']-at['offline-badge']<=.5
assert at['sentence-typing']-at['sentence']>=1
assert at['sentence-end']-at['sentence-visible']>=1
assert 45<=meta['duration']<=65
assert len(meta['transitions'])==8*(len(meta['shots'])+1)
for q in meta['shots']:
 for i in range(8):
  assert (out/'v21-transitions'/f"{q['name']}-{i}.png").exists()
  assert (out/'v21-transitions-phone'/f"{q['name']}-{i}.png").exists()
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
 expectedFade={'10-reconnect':meta['guestLivePixel'],'05-comment':at['selection-visible'],'07-guest-reply':at['hover-visible'],'08-ana-reply':at['reply-visible']}.get(q['name'],q['s'])-q['s']
 assert abs(q.get('captionFadeStart',0)-expectedFade)<1/30
 for attribution in q.get('attributions',[]):
  assert q['duration']-attribution['start']>=1.5
 previous=q['e']
 if q['caption'] in ['Offline. Still writing.','Swift Author is back online. Both edits merge.'] and q['who']!='both':
  # Test delivered pixels at first fully visible caption and throughout the shot.
  for dt in [0,.1,.3,min(1,q['duration']-.04),q['duration']-.04]:
   px=colors(rgb(out/'hotpress-collaboration-v21.mp4',q['timeline']+dt,(1180,20,420,135)))
   expected='red' if q['caption'].startswith('Offline') else 'green'
   assert px[expected]>100,(q['name'],dt,px)
   checks.append({'shot':q['name'],'dt':dt,'colors':px})
print('Capture, chronology and badges passed',flush=True)
# Reconnect proof uses delivered pixels in one uninterrupted two-window shot.
merge=next(q for q in meta['shots'] if q['name']=='11-merge')
reconnect=next(q for q in meta['shots'] if q['name']=='10-reconnect')
assert reconnect['e']==merge['s'] and reconnect['sameTimestamp']
assert abs(reconnect['s']-(meta['guestOfflineExitPixel']-1.5))<1e-8
assert abs(reconnect['s']+1.5-meta['guestOfflineExitPixel'])<1e-8
assert reconnect['cropRect']==meta['shots'][-1]['cropRect']
assert reconnect['captionFadeStart']>=1.5
arrival_ink=[];reconnect_checks=[]
w,h=reconnect['renderSize'];sx=w/1448;sy=h/950
for i in range(round(reconnect['duration']*30)):
 t=reconnect['timeline']+i/30
 badge=colors(rgb(out/'hotpress-collaboration-v21.mp4',t,(980+round((1100-8)*sx),130,round(350*sx),round(120*sy))))
 data=rgb(out/'hotpress-collaboration-v21.mp4',t,(20+round(72*sx),130+round(802*sy),round(700*sx),round(80*sy)))
 ink=sum(max(r,g,b)<130 for r,g,b in zip(data[::3],data[1::3],data[2::3]));arrival_ink.append(ink)
 # Separate caption regions by the offline asset's exact glyph mask.
 c=np.frombuffer(rgb(out/'hotpress-collaboration-v21.mp4',t,(32,972,1450,108)),np.uint8).reshape(108,1450,3)
 offline_asset=np.asarray(Image.open(out/'v21-composition-assets/reconnect-offline-caption.png').convert('RGBA'))[972:1080,32:1482]
 mask=(offline_asset[:,:,:3].min(2)>200)&(offline_asset[:,:,3]>240)
 offline_error=float(np.abs(c.astype(float)[mask]-offline_asset[:,:,:3][mask]).mean())
 # Beyond the offline caption's width, only the LIVE caption can produce ink.
 live_region=c[:,650:,:]
 white=int((live_region.min(2)>150).sum())
 faint=int((live_region.min(2)>50).sum())
 reconnect_checks.append({'frame':i,'sourceTime':reconnect['s']+i/30,'badge':badge,'anaLineInk':ink,'captionInk':white,'captionFaintInk':faint,'offlineCaptionError':offline_error})
live=next(i for i,x in enumerate(reconnect_checks) if x['badge']['green']>100)
offline_exit=next(i for i,x in enumerate(reconnect_checks) if x['badge']['red']<100)
line=next(i for i,x in enumerate(reconnect_checks) if x['anaLineInk']>1000)
assert offline_exit/30>=1.5
assert all(x['badge']['red']>100 and x['offlineCaptionError']<12 for x in reconnect_checks[:offline_exit])
assert all(x['badge']['red']==0 for x in reconnect_checks[offline_exit:])
assert all(x['badge']['green']>100 for x in reconnect_checks[live:])
assert abs(live/30-reconnect['captionFadeStart'])<1e-8
assert abs(offline_exit/30-reconnect['offlineCaptionEnd'])<1e-8
assert all(x['captionFaintInk']==0 for x in reconnect_checks[:live+1])
assert all(x['captionFaintInk']>1000 for x in reconnect_checks[live+2:])
assert all(x['captionInk']>1000 for x in reconnect_checks[live+8:])
assert all(x['offlineCaptionError']>100 for x in reconnect_checks[offline_exit:live+1])
assert arrival_ink[0]<100 and 0<=line-live<=6
assert .4<=reconnect['duration']-line/30<=1.0
assert all(n>1000 for n in arrival_ink[line:])
assert merge['s']>=reconnect['s']+line/30
# The join pointer label is a real blue product label, large enough in output pixels.
join=next(q for q in meta['shots'] if q['name']=='02-arrival')
data=rgb(out/'hotpress-collaboration-v21.mp4',join['timeline']+1.5,(0,700,1920,266))
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
  data=rgb(out/'hotpress-collaboration-v21.mp4',match['timeline']+dt,(x,130,920,604))
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
cleanup=json.loads((evidence/'cleanup-verification-v20-cleanup.json').read_text())
assert ids=={r['id'] for r in cleanup['rooms']}
assert all(r['status']==404 for r in cleanup['rooms'])
for family in [socket.AF_INET,socket.AF_INET6]:
 with socket.socket(family,socket.SOCK_STREAM) as s:
  assert s.connect_ex(('127.0.0.1' if family==socket.AF_INET else '::1',3847))!=0
videos={}
for name in ['hotpress-collaboration-v21.mp4','hotpress-collaboration-v21-web.mp4']:
 file=out/name
 subprocess.run(['ffmpeg','-v','error','-i',str(file),'-f','null','-'],check=True)
 p=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(file)]))
 v=p['streams'][0];assert (v['width'],v['height'],v['r_frame_rate'],v['pix_fmt'])==(1920,1080,'30/1','yuv420p')
 assert abs(float(p['format']['duration'])-meta['duration'])<.05
 data=file.read_bytes();assert data.index(b'moov')<data.index(b'mdat')
 videos[name]={'sha256':hashlib.sha256(data).hexdigest(),'duration':p['format']['duration'],'bitrate':v.get('bit_rate')}
# Reuse v20 capture evidence without recording or contacting any service.
offline_shot=next(q for q in meta['shots'] if q['name']=='09-offline-writing')
assert offline_shot['e']==reconnect['s']
assert offline_shot['duration']>=1.25

def video_frames(file,start,duration):
 p=subprocess.Popen(['ffmpeg','-v','error','-ss',str(start),'-i',str(file),'-t',str(duration),'-vf','format=rgb24','-f','rawvideo','-'],stdout=subprocess.PIPE)
 size=1920*1080*3
 while True:
  data=p.stdout.read(size)
  if not data:break
  assert len(data)==size
  yield np.frombuffer(data,np.uint8).reshape(1080,1920,3)
 assert p.wait()==0

print('Reconnect, match, latency, cleanup and encodes passed',flush=True)
# Scan toolbar, composer and Discussion border/shadow in every source frame.
# Validate conservative envelopes even during opacity fades, plus delivered pixels.

changed={'05-comment','07-guest-reply','08-ana-reply'}
assert meta['shots'][7]['cropRect']==meta['shots'][8]['cropRect']

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
 assert sum(bool(b) for b in boxes)>=45,(q['name'],sum(bool(b) for b in boxes))
 for i,im in enumerate(video_frames(out/'hotpress-collaboration-v21.mp4',q['timeline'],q['duration'])):
  moving=q.get('zoom') and q['zoom']['transforms'][i]['progress']<1
  if moving:continue
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
 popover_checks.append({'shot':q['name'],'frames':frame,'visibleFrames':sum(bool(b) for b in boxes),'minimumWhiteClearance':min(gaps),'minimumCaptionClearance':min(972-b[3] for bs in boxes for b in bs),'boxes':boxes,'envelope':envelope,'envelopeClearance':clearance(envelope),'pinClearance':clearance(pinbox),'scale':sxscale})
# Measure actual encoded glyph ink (not CSS font sizes) in complete, stable text.
# Source-coordinate ROIs are transformed using the verified crop and scale.
for shotname,dt,rois in [
 ('05-comment',at['composer-ready']-at['comments'],{'composerBody':[586,882,1240,958],'composerTitle':[586,790,930,839]}),
 ('08-ana-reply',at['reply-visible']-next(z for z in meta['shots'] if z['name']=='08-ana-reply')['s']+.4,{'commentBody':[1094,943,1694,1004],'replyBody':[1094,1090,1654,1148],'authorAna':[1094,884,1182,929],'authorSwift':[1094,1031,1354,1078],'discussionTitle':[1030,790,1300,839]}),
]:
 q=next(z for z in meta['shots'] if z['name']==shotname);x,y,w,h=q['cropRect'];rw,rh=q['renderSize'];px,py=q['position']
 for name,(l,t,r,b) in rois.items():
  rect=[round(px+(l-x)*rw/w),round(py+(t-y)*rh/h),round((r-l)*rw/w),round((b-t)*rh/h)]
  a=np.frombuffer(rgb(out/'hotpress-collaboration-v21.mp4',q['timeline']+dt,rect),np.uint8).reshape(rect[3],rect[2],3)
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

print('Popover geometry and encoded text passed',flush=True)
# Every encoded frame of every shot: check 8-pixel inner crop-edge bands.
# Remove only long, straight native window/toolbar rules; retain glyph strokes,
# punctuation, gray placeholders and clipped fragments, including single pixels.
def edge_ink(im, rect, nontext_icons=()):
 x,y,w,h=rect
 a=im[y:y+h,x:x+w].astype(np.int16)
 mask=(a.max(2)<210)&(a.max(2)-a.min(2)<55)
 rules=maximum_filter1d(minimum_filter1d(mask,size=201,axis=1,mode="constant"),size=201,axis=1,mode="constant")|maximum_filter1d(minimum_filter1d(mask,size=151,axis=0,mode="constant"),size=151,axis=0,mode="constant")
 mask &= ~binary_dilation(rules,iterations=2)
 # Optional exclusions retained for regression compatibility; v21 supplies none.
 for l,t,r,b in nontext_icons:mask[t:b,l:r]=False
 edge=np.zeros((h,w),bool)
 edge[:8,:]=True;edge[-8:,:]=True;edge[:,:8]=True;edge[:,-8:]=True
 return int((mask&edge).sum())
# Negative control: cutting through the actual delivered lantern line must
# trigger the detector. No older take or older output is required.
regression_q=next(q for q in meta['shots'] if q['name']=='08-ana-reply')
regression_im=next(video_frames(out/'hotpress-collaboration-v21.mp4',regression_q['timeline']+at['reply-visible']-regression_q['s']+.4,1/30))
assert edge_ink(regression_im,[0,150,1920,776])>0
edge_checks=[]
for q in meta['shots']:
 rw,rh=q['renderSize']
 positions=q.get('positions',[q.get('position')])
 count=0
 for i,im in enumerate(video_frames(out/'hotpress-collaboration-v21.mp4',q['timeline'],q['duration'])):
  if q.get('zoom') and 0<q['zoom']['transforms'][i]['progress']<1:continue
  if q.get('zoom') and q['zoom']['transforms'][i]['progress']<1:
   tr=q['zoom']['transforms'][i]
   left,top,width,height=tr['window']
   px,py=int(np.ceil(left+1)),int(np.ceil(top+1))
   rw,rh=int(np.floor(left+width-1))-px,int(np.floor(top+height-1))-py
   positions=[[px,py]]
  else:
   rw,rh=q['renderSize'];positions=q.get('positions',[q.get('position')])
  for px,py in positions:
   icons=[] # No icon exclusions in v21; every crop edge must be clear.
   n=edge_ink(im,[px,py,rw,rh],icons)
   assert n==0,('edge-fragment',q['name'],i,[px,py,rw,rh],n)
  count+=1
 expected_static=sum(not (0<t['progress']<1) for t in q['zoom']['transforms']) if q.get('zoom') else round(q['duration']*30)
 assert count==expected_static
 edge_checks.append({'shot':q['name'],'frames':count,'windows':len(positions),'edgeBandPx':8,'textPixels':0,'nontextIconExclusion':None})
print('All-frame crop edges passed',flush=True)
# Independently verify that both pill rectangles cover only blank source pixels,
# including every captured frame, before editorial annotation is composited.
f=take/'raw-ana.webm'
data=ff('-ss',meta['starts'][str(f)]+merge['s'],'-i',f,'-frames:v',round(merge['duration']*30),'-vf','crop=1728:900:8:8,scale=1824:950,pad=1920:1080:48:16:color=0x182028,format=rgb24','-f','rawvideo','-')
raw_merge=np.frombuffer(data,np.uint8).reshape(-1,1080,1920,3)
for im in raw_merge:
 for m in merge['attributions']:
  pl,pt,pw,ph=m['pillRect']
  blank=im[int(pt):int(np.ceil(pt+ph)),int(pl):int(np.ceil(pl+pw))]
  assert blank.min()>240,('pill covers captured content',m['text'])

# Independent rendered-pixel ink bounds and all-frame annotation timing.
annotation_checks=[]
for i,im in enumerate(video_frames(out/'hotpress-collaboration-v21.mp4',merge['timeline'],merge['duration'])):
 for j,m in enumerate(merge['attributions']):
  l,t,r,b=m['ink'];x,y,w,h=m['tint'];pl,pt,pw,ph=m['pillRect']
  assert m['text']==['Ana, meanwhile','Swift Author, offline'][j]
  assert m['fontSize']==30 or (j==0 and m['fontSize']==28 and m['widthAt30']>m['availableWidth'])
  assert 16<=pl-r<=24
  assert abs(pt+ph/2-(t+b)/2)<.01
  assert not (pl<r and pl+pw>l and pt<b and pt+ph>t)
  # Same-line pills stay inside the white document, clear of all text and pin.
  assert min(pl-48,1872-pl-pw,pt-232,966-pt-ph)>=24
  for ol,ot,orr,ob in [[110,450,1450,505],[110,590,1460,648],[110,719,1310,800],[1324,719,1438,777],[110,872,763,941]]:
   assert not (pl<orr and pl+pw>ol and pt<ob and pt+ph>ot),(j,'text/pin overlap')
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
for im in video_frames(out/'hotpress-collaboration-v21.mp4',sentence['timeline'],sentence['duration']):
 roi=im[68:210,50:800];ys,xs=np.where(roi.max(2)<100)
 gap=int(ys.min());assert gap>=24
 assert im[68:68+gap,50:800].mean()>250
 heading_gaps.append(gap)
assert reconnect['caption']==merge['caption']=='Swift Author is back online. Both edits merge.'
assert any('hotpress.app' in s['text'] for s in meta['visibleStrings'])
# Read the delivered URL glyphs: Inter 40 px has a 39 px ink box here.
end_pixels=np.asarray(Image.open(out/'v21-frames/13-end.png').convert('RGB'))
ys,xs=np.where(end_pixels[740:830,800:1120].min(2)>130)
assert int(ys.max()-ys.min()+1)>=30 and len(xs)>1000
assert len(meta['changedSamples'])>=100
for sample in meta['changedSamples']:
 for suffix in ['', '-phone']:
  p=out/f'v21-changed{suffix}'/f"{sample['name']}.png"
  with Image.open(p) as im:assert im.size[0]==(390 if suffix else 1920)
# Pin duration is measured in the encoded comment shot, from its first colored pixels.
comment=next(q for q in meta['shots'] if q['name']=='05-comment')
x,y,cw,ch=comment['cropRect'];rw,rh=comment['renderSize'];px,py=comment['position']
pin_rect=(round(px+(1172-x)*rw/cw),round(py+(614-y)*rh/ch),round(106*rw/cw),round(54*rh/ch))
pin_scan=ff('-ss',comment['timeline'],'-i',out/'hotpress-collaboration-v21.mp4','-t',comment['duration'],'-vf',f'crop={pin_rect[2]}:{pin_rect[3]}:{pin_rect[0]}:{pin_rect[1]},format=rgb24','-f','rawvideo','-')
a=np.frombuffer(pin_scan,np.uint8).reshape(-1,pin_rect[3],pin_rect[2],3).astype(np.int16)
counts=((a[:,:,:,1]>a[:,:,:,0]+25)&(a[:,:,:,1]>a[:,:,:,2]+20)).sum((1,2))
pin_first=int(np.flatnonzero((counts>100)&(np.arange(len(counts))/30>=at['comment-posted']-comment['s']-.1))[0]);pin_duration=(len(a)-pin_first)/30
assert pin_duration>=1.5 and np.all(counts[pin_first:]>100)
# Actual attribution glyph heights, separate from CSS font size.
pill_checks=[]
for j,m in enumerate(merge['attributions']):
 pl,pt,pw,ph=m['pillRect']
 a=np.frombuffer(rgb(out/'hotpress-collaboration-v21.mp4',merge['timeline']+m['start']+.4,(round(pl)+14,round(pt)+7,round(pw)-28,round(ph)-14)),np.uint8).reshape(round(ph)-14,round(pw)-28,3)
 yy,xx=np.where(a.min(2)>200);height=int(yy.max()-yy.min()+1)
 assert height>=m['fontSize']-2,(j,height)
 pill_checks.append({'text':m['text'],'cssFontPx':m['fontSize'],'encodedInkHeight':height,'rect':m['pillRect'],'gapAfterSentence':m['pillLeft']-m['ink'][2],'rightClearance':1872-pl-pw,'widthAt30':m['widthAt30']})
# Source motion supports the longer opener; measure the longest identical run.
q=meta['shots'][0];f=take/'raw-ana.webm'
d=ff('-ss',meta['starts'][str(f)],'-i',f,'-t',q['e'],'-vf','crop=1728:900:8:8,format=gray','-f','rawvideo','-')
a=np.frombuffer(d,np.uint8).reshape(-1,900,1728)
changes=np.flatnonzero(np.any(a[1:]!=a[:-1],axis=(1,2)))+1
longest_static=float(np.diff(np.r_[0,changes,len(a)]).max()/30)
assert longest_static<=1.5 and any(changes/30>1.585)

print('Attributions, pin duration and opener motion passed',flush=True)
# Both native pointer pills, measured in the delivered join shots, not inferred
# from the recorder's mouse calls. This band contains neither avatars nor carets.
pointer_checks=[]
for name,color in [('02-link','green'),('02-arrival','blue')]:
 q=next(q for q in meta['shots'] if q['name']==name)
 samples=[]
 for dt in np.arange(.5,1.81,.1):
  im=np.frombuffer(rgb(out/'hotpress-collaboration-v21.mp4',q['timeline']+float(dt),(0,700,1920,266)),np.uint8).reshape(266,1920,3).astype(int)
  r,g,b=im.transpose(2,0,1)
  mask=((g>90)&(g>r+45)&(g>b+35)&(r<100)) if color=='green' else ((b>150)&(b>r+70)&(b>g+40)&(r<100))
  labs,n=label(mask)
  components=find_objects(labs)
  candidates=[(sl, int((labs[sl]==k).sum())) for k,sl in enumerate(components,1)
      if sl and sl[0].stop-sl[0].start>=20 and sl[1].stop-sl[1].start>=50]
  assert candidates,(name,dt)
  (ys,xs),area=max(candidates,key=lambda pair:pair[1])
  pill=im[ys,xs]
  white=int((pill.min(2)>215).sum())
  assert white>=100 and ys.stop-ys.start>=20
  samples.append({'t':float(dt),'x':(xs.start+xs.stop)/2,'y':(ys.start+ys.stop)/2+700,'height':ys.stop-ys.start,'whiteNamePixels':white,'area':area})
 xs=np.array([p['x'] for p in samples])
 assert np.ptp(xs)>500 and np.diff(xs).min()>-5,(name,xs)
 assert np.ptp([p['y'] for p in samples])>8
 pointer_checks.append({'shot':name,'color':color,'samples':samples})
assert next(q for q in meta['shots'] if q['name']=='02-link')['s']>=at['joined']

print('Both join pointers passed pixel checks',flush=True)
# Independently estimate frame-to-frame camera transforms from encoded glyphs.
# Feature matching sees the actual rendered subpixel positions after H.264.
zoom_checks=[]
sift=cv2.SIFT_create(nfeatures=2500)
bf=cv2.BFMatcher()
for q in meta['shots']:
 if not q.get('zoom'):continue
 z=q['zoom']; transforms=z['transforms']
 assert (.4 if q['name']=='03-ana-writing' else .6)<=z['duration']<=.9 and z['easing']=='smoothstep'
 zoom_ids=[i for i,t in enumerate(transforms) if z['start']-1e-8<=t['t']<=z['start']+z['duration']+1e-8]
 assert len(zoom_ids)>=(15 if q['name']=='03-ana-writing' else 24)
 values=np.array([[transforms[i][k] for k in ['scaleX','scaleY','x','y']] for i in zoom_ids])
 delta=np.diff(values,axis=0)
 for j in range(4):
  assert np.all(delta[:,j]>=-1e-9) or np.all(delta[:,j]<=1e-9)
 # Eased endpoints, continuous first derivative, no integer-coordinate stepping.
 assert max(abs(delta[0,3]),abs(delta[-1,3]))<max(abs(delta[:,3]))*.2
 assert np.max(np.abs(np.diff(delta[:,3])))<7
 assert all(max(t['scaleX'],t['scaleY'])<=1.25+1e-12 for t in transforms)
 assert any(abs(t['y']-round(t['y']))>.01 for t in transforms)
 allframes=list(video_frames(out/'hotpress-collaboration-v21.mp4',q['timeline'],q['duration']))
 # Independently check opaque native band ink whenever a whole band is inside
 # the moving aperture. This catches the v20 early whitening even if metadata lies.
 native=take/f"raw-{q['who']}.webm"
 raw=ff('-ss',meta['starts'][str(native)]+q['s'],'-i',native,'-frames:v',len(transforms),'-vf','format=rgb24','-f','rawvideo','-')
 native_frames=np.frombuffer(raw,np.uint8).reshape(-1,1600,1744,3)
 band_checks=0
 for idx in zoom_ids:
  tr=transforms[idx];sx,sy,tx,ty=[tr[k] for k in ['scaleX','scaleY','x','y']]
  px,py,rw,rh=tr['window']
  for top,bottom in [(8,112),(112,224),(256,370),(392,504),(530,610)]:
   if top*sy+ty<py+2 or bottom*sy+ty>py+rh-2:continue
   source=native_frames[idx]
   ys,xs=np.where(source[top:bottom,60:1680].max(2)<100)
   if len(xs)<50:continue
   xs=xs+60;ys=ys+top
   xx=np.rint(xs*sx+tx).astype(int);yy=np.rint(ys*sy+ty).astype(int)
   keep=(xx>px+2)&(xx<px+rw-2)&(yy<966)
   if keep.sum()<50:continue
   # Median ink remains dark despite interpolation and H.264 noise.
   actual=allframes[idx][yy[keep],xx[keep]].max(1)
   assert np.median(actual)<145,('early-band-fade',q['name'],idx,top,float(np.median(actual)))
   band_checks+=1
 del raw,native_frames
 measurements=[]
 for prev,curr in zip(zoom_ids,zoom_ids[1:]):
  a=cv2.cvtColor(allframes[prev][:966],cv2.COLOR_RGB2GRAY)
  b=cv2.cvtColor(allframes[curr][:966],cv2.COLOR_RGB2GRAY)
  kp1,d1=sift.detectAndCompute(a,None);kp2,d2=sift.detectAndCompute(b,None)
  matches=[m for m,n in bf.knnMatch(d1,d2,k=2) if m.distance<.65*n.distance]
  src=np.float32([kp1[m.queryIdx].pt for m in matches])
  dst=np.float32([kp2[m.trainIdx].pt for m in matches])
  # A similarity fit avoids ill-conditioned shear estimates when only one
  # complete text line is visible; raster anisotropy is below 0.001 per step.
  matrix,inliers=cv2.estimateAffinePartial2D(src,dst,method=cv2.RANSAC,ransacReprojThreshold=.6,maxIters=4000)
  assert matrix is not None and int(inliers.sum())>=25
  t0,t1=transforms[prev],transforms[curr]
  sx=t1['scaleX']/t0['scaleX'];sy=t1['scaleY']/t0['scaleY']
  expected=np.array([[sx,0,t1['x']-sx*t0['x']],[0,sy,t1['y']-sy*t0['y']]])
  # Subpixel position tolerance; differences are compression/feature-fit noise.
  err=np.abs(matrix-expected)
  assert err[:,:2].max()<.0015 and err[:,2].max()<.3,(q['name'],curr,err)
  assert (matrix[0,0]>=.9995 if z['direction']=='in' else matrix[0,0]<=1.0005)
  assert (matrix[1,2]<0 if z['direction']=='in' else matrix[1,2]>0)
  measurements.append({'frame':curr,'matrix':matrix.tolist(),'expected':expected.tolist(),'inliers':int(inliers.sum()),'positionError':float(err[:,2].max())})
 zoom_checks.append({'shot':q['name'],'duration':z['duration'],'maxScale':float(values[:,:2].max()),'maxPositionError':max(m['positionError'] for m in measurements),'pixelMeasurements':measurements,'opaqueBandPixelChecks':band_checks})
assert len(zoom_checks)==3
comment=next(q for q in meta['shots'] if q['name']=='05-comment')
assert comment['s']+comment['zoom']['duration']<at['selection-start']
reply=next(q for q in meta['shots'] if q['name']=='08-ana-reply')
assert abs(reply['zoom']['start']+reply['zoom']['duration']-(reply['duration']-.4))<1e-8
# Same v20 take: compare independent hashes against the accepted manifest.
old=json.loads((evidence/'v20-delivery-verification.json').read_text())
assert sources==old['sourceSHA256']
# Bands are never faded: source content exits by geometric clipping only.
for q in meta['shots']:
 for tr in q.get('zoom',{}).get('transforms',[]):
  assert tr['contextFades']==[]
# Matched incoming transform/window, then monotonic push: no wide flash.
prev=next(q for q in meta['shots'] if q['name']=='04-sentence')
assert comment['zoom']['full']==prev['cropRect']+prev['renderSize']+prev['position']
tr=comment['zoom']['transforms'][0]
assert tr['window']==prev['position']+prev['renderSize']
# Full view is held with advancing original footage for twelve frames.
last=reply['zoom']['transforms'][-12:]
assert all(abs(t['progress'])<1e-12 for t in last)
assert .3<=reply['duration']-reply['zoom']['start']-reply['zoom']['duration']<=.5
# The scenario event is logged after the close animation; check actual card pixels below.
assert at['reply-closed']-at['reply-visible']>=1.5
assert 0<=at['reply-visible']-reply['s']<1
# Every caption-less interval is shorter than 1 second, a stronger bound
# than allowing motion to excuse long caption-less stretches.
assert reply['captionFadeStart']+1/30<=1
reply_pixels=list(video_frames(out/'hotpress-collaboration-v21.mp4',reply['timeline'],reply['duration']))
card_visible=[i for i,im in enumerate(reply_pixels) if (im[250:850,1100:1800].max(2)<100).sum()>15000]
assert card_visible and card_visible[0]/30<.5
assert (card_visible[-1]-card_visible[0]+1)/30>=1.5
assert card_visible[-1]/30<reply['zoom']['start']
assert reply['zoom']['start']-card_visible[-1]/30<.7
# The first 0.1 s must still show the pin before the Discussion opens.
assert card_visible[0]>=3
reply_readable=(card_visible[-1]-card_visible[0]+1)/30
del reply_pixels
move=next(q for q in meta['shots'] if q['name']=='03-ana-writing')
join=next(q for q in meta['shots'] if q['name']=='02-arrival')
assert move['zoom']['full']==join['cropRect']+join['renderSize']+join['position']
assert .4<=move['zoom']['duration']<=.6
# Native page border is pale gray and escaped v20's dark-ink detector.
# Check the actual encoded static left/right edges, including gray >210.
hairline_checks=[]
for q in meta['shots']:
 if q['name'] not in changed:continue
 n=0; minimum=255.
 for i,im in enumerate(video_frames(out/'hotpress-collaboration-v21.mp4',q['timeline'],q['duration'])):
  if q.get('zoom') and q['zoom']['transforms'][i]['progress']!=1:continue
  px,py=q['position'];rw,rh=q['renderSize']
  for xx in [px,px+rw-8]:
   strip=im[py+10:py+rh-10,xx:xx+8]
   column_means=strip.mean(axis=(0,2))
   minimum=min(minimum,float(column_means.min()))
   assert column_means.min()>250,(q['name'],i,column_means)
  n+=1
 hairline_checks.append({'shot':q['name'],'frames':n,'minimumColumnMean':minimum})
for sample in meta['cameraSamples']:
 folder=out/('v21-camera-phone' if sample['phone'] else 'v21-camera')/sample['shot']
 files=sorted(folder.glob('*.png'))
 assert len(files)==sample['frames'] and len(files)>=round(sample['duration']*30)-1
 for f in files:
  with Image.open(f) as im:assert im.width==(390 if sample['phone'] else 1920)
v21_checks={'matchedPushStart':True,'noBandFades':True,'postZoomRealHold':.4,'replyCaptionlessMaximum':max(reply['captionFadeStart']+1/30,.25),'replyReadableSeconds':reply_readable,'sameScreenMoveSeconds':move['zoom']['duration'],'hairlineChecks':hairline_checks,'everyCameraFrame':meta['cameraSamples']}
review=json.loads((out/'v21-self-review.json').read_text())
assert review['sampleCount']==len(meta['changedSamples'])
assert review['reviewedFullSize'] and review['reviewed390px'] and all(f['passed'] for f in review['fixes'])
result={'passed':True,'v21Checks':v21_checks,'bothPointers':pointer_checks,'zoomChecks':zoom_checks,'offlineHoldSeconds':offline_exit/30,'offlineSingleSeconds':offline_shot['duration'],'splitCaptionTiming':{'offlineEndFrame':offline_exit,'firstLiveFrame':live,'liveFadeStart':reconnect['captionFadeStart']},'reconnectPixels':reconnect_checks,'pinDuration':pin_duration,'pillMeasurements':pill_checks,'openerLongestStatic':longest_static,'edgeFragmentChecks':edge_checks,'edgeRegressionControlPassed':True,'sourceSHA256':sources,'videos':videos,'badgePixels':checks,'matchPixels':match_checks,'bodyTextPx':match['bodyTextPx'],'roomIds':sorted(ids),'port3847Free':True,'noEditorialFreezes':True,'maxUpscale':max(q['upscale'] for q in meta['shots']),'medianMs':meta['medianMs'],'reconnectDelayMs':meta['reconnectDelayMs'],'selfReview':review,'mergeArrivalInk':arrival_ink,'joinLabelHeightPx':max(rows)-min(rows)+1,'popoverChecks':popover_checks,'commentTextMeasurements':text_checks,'annotationFrames':len(annotation_checks),'minimumHeadingWhitePx':min(heading_gaps),'changedReviewSamples':len(meta['changedSamples'])}
(out/'v21-delivery-verification.json').write_text(json.dumps(result,indent=2))
print(json.dumps({k:v for k,v in result.items() if k not in ['selfReview','badgePixels','matchPixels','popoverChecks']},indent=2))
