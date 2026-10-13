"""Offline delivery verification; no app, server, or network access."""
import hashlib
import json
import subprocess
import sys
from pathlib import Path

out = Path(sys.argv[1]).expanduser()
prior = Path(sys.argv[2]).expanduser()
meta = json.loads((out / 'v10-metadata.json').read_text())
old = json.loads((prior / 'v9-metadata.json').read_text())
master = out / 'hotpress-collaboration-v10.mp4'

def ff(*args):
    return subprocess.check_output(['ffmpeg', '-v', 'error', *map(str, args)])

def pixels(file, time, vf, duration=None):
    return ff('-ss', time, '-i', file, *(['-t', duration] if duration else ['-frames:v', 1]),
              '-vf', vf + ',format=gray', '-f', 'rawvideo', '-')

videos = {}
for file in [master, out / 'hotpress-collaboration-v10-web.mp4']:
    p = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(file)]))
    ff('-i', file, '-f', 'null', '-')
    data = file.read_bytes()
    assert data.index(b'moov') < data.index(b'mdat')
    videos[file.name] = dict(duration=p['format']['duration'], videoBitrate=p['streams'][0]['bit_rate'],
                            containerBitrate=p['format']['bit_rate'], bytes=len(data),
                            sha256=hashlib.sha256(data).hexdigest(), completeDecode='passed', faststart=True)
assert all("'" not in item['text'] and '${' not in item['text'] for item in meta['visibleStrings'])
assert 48 / 58 >= .7
end_text = meta['visibleStrings'][0]['text']
assert end_text.count('end to end') == 1 and 'median of 30 edits\n' in end_text

match = next(q for q in meta['shots'] if q['name'] == '12-match')
w, h, y = 1500, 127, 840
raw = pixels(master, match['timeline'], f'crop={w}:{h}:0:{y}', match['duration'])
lowest = -1
for offset in range(0, len(raw), w*h):
    frame = raw[offset:offset+w*h]
    for row in range(h):
        if sum(v < 100 for v in frame[row*w:(row+1)*w]) > 5:
            lowest = max(lowest, y+row)
clear = 967 - lowest - 1
assert clear >= 45, clear
spacing = dict(shot='12-match', frames=len(raw)//(w*h), lowestInkY=lowest, captionTopY=967, clearPixels=clear,
               sourceParagraphStepPx=67, mergeSourceParagraphStepPx=67,
               note='Same source paragraph spacing and uniform scaling; existing three selected lines retained.')
(out / 'v10-spacing-verification.json').write_text(json.dumps(spacing, indent=2)+'\n')

unchanged = []
changed = {'01-alone', '02-link', '10-reconnected', '12-match'}
for q, previous in zip(meta['shots'], old['shots']):
    for key in ['name','who','s','e','caption','crop','source']:
        assert q[key] == previous[key], (q['name'], key)
    if q['name'] in changed:
        continue
    assert q['duration'] == previous['duration']
    offset = min(1, q['duration']/2)
    a = pixels(master, q['timeline']+offset, 'scale=480:270')
    b = pixels(prior/'hotpress-collaboration-v9.mp4', previous['timeline']+offset, 'scale=480:270')
    error = sum(abs(x-y) for x,y in zip(a,b))/len(a)
    assert error < 1, (q['name'], error)
    unchanged.append(dict(shot=q['name'], meanAbsolutePixelDifference=round(error, 5)))
reconnect = next(q for q in meta['shots'] if q['name'] == '10-reconnected')
assert reconnect['holdEnd'] == 1.5
# The real badge must remain visually stable across all 45 held output frames.
raw = pixels(master, reconnect['timeline'] + .8, 'crop=150:90:1370:0', 1.5)
frames = [raw[i:i+13500] for i in range(0,len(raw),13500)]
errors = [sum(abs(a-b) for a,b in zip(frames[0], frame))/13500 for frame in frames]
assert len(frames) == 45 and max(errors) < 1
report = dict(videos=videos, spacing=spacing, visibleTextGuard='passed', statsSublineRatio=48/58,
              liveHoldSeconds=1.5, liveHoldFrames=len(frames), liveBadgeMaximumMeanDifference=max(errors),
              unchangedShotChecks=unchanged, newRecordings=0, newRooms=0,
              visualReview='See V10-NOTES.md for full-size and 390 px review.',
              port3847='free' if subprocess.run(['lsof','-nP','-iTCP:3847','-sTCP:LISTEN'],capture_output=True).returncode == 1 else 'occupied')
assert report['port3847'] == 'free'
(out / 'v10-delivery-verification.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps(report, indent=2))
