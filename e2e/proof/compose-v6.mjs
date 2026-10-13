import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { chromium } from "@playwright/test";
const out = process.env.HOTPRESS_PROOF_OUTPUT;
if (!out) throw Error("Explicit output required");
const take = `${out}/take-1`,
  old = process.env.HOTPRESS_V5_SOURCE;
if (!old) throw Error("Explicit accepted v5 source required");
const scenario = JSON.parse(readFileSync(`${take}/portfolio-scenario.json`));
const latency = JSON.parse(readFileSync(`${out}/suite/latency.json`));
if (!scenario.passed || latency.edits.rawMs.length !== 30)
  throw Error("Successful take and 30 fresh samples required");
const at = (n) => scenario.events.find((e) => e.name === n).seconds;
const assets = `${out}/v6-composition-assets`;
for (const d of [
  assets,
  `${out}/v6-frames`,
  `${out}/v6-every2s`,
  `${out}/v6-phone`,
])
  mkdirSync(d, { recursive: true });
const run = (args) =>
  execFileSync("ffmpeg", ["-v", "error", "-y", ...args], {
    stdio: ["ignore", "ignore", "pipe"],
    maxBuffer: 32 * 1024 * 1024,
  });
const probe = (file) =>
  JSON.parse(
    execFileSync("ffprobe", [
      "-v",
      "error",
      "-show_streams",
      "-show_format",
      "-of",
      "json",
      file,
    ]),
  );
function start(file) {
  const [n, d] = probe(file).streams[0].r_frame_rate.split("/").map(Number);
  const p = execFileSync(
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
    { maxBuffer: 16000000 },
  );
  let last = -1;
  for (let i = 0; i < p.length; i += 3)
    if (p[i] < 40 && p[i + 1] > 210 && p[i + 2] < 40) last = i / 3;
  if (last < 0) throw Error("Missing sync slate");
  return (last + 1) / (n / d);
}
const starts = {};
for (const source of [take, `${old}/take-1`])
  for (const who of ["ana", "guest"]) {
    const path = `${source}/raw-${who}.webm`;
    starts[path] = start(path);
  }
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const font = readFileSync(
  "node_modules/@fontsource/inter/files/inter-latin-500-normal.woff2",
).toString("base64");
const base = `<style>@font-face{font-family:Inter;src:url(data:font/woff2;base64,${font})}*{box-sizing:border-box}body{margin:0;font:500 48px Inter;color:white}.pill{position:absolute;bottom:20px;border-radius:44px;background:#0c131ded;padding:17px 27px;white-space:nowrap}.tag{right:32px;font-size:44px}.caption{left:32px}</style>`;
async function asset(name, html) {
  await page.setContent(base + html);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `${assets}/${name}.png`,
    omitBackground: true,
  });
  return `${assets}/${name}.png`;
}
// Align the receiving cut to the recorded pixels, not the later polling event.
// The offline paragraph occupies this otherwise blank region in this layout.
const mergeScanStart = at("arrival") - 1.2;
const mergePixels = execFileSync(
  "ffmpeg",
  [
    "-v",
    "error",
    "-ss",
    String(starts[`${take}/raw-ana.webm`] + mergeScanStart),
    "-i",
    `${take}/raw-ana.webm`,
    "-t",
    "2",
    "-vf",
    "fps=25,crop=600:45:20:395,format=gray",
    "-f",
    "rawvideo",
    "-",
  ],
  { maxBuffer: 4000000 },
);
const ink = [];
for (let offset = 0; offset < mergePixels.length; offset += 27000) {
  ink.push(
    mergePixels
      .subarray(offset, offset + 27000)
      .reduce((n, pixel) => n + (pixel < 100), 0),
  );
}
const firstInk = ink.findIndex((n) => n > 500);
if (firstInk < 3 || ink.slice(firstInk).some((n) => n < 500))
  throw Error("Cannot locate stable sentence arrival");
const mergeAppearance = mergeScanStart + firstInk / 25;
const shots = [];
function shot(name, who, s, e, caption, crop = 110, source = take, extra = {}) {
  shots.push({ name, who, s, e, caption, crop, source, ...extra });
}
shot("01-alone", "ana", 0, at("join"), "One story. Two writers.", "opening");
shot(
  "02-link",
  "guest",
  at("join"),
  at("avatar-arrival") - 0.12,
  "Join through a shared link",
  "url",
);
shot(
  "02-arrival",
  "ana",
  at("avatar-arrival") - 0.18,
  at("avatar-arrival") + 1.05,
  "Join through a shared link",
  0,
);
shot(
  "03-ana-writing",
  "ana",
  5.229,
  7.029,
  "Two writers, one document",
  110,
  `${old}/take-1`,
);
shot(
  "03-guest-writing",
  "guest",
  7.029,
  9.625,
  "Two writers, one document",
  110,
  `${old}/take-1`,
);
shot(
  "04-sentence",
  "ana",
  9.625,
  13.159,
  "Same sentence, two places",
  110,
  `${old}/take-1`,
);
shot(
  "05-comment",
  "ana",
  at("comments"),
  at("reply"),
  "Select a phrase. Start a thread.",
  120,
);
shot(
  "07-guest-reply",
  "guest",
  at("reply"),
  at("reply-send"),
  "Hover, open, reply",
  120,
);
shot(
  "08-ana-reply",
  "ana",
  at("count-two") - 0.35,
  at("offline-intro"),
  "The reply reaches Ana",
  120,
);
shot(
  "09-offline-badge",
  "guest",
  at("offline-intro") + 0.16,
  at("offline-badge") + 1.21,
  "Offline. Still writing.",
  0,
);
shot(
  "09-offline-writing",
  "guest",
  at("offline-badge") + 1.05,
  at("online-writing"),
  "Offline. Still writing.",
  110,
);
shot(
  "10-ana-online",
  "ana",
  at("online-writing"),
  at("reconnect-intro"),
  "Ana keeps writing online",
  110,
);
shot(
  "11-live-badge",
  "guest",
  at("reconnect-intro"),
  at("live-badge") + 0.4,
  "Back online. Both edits merge.",
  0,
);
// Multicamera insert: show the actual receiving DOM from just before arrival.
// This overlaps source time with the badge insert; no edits are synthesized.
shot(
  "11-merge",
  "ana",
  mergeAppearance - 0.3,
  mergeAppearance + 1.2,
  "Back online. Both edits merge.",
  110,
  take,
  { glowAt: 0.3 },
);
shot(
  "12-match",
  "both",
  at("merged") + 0.5,
  at("merged") + 3.5,
  "The same story on both screens",
  "match",
);
const median = (latency.edits.medianMs / 1000).toFixed(1);
const endHtml = `<div style="position:absolute;inset:0;background:#182028;display:flex;align-items:center;justify-content:center;text-align:center"><div style="width:1800px"><div style="font-size:78px">Hotpress, real-time collaboration</div><div style="font-size:58px;line-height:1.55;margin-top:65px;color:#c6d0da">Edits reach the other writer in about ${median} s<br><span style="font-size:48px">(median of 30, measured in this run)</span></div><div style="font-size:60px;margin-top:24px;color:#c6d0da">Tested end to end against Liveblocks</div><div style="font-size:49px;margin-top:65px;color:#c6d0da">hotpress.app · source: github.com/gorkamolero/inkwell</div></div></div>`;
const end = await asset("end", endHtml);
let timeline = 0;
const frames = [];
const encode = [
  "-an",
  "-c:v",
  "libx264",
  "-preset",
  "fast",
  "-threads",
  "4",
  "-crf",
  "16",
  "-pix_fmt",
  "yuv420p",
  "-r",
  "30",
];
for (let i = 0; i < shots.length; i++) {
  const q = shots[i],
    dur = Math.round((q.e - q.s) * 30) / 30 + (q.name === "02-link" ? 0.3 : 0);
  q.duration = dur;
  q.timeline = timeline;
  const caption = await asset(
    `caption-${i}`,
    `<div class="pill caption">${q.caption}</div>`,
  );
  const tag = await asset(
    `tag-${i}`,
    q.who === "both"
      ? '<div class="pill tag" style="top:22px;bottom:auto">Ana’s screen</div><div class="pill tag" style="top:510px;bottom:auto">Guest’s screen</div>'
      : `<div class="pill tag">${q.who === "ana" ? "Ana" : "Guest"}’s screen</div>`,
  );
  const file = `${q.source}/raw-${q.who === "both" ? "ana" : q.who}.webm`;
  const args = [
    "-ss",
    String(starts[file] + q.s),
    "-i",
    file,
    "-loop",
    "1",
    "-i",
    caption,
    "-loop",
    "1",
    "-i",
    tag,
  ];
  let filter = "";
  if (q.crop === "opening")
    filter = `[0:v]crop=872:480:0:0,scale=1600:880,pad=1920:1080:160:40:color=0x182028,setsar=1[b];`;
  else if (q.crop === "match") {
    const bf = `${q.source}/raw-guest.webm`;
    args.push("-ss", String(starts[bf] + q.s), "-i", bf);
    filter =
      "[0:v]crop=850:190:11:270,scale=1870:418[a];[3:v]crop=850:190:11:270,scale=1870:418[g];color=c=white:s=1920x1080:r=30[bg];[bg][a]overlay=25:92[x];[x][g]overlay=25:580,setsar=1[b];";
  } else if (q.crop === "url") {
    const url = await asset(
      "url",
      `<div style="position:absolute;top:0;width:100%;height:84px;background:#29333d;text-align:center;padding:16px;font-size:42px">hotpress.app${scenario.sharePath}</div>`,
    );
    args.push("-loop", "1", "-i", url);
    filter =
      "[0:v]crop=864:448:4:0,scale=1920:996,pad=1920:1080:0:84:white[x];[x][3:v]overlay=0:0[b];";
  } else if (q.crop === 0)
    filter = `[0:v]crop=864:486:4:4,scale=1824:1026,pad=1920:1080:48:0:white,setsar=1[b];`;
  else if (q.crop === 120)
    filter = `[0:v]crop=864:800:4:0,pad=896:800:0:0:white,crop=864:486:16:120,scale=1920:1080,setsar=1[b];`;
  else filter = `[0:v]crop=864:486:4:${q.crop},scale=1920:1080,setsar=1[b];`;
  // Give the link caption 300ms before the captured page load begins.
  if (q.name === "02-link")
    filter += "[b]tpad=start_mode=clone:start_duration=0.3[held];";
  // All captions settle in 250ms; actions begin after their lead-in.
  filter += `[1:v]format=rgba${shots[i - 1]?.caption === q.caption ? "" : ",fade=t=in:st=0:d=0.25:alpha=1"}${shots[i + 1]?.caption === q.caption ? "" : `,fade=t=out:st=${dur - 0.25}:d=0.25:alpha=1`}[c];[${q.name === "02-link" ? "held" : "b"}][c]overlay=0:0[xc];[xc][2:v]overlay=0:0`;
  if (q.glowAt !== undefined)
    filter += `,drawbox=x=50:y=640:w=950:h=98:color=0x65bca4@0.85:t=5:enable='between(t,${q.glowAt},${q.glowAt + 1})'`;
  filter += "[v]";
  run([
    ...args,
    "-filter_complex_threads",
    "1",
    "-filter_complex",
    filter,
    "-map",
    "[v]",
    "-t",
    String(dur),
    ...encode,
    `${assets}/shot-${i}.mp4`,
  ]);
  frames.push([
    q.name,
    timeline + Math.min(dur - 0.1, Math.max(0.5, dur * 0.65)),
  ]);
  timeline += dur;
}
run(["-loop", "1", "-i", end, "-t", "4", ...encode, `${assets}/end.mp4`]);
const total = timeline + 4;
if (total < 45 || total > 50)
  throw Error(`Duration ${total} outside 45–50 seconds`);
writeFileSync(
  `${assets}/concat.txt`,
  shots
    .map((_, i) => `file '${assets}/shot-${i}.mp4'`)
    .concat(`file '${assets}/end.mp4'`)
    .join("\n"),
);
run([
  "-f",
  "concat",
  "-safe",
  "0",
  "-i",
  `${assets}/concat.txt`,
  "-c",
  "copy",
  "-movflags",
  "+faststart",
  `${out}/hotpress-collaboration-v6.mp4`,
]);
run([
  "-i",
  `${out}/hotpress-collaboration-v6.mp4`,
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
  `${out}/hotpress-collaboration-v6-web.mp4`,
]);
const commentShot = shots.find((q) => q.name === "05-comment");
frames.push(
  [
    "05-selection",
    commentShot.timeline + at("selection-visible") - at("comments") + 0.1,
  ],
  ["06-comment", commentShot.timeline + at("composer-ready") - at("comments")],
  [
    "09-offline-complete",
    shots.find((q) => q.name === "09-offline-writing").timeline +
      at("offline-visible") -
      (at("offline-badge") + 1.05) +
      0.1,
  ],
);
frames.sort((a, b) => a[1] - b[1]);
frames.push(["13-end", timeline + 2]);
for (const [name, t] of frames)
  run([
    "-ss",
    String(t),
    "-i",
    `${out}/hotpress-collaboration-v6.mp4`,
    "-frames:v",
    "1",
    `${out}/v6-frames/${name}.png`,
  ]);
run([
  "-ss",
  String(shots.find((s) => s.name === "08-ana-reply").timeline + 2),
  "-i",
  `${out}/hotpress-collaboration-v6.mp4`,
  "-frames:v",
  "1",
  "-q:v",
  "2",
  `${out}/hotpress-collaboration-v6-poster.jpg`,
]);
for (const [dir, vf] of [
  ["v6-every2s", "fps=1/2"],
  ["v6-phone", "fps=1/2,scale=390:-1"],
])
  run([
    "-i",
    `${out}/hotpress-collaboration-v6.mp4`,
    "-vf",
    vf,
    `${out}/${dir}/%03d.png`,
  ]);
await page.setViewportSize({ width: 1600, height: 1000 });
await page.setContent(
  base +
    `<div style="background:#182028;padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:12px">${frames.map(([name]) => `<div><div style="font-size:22px">${name}</div><img style="width:100%" src="data:image/png;base64,${readFileSync(`${out}/v6-frames/${name}.png`).toString("base64")}"></div>`).join("")}</div>`,
);
await page
  .locator("img")
  .evaluateAll((imgs) => Promise.all(imgs.map((i) => i.decode())));
await page.screenshot({ path: `${out}/v6-contact-sheet.png`, fullPage: true });
const phones = readdirSync(`${out}/v6-phone`).sort();
await page.setViewportSize({ width: 810, height: 760 });
for (let i = 0; i < phones.length; i += 6) {
  await page.setContent(
    base +
      `<div style="background:#182028;padding:10px;display:grid;grid-template-columns:390px 390px;gap:10px">${phones
        .slice(i, i + 6)
        .map(
          (file, j) =>
            `<div><div style="font-size:16px">${(i + j) * 2 + 1} s</div><img style="width:390px;display:block" src="data:image/png;base64,${readFileSync(`${out}/v6-phone/${file}`).toString("base64")}"></div>`,
        )
        .join("")}</div>`,
  );
  await page
    .locator("img")
    .evaluateAll((imgs) => Promise.all(imgs.map((i) => i.decode())));
  await page.screenshot({
    path: `${out}/v6-phone-review-${i / 6 + 1}.png`,
    fullPage: true,
  });
}
await browser.close();
writeFileSync(
  `${out}/v6-metadata.json`,
  JSON.stringify(
    {
      duration: total,
      starts,
      mergeAppearance,
      shots,
      frames,
      medianMs: latency.edits.medianMs,
      latencySource: `${out}/suite/latency.json`,
      master: probe(`${out}/hotpress-collaboration-v6.mp4`),
      web: probe(`${out}/hotpress-collaboration-v6-web.mp4`),
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({ duration: total, medianMs: latency.edits.medianMs }),
);
