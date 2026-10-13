"""Verify one-take provenance, chronological edit, delivery and exact-room cleanup."""
import hashlib
import json
import subprocess
import sys
from pathlib import Path

out = Path(sys.argv[1]).expanduser().resolve()
meta = json.loads((out / 'v11-metadata.json').read_text())
take = Path(meta['source'])
scenario = json.loads((take / 'portfolio-scenario.json').read_text())
latency = json.loads((out / 'suite/latency.json').read_text())
assert scenario['passed'] and scenario['continuousTake']
assert scenario['finalDocuments'][0] == scenario['finalDocuments'][1]
assert len(latency['edits']['rawMs']) == 30
assert meta['medianMs'] == latency['edits']['medianMs']
assert meta['takeStartedAt'] == scenario['takeStartedAt']
assert meta['takeEndedAt'] == scenario['takeEndedAt']
assert len(meta['starts']) == 2
sources = {}
for who in ['ana', 'guest']:
    file = take / f'raw-{who}.webm'
    assert str(file) in meta['starts']
    sources[file.name] = hashlib.sha256(file.read_bytes()).hexdigest()
previous = 0
holds = []
for q in meta['shots']:
    assert Path(q['source']) == take
    assert 0 <= previous <= q['s'] < q['e'] <= scenario['durationSeconds']
    previous = q['e']
    for key in ['holdStart', 'holdEnd']:
        if q.get(key):
            holds.append(dict(shot=q['name'], kind=key, seconds=q[key]))
    if q['name'] == '04-sentence':
        holds.append(dict(shot=q['name'], kind='holdEnd', seconds=11/30))
assert all("'" not in v['text'] and '${' not in v['text'] for v in meta['visibleStrings'])
end = meta['visibleStrings'][0]['text']
assert f"about {meta['medianMs']/1000:.1f} s" in end
assert 'median of 30 edits' in end and end.count('end to end') == 1
videos = {}
for file in [out/'hotpress-collaboration-v11.mp4', out/'hotpress-collaboration-v11-web.mp4']:
    p = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(file)]))
    subprocess.run(['ffmpeg', '-v', 'error', '-i', str(file), '-f', 'null', '-'], check=True)
    v = p['streams'][0]
    assert (v['width'], v['height'], v['pix_fmt'], v['r_frame_rate']) == (1920,1080,'yuv420p','30/1')
    assert 46 <= float(p['format']['duration']) <= 52
    data = file.read_bytes()
    assert data.index(b'moov') < data.index(b'mdat')
    videos[file.name] = dict(duration=p['format']['duration'],videoBitrate=v['bit_rate'],containerBitrate=p['format']['bit_rate'],sha256=hashlib.sha256(data).hexdigest(),completeDecode=True,faststart=True)
# Check lower match text clearance in every encoded frame.
q = next(q for q in meta['shots'] if q['name']=='12-match')
raw = subprocess.check_output(['ffmpeg','-v','error','-ss',str(q['timeline']),'-i',str(out/'hotpress-collaboration-v11.mp4'),'-t',str(q['duration']),'-vf','crop=1500:127:0:840,format=gray','-f','rawvideo','-'])
lowest = -1
for offset in range(0,len(raw),1500*127):
    frame = raw[offset:offset+1500*127]
    for row in range(127):
        if sum(v < 100 for v in frame[row*1500:(row+1)*1500]) > 5:
            lowest = max(lowest,840+row)
assert 967-lowest-1 >= 45
reconnect = next(q for q in meta['shots'] if q['name']=='10-reconnected')
raw_badge = subprocess.check_output(['ffmpeg','-v','error','-ss',str(reconnect['timeline']+reconnect['duration']-1.5),'-i',str(out/'hotpress-collaboration-v11.mp4'),'-t','1.5','-vf','crop=150:90:1370:0,format=rgb24','-f','rawvideo','-'])
badges = [raw_badge[i:i+40500] for i in range(0,len(raw_badge),40500)]
assert len(badges) == 45
assert all(sum(frame[i+1]>150 and frame[i]<100 and frame[i+2]<130 for i in range(0,len(frame),3))>1500 for frame in badges)
assert max(sum(abs(a-b) for a,b in zip(badges[0],frame))/40500 for frame in badges)<1
cleanup = json.loads((out/'cleanup-verification-v11-cleanup.json').read_text())
created = {json.loads(line)['id'] for file in [*out.glob('take-*/rooms-*.jsonl'), *out.glob('suite/rooms-*.jsonl')] for line in file.read_text().splitlines()}
assert created == {r['id'] for r in cleanup['rooms']}
assert all(r['status']==404 for r in cleanup['rooms'])
assert subprocess.run(['lsof','-nP','-iTCP:3847','-sTCP:LISTEN'],capture_output=True).returncode == 1
report = dict(videos=videos,singleTake=True,takeStartedAt=scenario['takeStartedAt'],takeEndedAt=scenario['takeEndedAt'],sourceSHA256=sources,chronologicalNonoverlappingRanges=True,holds=holds,medianMs=meta['medianMs'],matchCaptionClearancePx=967-lowest-1,liveHoldFrames=45,liveBadgeVerified=True,rooms=cleanup['rooms'],port3847='free')
(out/'v11-delivery-verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
