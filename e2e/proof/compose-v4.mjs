import { execFileSync } from "node:child_process";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  openSync,
  closeSync,
} from "node:fs";
import { chromium } from "@playwright/test";
const out = process.env.HOTPRESS_PROOF_OUTPUT,
  take = process.env.HOTPRESS_PROOF_TAKE,
  suite = process.env.HOTPRESS_PROOF_SUITE;
if (!out || !take || !suite)
  throw Error("Explicit output, take and suite required");
const scenario = JSON.parse(readFileSync(`${take}/portfolio-scenario.json`)),
  results = JSON.parse(readFileSync(`${suite}/suite-results.json`)),
  latency = JSON.parse(readFileSync(`${suite}/latency.json`));
if (
  !scenario.passed ||
  !scenario.continuousTake ||
  results.stats.expected !== 20 ||
  results.stats.unexpected ||
  results.stats.skipped ||
  results.stats.flaky
)
  throw Error("Successful continuous take and full 20-test suite required");
const at = (name) => {
  const e = scenario.events.find((e) => e.name === name);
  if (!e) throw Error(name);
  return e.seconds;
};
const duration = scenario.durationSeconds,
  total = duration + 3.5;
if (total < 45 || total > 55)
  throw Error(`Duration ${total} outside 45–55 seconds`);
const assets = `${out}/v4-composition-assets`;
mkdirSync(assets, { recursive: true });
for (const d of ["v4-frames", "v4-every2s", "v4-phone"])
  mkdirSync(`${out}/${d}`, { recursive: true });
const median = (latency.edits.medianMs / 1000).toFixed(1);
const font = readFileSync(
  "node_modules/@fontsource/inter/files/inter-latin-500-normal.woff2",
).toString("base64");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const base = `<style>@font-face{font-family:Inter;src:url(data:font/woff2;base64,${font})}*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;font:500 36px Inter;background:transparent}.pill{position:absolute;border-radius:40px;background:#0c131ded;color:white;padding:17px 27px;white-space:nowrap}</style>`;
async function asset(name, html) {
  await page.setContent(base + html);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `${assets}/${name}.png`,
    omitBackground: true,
  });
}
await asset(
  "frame",
  `<div style="position:absolute;inset:0;background:#182028"></div>` +
    [64, 984]
      .map(
        (x, i) =>
          `<div style="position:absolute;left:${x}px;top:82px;font-size:26px;color:#b4bec8">${i ? "Guest, via share link" : "Ana, signed in"}</div><div style="position:absolute;left:${x}px;top:136px;width:872px;height:838px;background:white;border-radius:12px;box-shadow:0 14px 42px #0005;overflow:hidden"><div style="height:38px;background:#29333d;color:#b4bdc6;font-size:21px;display:flex;align-items:center;justify-content:center">hotpress.app${i ? scenario.sharePath : ""}</div><div style="position:absolute;left:17px;top:15px;display:flex;gap:7px">${[1, 2, 3].map(() => '<i style="width:7px;height:7px;background:#84909a;border-radius:50%"></i>').join("")}</div></div>`,
      )
      .join(""),
);
const captions = [
  [0, "One story. Two writers."],
  [at("join"), "Join through a shared link"],
  [at("parallel-ana"), "Two writers, one document"],
  [at("sentence"), "Same sentence, two places"],
  [at("comments"), "Select a phrase. Start a thread."],
  [at("reply"), "Hover, open, reply"],
  [at("reply-send") - 0.1, "The reply reaches Ana"],
  [at("offline") + 0.3, "Offline. Still writing."],
  [at("online-writing") + 0.55, "Ana keeps writing online"],
  [at("reconnect"), "Back online. Both edits merge."],
  [at("merged") + 1, "The same story on both screens"],
];
for (let i = 0; i < captions.length; i++)
  await asset(
    `caption-${i}`,
    `<div class="pill" style="${i === 7 ? "top:125px" : "bottom:20px"};left:32px;font-size:48px">${captions[i][1]}</div>`,
  );
for (const [key, name] of [
  ["ana", "Ana’s screen"],
  ["guest", "Guest’s screen"],
])
  await asset(
    `tag-${key}`,
    `<div class="pill" style="bottom:20px;right:32px;font-size:44px">${name}</div>`,
  );
await asset(
  "glow",
  '<div style="position:absolute;left:70px;top:750px;width:970px;height:90px;border:5px solid #65bca4;border-radius:16px;box-shadow:0 0 30px #65bca466;background:#65bca412"></div>',
);
await asset(
  "end",
  `<div style="position:absolute;inset:0;background:#182028;color:#f4f6f8;display:flex;align-items:center;justify-content:center;text-align:center"><div><div style="font-size:74px">Hotpress, real-time collaboration</div><div style="font-size:50px;line-height:1.6;color:#c6d0da;margin-top:60px">Edits reach the other writer in about ${median} s<br>· 20 end-to-end checks against Liveblocks</div><div class="end-url" style="font-size:50px;color:#c6d0da;margin-top:66px">hotpress.app · github.com/gorkamolero/inkwell</div></div></div>`,
);
await page.locator(".end-url").evaluate((el) => {
  el.style.opacity = "0";
});
await page.screenshot({ path: `${assets}/end-base.png`, omitBackground: true });
await browser.close();
const probe = (file) =>
  JSON.parse(
    execFileSync(
      "ffprobe",
      ["-v", "error", "-show_streams", "-show_format", "-of", "json", file],
      { encoding: "utf8" },
    ),
  );
const starts = ["ana", "guest"].map((name) => {
  const f = `${take}/raw-${name}.webm`,
    [n, d] = probe(f).streams[0].r_frame_rate.split("/").map(Number);
  const pixels = execFileSync(
    "ffmpeg",
    [
      "-v",
      "error",
      "-i",
      f,
      "-vf",
      "crop=2:2:0:0,scale=1:1,format=rgb24",
      "-f",
      "rawvideo",
      "-",
    ],
    { maxBuffer: 16000000 },
  );
  let last = -1;
  for (let i = 0; i < pixels.length; i += 3)
    if (pixels[i] < 40 && pixels[i + 1] > 210 && pixels[i + 2] < 40)
      last = i / 3;
  if (last < 0) throw Error("No sync slate");
  return (last + 1) / (n / d);
});
const ease = (t, a, b) =>
  `(pow(clip((${t}-${a})/(${b}-${a}),0,1),2)*(3-2*clip((${t}-${a})/(${b}-${a}),0,1)))`;
// Hard cuts change person. Each close camera stays inside a single window;
// vertical reframes use 700 ms smoothstep, retaining the complete text column.
const cuts = [
  [0, "wide", 0],
  [3, "guest", -38],
  [at("avatar-arrival") - 0.1, "ana", 0],
  [at("joined") + 0.2, "guest", -38],
  [at("parallel-ana"), "ana", 80],
  [at("parallel-ana") + 1.8, "guest", 80],
  [at("sentence"), "ana", 95],
  [at("comments"), "ana", 140],
  [at("reply"), "guest", 140],
  [at("reply-send") - 0.12, "ana", 140],
  [at("offline") + 0.3, "guest", 0],
  [at("online-writing") + 0.55, "ana", 60],
  [at("reconnect"), "ana", 65],
  [at("merged") + 1, "wide", 0],
];
// Build chronological conditional expressions, with later keyframes outermost.
const steps = (arr) =>
  arr
    .slice(1)
    .reduce((e, [s, v]) => `if(gte(on/30,${s}),${v},${e})`, arr[0][1]);
const z = steps(
  cuts.map(([s, who], i) => [s, who === "wide" ? "1" : "2.22222222"]),
);
const xx = steps(
  cuts.map(([s, who], i) => [
    s,
    who === "wide" ? "0" : who === "ana" ? "68" : "988",
  ]),
);
const yy = steps(
  cuts.map(([s, who, y], i) => {
    const prev = cuts[i - 1];
    return [
      s,
      who === "wide"
        ? "0"
        : prev?.[1] === who && prev[2] !== y
          ? `${174 + prev[2]}+(${y - prev[2]})*${ease("on/30", s, s + 0.7)}`
          : String(174 + y),
    ];
  }),
);
const inputs = [
  "frame",
  ...captions.map((_, i) => `caption-${i}`),
  "tag-ana",
  "tag-guest",
  "glow",
  "end",
  "end-base",
];
const args = [
  "-y",
  "-i",
  `${take}/raw-ana.webm`,
  "-i",
  `${take}/raw-guest.webm`,
];
for (const name of inputs)
  args.push(
    "-loop",
    "1",
    "-framerate",
    "30",
    "-t",
    String(name.startsWith("end") ? 3.5 : duration),
    "-i",
    `${assets}/${name}.png`,
  );
let f = `[0:v]trim=start=${starts[0]}:duration=${duration},setpts=PTS-STARTPTS,fps=30[a];[1:v]trim=start=${starts[1]}:duration=${duration},setpts=PTS-STARTPTS,fps=30[b];[2:v][a]overlay=64:174:shortest=1[l];[l][b]overlay=984:174:shortest=1,scale=3840:2160,zoompan=z='${z}':x='(${xx})*2':y='(${yy})*2':d=1:s=1920x1080:fps=30[cam];`;
let prev = "cam";
for (let i = 0; i < captions.length; i++) {
  const s = captions[i][0],
    e = captions[i + 1]?.[0] ?? duration;
  f += `[${3 + i}:v]format=rgba,fade=t=in:st=${s}:d=0.18:alpha=1,fade=t=out:st=${e - 0.18}:d=0.18:alpha=1[c${i}];[${prev}][c${i}]overlay=0:0:shortest=1[s${i}];`;
  prev = `s${i}`;
}
for (const [i, who] of ["ana", "guest"].entries()) {
  const enable = cuts
    .map(([s, w], j) =>
      w === who ? `between(t,${s},${cuts[j + 1]?.[0] ?? duration})` : null,
    )
    .filter(Boolean)
    .join("+");
  f += `[${prev}][${3 + captions.length + i}:v]overlay=0:0:enable='${enable}':shortest=1[tag${i}];`;
  prev = `tag${i}`;
}
f += `[${3 + captions.length + 2}:v]format=rgba,fade=t=in:st=${at("arrival")}:d=0.15:alpha=1,fade=t=out:st=${at("arrival") + 0.85}:d=0.15:alpha=1[glow];[${prev}][glow]overlay=0:0:shortest=1[highlight];[highlight]trim=duration=${duration},setpts=PTS-STARTPTS,setsar=1,format=yuv420p[demo];[${3 + captions.length + 4}:v]trim=duration=3.5,setpts=PTS-STARTPTS,setsar=1[base];[${3 + captions.length + 3}:v]trim=duration=3.5,setpts=PTS-STARTPTS,setsar=1,format=rgba,fade=t=in:st=0.4:d=0.4:alpha=1[reveal];[base][reveal]overlay=0:0:shortest=1,format=yuv420p[end];[demo][end]concat=n=2:v=1:a=0[v]`;
writeFileSync(`${assets}/filter.txt`, f);
const log = openSync(`${out}/v4-encode.log`, "w");
try {
  execFileSync(
    "ffmpeg",
    [
      ...args,
      "-filter_complex_threads",
      "1",
      "-filter_complex",
      f,
      "-map",
      "[v]",
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-threads",
      "4",
      "-b:v",
      "8M",
      "-minrate",
      "8M",
      "-maxrate",
      "8M",
      "-bufsize",
      "16M",
      "-x264-params",
      "nal-hrd=cbr:force-cfr=1",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      `${out}/hotpress-collaboration-v4.mp4`,
    ],
    { stdio: ["ignore", "ignore", log] },
  );
} finally {
  closeSync(log);
}
execFileSync(
  "ffmpeg",
  [
    "-y",
    "-i",
    `${out}/hotpress-collaboration-v4.mp4`,
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "22",
    "-tune",
    "stillimage",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    `${out}/hotpress-collaboration-v4-web.mp4`,
  ],
  { stdio: "ignore" },
);
const frames = [
  ["01-alone", 1],
  ["02-join", at("joined") + 0.35],
  ["03-both-writing", at("parallel-ana") + 2.5],
  ["04-same-sentence", at("sentence-visible")],
  ["05-selection", at("selection-visible") + 0.1],
  ["06-comment", at("composer-ready")],
  ["07-guest-reply", at("reply-ready")],
  ["08-ana-reply", at("reply-visible") + 0.5],
  ["09-offline", at("offline-visible") + 0.2],
  ["10-ana-online", at("online-visible")],
  ["11-merge", at("arrival") + 0.5],
  ["12-match", at("merged") + 1.6],
  ["13-end", duration + 1],
];
for (const [name, t] of frames)
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-ss",
      String(t),
      "-i",
      `${out}/hotpress-collaboration-v4.mp4`,
      "-frames:v",
      "1",
      `${out}/v4-frames/${name}.png`,
    ],
    { stdio: "ignore" },
  );
execFileSync(
  "ffmpeg",
  [
    "-y",
    "-ss",
    String(at("reply-visible") + 0.5),
    "-i",
    `${out}/hotpress-collaboration-v4.mp4`,
    "-frames:v",
    "1",
    "-q:v",
    "2",
    `${out}/hotpress-collaboration-v4-poster.jpg`,
  ],
  { stdio: "ignore" },
);
execFileSync(
  "ffmpeg",
  [
    "-y",
    "-i",
    `${out}/hotpress-collaboration-v4.mp4`,
    "-vf",
    "fps=1/2",
    `${out}/v4-every2s/%03d.png`,
  ],
  { stdio: "ignore" },
);
execFileSync(
  "ffmpeg",
  [
    "-y",
    "-i",
    `${out}/hotpress-collaboration-v4.mp4`,
    "-vf",
    "fps=1/2,scale=390:-1",
    `${out}/v4-phone/%03d.png`,
  ],
  { stdio: "ignore" },
);
const sb = await chromium.launch();
const sp = await sb.newPage({ viewport: { width: 1600, height: 1000 } });
await sp.setContent(
  base +
    `<div style="background:#182028;padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:12px">${frames.map(([name]) => `<div><div style="color:#b4bec8;font-size:22px;margin-bottom:5px">${name}</div><img style="width:100%;display:block" src="data:image/png;base64,${readFileSync(`${out}/v4-frames/${name}.png`).toString("base64")}"></div>`).join("")}</div>`,
);
await sp.screenshot({ path: `${out}/v4-contact-sheet.png`, fullPage: true });
await sb.close();
writeFileSync(
  `${out}/v4-metadata.json`,
  JSON.stringify(
    {
      take,
      suite,
      starts,
      duration: total,
      medianMs: latency.edits.medianMs,
      p95Ms: latency.edits.p95Ms,
      frames,
      cuts,
      master: probe(`${out}/hotpress-collaboration-v4.mp4`),
      web: probe(`${out}/hotpress-collaboration-v4-web.mp4`),
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({ duration: total, median, p95Ms: latency.edits.p95Ms }),
);
