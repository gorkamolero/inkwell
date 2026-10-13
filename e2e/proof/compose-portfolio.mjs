import { execFileSync } from "node:child_process";
import {
  readFileSync,
  writeFileSync,
  openSync,
  closeSync,
  unlinkSync,
} from "node:fs";
const out = process.env.HOTPRESS_PROOF_OUTPUT;
if (!out) throw new Error("Explicit output required");
const ffmpeg = process.env.HOTPRESS_PROOF_FFMPEG || "ffmpeg";
const font = "/System/Library/Fonts/Supplemental/Arial.ttf";
const scenario = JSON.parse(
  readFileSync(`${out}/portfolio-scenario.json`, "utf8"),
);
if (!scenario.passed || !scenario.continuousTake)
  throw new Error("Refusing unsuccessful take");
const measurement = JSON.parse(
  readFileSync(`${out}/names-suite/latency.json`, "utf8"),
);
const suiteLog = readFileSync(`${out}/names-suite/suite.log`, "utf8");
if (!suiteLog.includes("18 passed"))
  throw new Error("Full suite result missing");
const median = (measurement.edits.medianMs / 1000).toFixed(1);
const probe = (file) =>
  JSON.parse(
    execFileSync(
      "ffprobe",
      ["-v", "error", "-show_streams", "-show_format", "-of", "json", file],
      { encoding: "utf8" },
    ),
  );
const starts = [];
for (const name of ["ana", "guest"]) {
  const file = `${out}/raw-${name}.webm`;
  const meta = probe(file),
    [num, den] = meta.streams[0].r_frame_rate.split("/").map(Number),
    fps = num / den;
  const pixels = execFileSync(
    "ffmpeg",
    [
      "-v",
      "error",
      "-i",
      file,
      "-vf",
      "crop=2:2:0:0,scale=1:1,format=rgb24",
      "-f",
      "rawvideo",
      "-",
    ],
    { maxBuffer: 16 * 1024 * 1024 },
  );
  let last = -1;
  for (let i = 0; i < pixels.length; i += 3)
    if (pixels[i] < 40 && pixels[i + 1] > 210 && pixels[i + 2] < 40)
      last = i / 3;
  if (last < 0) throw new Error("Recording sync slate missing");
  starts.push((last + 1) / fps);
}
const duration = scenario.durationSeconds;
const captionSteps = [
  ["join", "A guest joins through the share link"],
  ["parallel", "Both write at the same time"],
  ["sentence", "Same sentence, two places"],
  ["comments", "Comment and reply"],
  ["offline", "The guest goes offline and keeps writing"],
  ["reconnect", "Back online, everything merges"],
];
const timing = (name) => scenario.events.find((e) => e.name === name).seconds;
let f = `[0:v]trim=start=${starts[0]}:duration=${duration},setpts=PTS-STARTPTS,crop=956:908:0:0,fps=30[a];[1:v]trim=start=${starts[1]}:duration=${duration},setpts=PTS-STARTPTS,crop=956:908:0:0,fps=30[b];[a][b]hstack=inputs=2:shortest=1,pad=1920:1080:4:72:color=0x16191e,drawbox=x=958:y=72:w=4:h=908:color=0x555b65:t=fill,drawtext=fontfile='${font}':text='Ana, signed in':fontcolor=white:fontsize=27:x=28:y=23,drawtext=fontfile='${font}':text='Guest, via share link':fontcolor=white:fontsize=27:x=988:y=23`;
for (let i = 0; i < captionSteps.length; i++) {
  const [name, text] = captionSteps[i];
  const start = timing(name),
    end =
      i + 1 < captionSteps.length ? timing(captionSteps[i + 1][0]) : duration;
  f += `,drawtext=fontfile='${font}':text='${text}':fontcolor=white:fontsize=34:x=(w-tw)/2:y=1017:alpha='if(lt(t,${start}),0,if(lt(t,${start + 0.3}),(t-${start})/.3,if(lt(t,${end - 0.3}),1,if(lt(t,${end}),(${end}-t)/.3,0))))'`;
}
f += "[demo];";
f += `color=c=0x16191e:s=1920x1080:r=30:d=3,drawtext=fontfile='${font}':text='Hotpress, real-time collaboration on Lexical, Liveblocks and Yjs':fontsize=46:fontcolor=white:x=(w-tw)/2:y=440,drawtext=fontfile='${font}':text='${median} s median edit sync  ·  Full suite passed 18/18':fontsize=38:fontcolor=0xcbd5e1:x=(w-tw)/2:y=540[end];[demo][end]concat=n=2:v=1:a=0,format=yuv420p[v]`;
const log = openSync(`${out}/portfolio-encode.log`, "w");
try {
  execFileSync(
    ffmpeg,
    [
      "-y",
      "-i",
      `${out}/raw-ana.webm`,
      "-i",
      `${out}/raw-guest.webm`,
      "-filter_complex",
      f,
      "-map",
      "[v]",
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-b:v",
      "7M",
      "-minrate",
      "7M",
      "-maxrate",
      "7M",
      "-bufsize",
      "14M",
      "-x264-params",
      "nal-hrd=cbr:force-cfr=1",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      `${out}/hotpress-collaboration.mp4`,
    ],
    { stdio: ["ignore", "ignore", log] },
  );
} finally {
  closeSync(log);
}
const posterTime = timing("reply-visible") + 1;
execFileSync(
  "ffmpeg",
  [
    "-y",
    "-ss",
    String(posterTime),
    "-i",
    `${out}/hotpress-collaboration.mp4`,
    "-frames:v",
    "1",
    `${out}/poster-frame.png`,
  ],
  { stdio: "ignore" },
);
execFileSync(
  "sips",
  [
    "-s",
    "format",
    "jpeg",
    "-s",
    "formatOptions",
    "85",
    `${out}/poster-frame.png`,
    "--out",
    `${out}/hotpress-collaboration-poster.jpg`,
  ],
  { stdio: "ignore" },
);
unlinkSync(`${out}/poster-frame.png`);
writeFileSync(
  `${out}/portfolio-metadata.json`,
  JSON.stringify(
    {
      starts,
      posterTime,
      medianSeconds: median,
      measurementFile: "names-suite/latency.json",
      ...probe(`${out}/hotpress-collaboration.mp4`),
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({ starts, posterTime, duration: duration + 3, median }),
);
