import { execFileSync } from "node:child_process";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  openSync,
  closeSync,
} from "node:fs";
import { chromium } from "@playwright/test";

const out = process.env.HOTPRESS_PROOF_OUTPUT;
const take = process.env.HOTPRESS_PROOF_TAKE;
const suite = process.env.HOTPRESS_PROOF_SUITE;
if (!out || !take || !suite)
  throw new Error("Explicit output, take and suite paths required");
const scenario = JSON.parse(
  readFileSync(`${take}/portfolio-scenario.json`, "utf8"),
);
const results = JSON.parse(readFileSync(`${suite}/suite-results.json`, "utf8"));
const measurement = JSON.parse(readFileSync(`${suite}/latency.json`, "utf8"));
if (
  !scenario.passed ||
  !scenario.continuousTake ||
  results.stats.unexpected ||
  results.stats.skipped ||
  results.stats.flaky ||
  results.stats.expected !== 20
)
  throw new Error("A complete successful take and 20-test suite are required");
const median = (measurement.edits.medianMs / 1000).toFixed(1);
const duration = scenario.durationSeconds;
if (duration < 45 || duration + 3 > 65)
  throw new Error("Take outside duration budget");
const assets = `${out}/v3-composition-assets`;
mkdirSync(assets, { recursive: true });
mkdirSync(`${out}/v3-frames`, { recursive: true });
const timing = (name) => scenario.events.find((e) => e.name === name).seconds;
const captions = [
  ["join", "A guest joins through the share link"],
  ["parallel", "Both write at the same time"],
  ["sentence", "Same sentence, two places"],
  ["comments", "Comment on a phrase"],
  ["reply", "Reply in place"],
  ["offline", "The guest goes offline and keeps writing"],
  ["reconnect", "Back online, everything merges"],
];
const font = readFileSync(
  "node_modules/@fontsource/inter/files/inter-latin-500-normal.woff2",
).toString("base64");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
});
const base = `<style>@font-face{font-family:Inter;src:url(data:font/woff2;base64,${font})}*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;font-family:Inter;font-weight:500}body{background:transparent}.pill{position:absolute;bottom:27px;left:50%;transform:translateX(-50%);padding:15px 27px;border-radius:30px;background:rgba(7,12,19,.83);color:#fff;font-size:30px;white-space:nowrap}</style>`;
async function asset(name, html, viewport = { width: 1920, height: 1080 }) {
  await page.setViewportSize(viewport);
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
        (x, i) => `
<div style="position:absolute;left:${x}px;top:83px;font-size:24px;color:#b4bec8">${i ? "Guest, via share link" : "Ana, signed in"}</div>
<div style="position:absolute;left:${x}px;top:136px;width:872px;height:838px;background:#fff;border-radius:12px;box-shadow:0 14px 42px #0005;overflow:hidden"><div style="height:38px;background:#29333d;color:#b4bdc6;font-size:15px;display:flex;align-items:center;justify-content:center">hotpress.app</div><div style="position:absolute;left:17px;top:15px;display:flex;gap:7px">${[0, 1, 2].map(() => '<i style="width:7px;height:7px;background:#84909a;border-radius:50%"></i>').join("")}</div></div>`,
      )
      .join(""),
);
await asset(
  "mask",
  '<div style="background:black;width:872px;height:800px"><div style="width:872px;height:800px;background:white;border-radius:0 0 12px 12px"></div></div>',
  { width: 872, height: 800 },
);
for (let i = 0; i < captions.length; i++)
  await asset(`caption-${i}`, `<div class="pill">${captions[i][1]}</div>`);
await asset(
  "end",
  `<div style="position:absolute;inset:0;background:#182028;display:flex;align-items:center;justify-content:center;text-align:center;color:#f4f6f8"><div><div style="font-size:48px;line-height:1.4">Hotpress, real-time collaboration<br>on Lexical, Liveblocks and Yjs</div><div style="font-size:32px;color:#b4bec8;margin-top:40px">${median} s median edit sync &nbsp;·&nbsp; Suite ${results.stats.expected}/20 passed</div></div></div>`,
);
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
  const file = `${take}/raw-${name}.webm`,
    meta = probe(file),
    [n, d] = meta.streams[0].r_frame_rate.split("/").map(Number);
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
  if (last < 0) throw new Error("Sync slate missing");
  return (last + 1) / (n / d);
});
// Continuous camera transform on the composed frame, never a cut between actions.
const ease = (t, a, b) =>
  `(clip((${t}-${a})/(${b}-${a}),0,1)*clip((${t}-${a})/(${b}-${a}),0,1)*(3-2*clip((${t}-${a})/(${b}-${a}),0,1)))`;
const t = "on/30";
const zi = ease(t, 19, 21),
  zo = ease(t, timing("reply-visible") + 1.5, timing("reply-visible") + 3.2);
const z = `1+1.8*${zi}*(1-${zo})`;
const pan = ease(t, timing("hover-visible"), timing("hover-visible") + 0.7),
  back = ease(t, timing("reply-visible"), timing("reply-visible") + 1.2);
const cx = `636+920*${pan}*(1-${back})`;
const ffargs = [
  "-y",
  "-threads",
  "2",
  "-i",
  `${take}/raw-ana.webm`,
  "-i",
  `${take}/raw-guest.webm`,
];
for (const name of [
  "frame",
  "mask",
  ...captions.map((_, i) => `caption-${i}`),
  "end",
])
  ffargs.push(
    "-loop",
    "1",
    "-framerate",
    "30",
    "-t",
    String(name === "end" ? 3 : duration),
    "-i",
    `${assets}/${name}.png`,
  );
let f = `[0:v]trim=start=${starts[0]}:duration=${duration},setpts=PTS-STARTPTS,fps=30,format=rgb24[a];[1:v]trim=start=${starts[1]}:duration=${duration},setpts=PTS-STARTPTS,fps=30,format=rgb24[b];[3:v]format=gray,split[ma][mb];[a][ma]alphamerge=shortest=1[ar];[b][mb]alphamerge=shortest=1[br];[2:v][ar]overlay=64:174:shortest=1[l];[l][br]overlay=984:174:shortest=1,scale=3840:2160,zoompan=z='${z}':x='max(0,min(iw-iw/zoom,(${cx})*2-iw/zoom/2))':y='max(0,min(ih-ih/zoom,514*2-ih/zoom/2))':d=1:s=1920x1080:fps=30[cam];`;
let prev = "cam";
for (let i = 0; i < captions.length; i++) {
  const start = timing(captions[i][0]),
    end = i + 1 < captions.length ? timing(captions[i + 1][0]) : duration;
  f += `[${4 + i}:v]format=rgba,fade=t=in:st=${start}:d=0.3:alpha=1,fade=t=out:st=${end - 0.3}:d=0.3:alpha=1[c${i}];[${prev}][c${i}]overlay=0:0:shortest=1[s${i}];`;
  prev = `s${i}`;
}
f += `[${prev}]trim=duration=${duration},setpts=PTS-STARTPTS,setsar=1,format=yuv420p[demo];[11:v]trim=duration=3,setpts=PTS-STARTPTS,setsar=1,format=yuv420p[end];[demo][end]concat=n=2:v=1:a=0[v]`;
writeFileSync(`${assets}/filter.txt`, f);
const log = openSync(`${out}/v3-encode.log`, "w");
try {
  execFileSync(
    "ffmpeg",
    [
      ...ffargs,
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
      "medium",
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
      `${out}/hotpress-collaboration-v3.mp4`,
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
    `${out}/hotpress-collaboration-v3.mp4`,
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
    `${out}/hotpress-collaboration-v3-web.mp4`,
  ],
  { stdio: "ignore" },
);
const frames = [
  ["01-join", timing("pointers-visible") + 0.3],
  ["02-parallel", timing("parallel-visible") + 0.2],
  ["03-sentence", timing("sentence-visible") + 0.2],
  ["04-comment", timing("composer-ready") + 0.1],
  ["05-reply", timing("reply-visible") + 1.3],
  ["06-offline", timing("offline-visible") + 0.2],
  ["07-merged", timing("merged") + 1.5],
  ["08-end", duration + 1],
];
for (const [name, seconds] of frames)
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-ss",
      String(seconds),
      "-i",
      `${out}/hotpress-collaboration-v3.mp4`,
      "-frames:v",
      "1",
      `${out}/v3-frames/${name}.png`,
    ],
    { stdio: "ignore" },
  );
execFileSync(
  "ffmpeg",
  [
    "-y",
    "-ss",
    String(timing("reply-visible") + 1.3),
    "-i",
    `${out}/hotpress-collaboration-v3.mp4`,
    "-frames:v",
    "1",
    "-q:v",
    "2",
    `${out}/hotpress-collaboration-v3-poster.jpg`,
  ],
  { stdio: "ignore" },
);
// Contact sheet uses the actual exported full-resolution step frames.
const sheetBrowser = await chromium.launch({ headless: true });
const sheet = await sheetBrowser.newPage({
  viewport: { width: 1920, height: 1200 },
});
await sheet.setContent(
  base +
    `<div style="background:#182028;padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:12px">${frames.map(([name]) => `<div><div style="color:#b4bec8;font-size:18px;margin-bottom:5px">${name}</div><img style="width:100%;display:block" src="data:image/png;base64,${readFileSync(`${out}/v3-frames/${name}.png`).toString("base64")}"></div>`).join("")}</div>`,
);
await sheet.screenshot({ path: `${out}/v3-contact-sheet.png`, fullPage: true });
await sheetBrowser.close();
writeFileSync(
  `${out}/v3-metadata.json`,
  JSON.stringify(
    {
      take,
      suite,
      starts,
      duration: duration + 3,
      medianSeconds: median,
      measurementFile: `${suite}/latency.json`,
      suiteResults: `${suite}/suite-results.json`,
      frames,
      master: probe(`${out}/hotpress-collaboration-v3.mp4`),
      web: probe(`${out}/hotpress-collaboration-v3-web.mp4`),
    },
    null,
    2,
  ),
);
console.log(JSON.stringify({ starts, duration: duration + 3, median, frames }));
