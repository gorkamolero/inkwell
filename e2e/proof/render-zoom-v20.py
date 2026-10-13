# /// script
# dependencies = ["numpy", "pillow"]
# ///
"""Resample captured frames using a floating-point camera, never integer crops."""
import json, subprocess, sys
import numpy as np
from PIL import Image
from pathlib import Path

cfg=json.loads(Path(sys.argv[1]).read_text())
z=cfg['zoom']; count=round(cfg['duration']*30)
decoder=subprocess.Popen(['ffmpeg','-v','error','-ss',str(cfg['start']),'-i',cfg['file'],
    '-frames:v',str(count),'-vf','format=rgb24','-f','rawvideo','-'],stdout=subprocess.PIPE)
encoder=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24',
    '-s','1920x1080','-r','30','-i','-','-an','-c:v','ffv1',cfg['output']],stdin=subprocess.PIPE)
records=[]
def transform(c):
    x,y,w,h,rw,rh,px,py=c
    return np.array([rw/w,rh/h,px-x*rw/w,py-y*rh/h,px,py,rw,rh],float)
full=transform(z['full']); close=transform(z['close'])
xx=np.arange(1920)[None,:]+.5; yy=np.arange(1080)[:,None]+.5
for i in range(count):
    raw=decoder.stdout.read(1744*1600*3)
    assert len(raw)==1744*1600*3
    im=Image.frombytes('RGB',(1744,1600),raw)
    u=np.clip((i/30-z['start'])/z['duration'],0,1)
    ease=u*u*(3-2*u)
    amount=ease if z['direction']=='in' else 1-ease
    sx,sy,tx,ty,px,py,rw,rh=full+(close-full)*amount
    assert max(sx,sy)<=1.25+1e-12
    # Fade complete peripheral context bands before they cross the aperture.
    # This preserves whole words/icons during camera motion; the anchor, pin,
    # composer and reply are never redrawn, moved independently, or masked.
    fades=[]
    if 0<amount<1:
        pixels=np.asarray(im,dtype=float).copy()
        for top,bottom,glyph_top in [(8,112,28),(112,224,137),(256,370,287),(392,504,400),(530,610,557)]:
            urow=float(np.clip((glyph_top*sy+ty-py-8)/16,0,1))
            opacity=urow*urow*(3-2*urow)
            pixels[top:bottom]=pixels[top:bottom]*opacity+255*(1-opacity)
            fades.append([top,bottom,opacity])
        pixels[:,1736:]=255
        im=Image.fromarray(np.rint(pixels).astype(np.uint8))
    # The v19 reply's blank top/right extensions remove only the preceding line
    # and native black border. The camera's content remains native source pixels.
    if amount==1 and z['direction']=='out':
        im.paste('white',(50,592,1750,610))
        im.paste('white',(1736,592,1750,1390))
    view=im.transform((1920,1080),Image.Transform.AFFINE,
        (1/sx,0,-tx/sx,0,1/sy,-ty/sy),Image.Resampling.BICUBIC,fillcolor='white')
    # Coverage antialiasing keeps even the moving window bounds sub-pixel.
    coverage=np.minimum(np.clip(xx-px+.5,0,1),np.clip(px+rw-xx+.5,0,1))*np.minimum(np.clip(yy-py+.5,0,1),np.clip(py+rh-yy+.5,0,1))
    a=np.asarray(view,dtype=float)*coverage[:,:,None]+np.array([24,32,40])*(1-coverage[:,:,None])
    encoder.stdin.write(np.rint(a).astype(np.uint8).tobytes())
    records.append(dict(frame=i,t=i/30,scaleX=sx,scaleY=sy,x=tx,y=ty,window=[px,py,rw,rh],progress=float(amount),contextFades=fades))
encoder.stdin.close()
assert decoder.wait()==0 and encoder.wait()==0
Path(cfg['output']+'.json').write_text(json.dumps(records,indent=2))
