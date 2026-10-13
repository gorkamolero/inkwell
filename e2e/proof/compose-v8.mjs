import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { chromium } from "@playwright/test";
const out = process.env.HOTPRESS_PROOF_OUTPUT;
if (!out) throw Error("Explicit output required");
const accepted = process.env.HOTPRESS_V7_SOURCE;
if (!accepted) throw Error("Explicit accepted v7 source required");
const take = `${out}/take-1`,
  fresh = take;
const scenario = JSON.parse(readFileSync(`${take}/portfolio-scenario.json`));
const latency = JSON.parse(readFileSync(`${out}/suite/latency.json`));
if (!scenario.passed || /Editor|Writer|Scribe/.test(scenario.guestName))
  throw Error("Invalid corrective take");
const at = (n) => scenario.events.find((e) => e.name === n).seconds;
const freshAt = at;
const assets = `${out}/v8-composition-assets`;
for (const d of [
  assets,
  `${out}/v8-frames`,
  `${out}/v8-every2s`,
  `${out}/v8-phone`,
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
const acceptedMeta = JSON.parse(readFileSync(`${accepted}/v7-metadata.json`));
const opening = acceptedMeta.shots[0];
const starts = { ...acceptedMeta.starts };
for (const source of [take])
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
shot(
  "01-alone",
  "ana",
  opening.s,
  opening.e,
  "One story. Two writers.",
  110,
  opening.source,
);
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
  at("parallel-ana"),
  at("parallel-ana") + 2.3,
  "Two writers, one document",
);
shot(
  "03-guest-writing",
  "guest",
  at("parallel-ana") + 2.3,
  at("parallel-visible") + 0.35,
  "Two writers, one document",
);
shot(
  "04-sentence",
  "ana",
  freshAt("sentence"),
  freshAt("sentence-visible") + 0.08,
  "Same sentence, two places",
  110,
  fresh,
);
shot(
  "05-comment",
  "ana",
  freshAt("comments"),
  freshAt("comment-posted") + 0.12,
  "Select a phrase. Start a thread.",
  120,
  fresh,
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
  "09-offline-start",
  "guest",
  at("offline-badge") - 0.15,
  at("offline-partial"),
  "Offline. Still writing.",
  "offline",
);
shot(
  "10-ana-meanwhile",
  "ana",
  at("online-writing"),
  at("online-visible") + 0.4,
  "Meanwhile, Ana keeps writing",
  110,
);
shot(
  "09-offline-writing",
  "guest",
  at("offline-finishing"),
  at("offline-visible") + 0.65,
  "Offline. Still writing.",
  "offline",
);
shot(
  "10-reconnected",
  "guest",
  at("live-badge") - 0.15,
  at("live-badge") + 0.5,
  "Back online. Both edits merge.",
  "offline",
);
shot(
  "11-merge",
  "ana",
  mergeAppearance - 0.3,
  mergeAppearance + 3.7,
  "Back online. Both edits merge.",
  110,
  take,
  { glowAt: 0.4 },
);
shot(
  "12-match",
  "both",
  at("merged") + 4.2,
  at("merged") + 7.7,
  "The same story on both screens",
  "match",
);
const median = (latency.edits.medianMs / 1000).toFixed(1);
const endHtml = `<div style="position:absolute;inset:0;background:#182028;display:flex;align-items:center;justify-content:center;text-align:center"><div style="width:1800px"><div style="font-size:78px">Hotpress, real-time collaboration</div><div style="font-size:58px;line-height:1.55;margin-top:65px;color:#c6d0da">Edits reach the other writer in about ${median} s<br><span style="font-size:48px">(median of 30, measured in this run)</span></div><div style="font-size:60px;margin-top:24px;color:#c6d0da">Tested end to end against Liveblocks</div><div style="font-size:44px;margin-top:65px;color:#c6d0da">hotpress.app</div></div></div>`;
const end = await asset("end", endHtml);
let timeline = 0;
let guestTagSeen = false;
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
  "14",
  "-pix_fmt",
  "yuv420p",
  "-r",
  "30",
];
for (let i = 0; i < shots.length; i++) {
  const q = shots[i],
    dur =
      Math.round((q.e - q.s) * 30) / 30 +
      (q.name === "02-link" ? 0.3 : q.name === "04-sentence" ? 11 / 30 : 0);
  q.duration = dur;
  q.timeline = timeline;
  const caption = await asset(
    `caption-${i}`,
    `<div class="pill caption">${q.caption}</div>`,
  );
  const tag = await asset(
    `tag-${i}`,
    q.who === "both"
      ? '<div class="pill tag" style="top:12px;bottom:auto;font-size:42px;padding:10px 20px">Ana’s screen</div><div class="pill tag" style="top:518px;bottom:auto;font-size:42px;padding:10px 20px">Guest’s screen</div>'
      : `<div class="pill tag">${q.who === "ana" ? "Ana’s screen" : guestTagSeen ? "Guest’s screen" : "Guest’s screen (${scenario.guestName})"}</div>`,
  );
  if (q.who === "guest") guestTagSeen = true;
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
    const rows = (input, prefix) =>
      `[${input}:v]split=3[${prefix}0][${prefix}1][${prefix}2];[${prefix}0]crop=864:116:4:132,scale=1920:258[${prefix}h];[${prefix}1]crop=864:40:4:270,scale=1920:89[${prefix}m];[${prefix}2]crop=864:40:4:405,scale=1920:89[${prefix}e];[${prefix}h][${prefix}m][${prefix}e]vstack=inputs=3[${prefix}];`;
    filter =
      rows(0, "a") +
      rows(3, "g") +
      "color=c=white:s=1920x1080:r=30[bg];[bg][a]overlay=0:56[x];[x][g]overlay=0:518,drawbox=x=32:y=502:w=1856:h=4:c=0x9ca8b4:t=fill,setsar=1[b];";
  } else if (q.crop === "offline") {
    filter = `[0:v]crop=864:486:4:4,scale=1920:1080,setsar=1[b];`;
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
  if (q.name === "04-sentence")
    filter += `[b]trim=duration=${dur - 11 / 30},setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=0.366667[sentenceHeld];`;
  // Editorial attribution is a translucent tint over real receiving pixels.
  let baseLabel =
    q.name === "02-link"
      ? "held"
      : q.name === "04-sentence"
        ? "sentenceHeld"
        : "b";
  if (q.glowAt !== undefined) {
    const tint = await asset(
      "merge-tint",
      `<div style="position:absolute;left:52px;top:648px;width:740px;height:86px;background:#2563eb30;border-radius:14px"></div><div style="position:absolute;left:1000px;top:350px;width:500px;height:86px;background:#15803d30;border-radius:14px"></div>`,
    );
    const chip = await asset(
      "merge-chip",
      `<div style="position:absolute;left:52px;top:754px;font-size:48px;background:#e7efff;color:#2563eb;border-radius:22px;padding:6px 20px">Guest, written offline</div><div style="position:absolute;left:1000px;top:440px;font-size:48px;background:#e5f2e9;color:#15803d;border-radius:22px;padding:6px 20px">Ana, written meanwhile</div>`,
    );
    args.push("-loop", "1", "-i", tint, "-loop", "1", "-i", chip);
    filter += `[3:v]format=rgba,fade=t=in:st=${q.glowAt}:d=0.3:alpha=1,fade=t=out:st=${dur - 0.35}:d=0.35:alpha=1[tint];[${baseLabel}][tint]overlay=enable='gte(t,${q.glowAt})'[tinted];[4:v]format=rgba,fade=t=in:st=${q.glowAt}:d=0.3:alpha=1,fade=t=out:st=${dur - 0.35}:d=0.35:alpha=1[chips];[tinted][chips]overlay[marked];`;
    baseLabel = "marked";
  }
  filter += `[1:v]format=rgba${shots[i - 1]?.caption === q.caption ? "" : ",fade=t=in:st=0:d=0.25:alpha=1"}${shots[i + 1]?.caption === q.caption ? "" : `,fade=t=out:st=${dur - 0.25}:d=0.25:alpha=1`}[c];[${baseLabel}][c]overlay=0:0[xc];[xc][2:v]overlay=0:0[v]`;
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
if (total < 35 || total > 60)
  throw Error(`Duration ${total} outside 35–60 seconds`);
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
  "-c:v",
  "libx264",
  "-preset",
  "slow",
  "-profile:v",
  "high",
  "-pix_fmt",
  "yuv420p",
  "-b:v",
  "8M",
  "-minrate",
  "8M",
  "-maxrate",
  "8M",
  "-bufsize",
  "16M",
  "-x264-params",
  "nal-hrd=cbr:filler=1",
  "-movflags",
  "+faststart",
  `${out}/hotpress-collaboration-v8.mp4`,
]);
run([
  "-i",
  `${out}/hotpress-collaboration-v8.mp4`,
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
  `${out}/hotpress-collaboration-v8-web.mp4`,
]);
const commentShot = shots.find((q) => q.name === "05-comment");
frames.push(
  [
    "05-selection",
    commentShot.timeline +
      freshAt("selection-visible") -
      freshAt("comments") +
      0.1,
  ],
  [
    "06-comment",
    commentShot.timeline + freshAt("composer-ready") - freshAt("comments"),
  ],
  [
    "09-offline-complete",
    shots.find((q) => q.name === "09-offline-writing").timeline +
      at("offline-visible") -
      at("offline-finishing") +
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
    `${out}/hotpress-collaboration-v8.mp4`,
    "-frames:v",
    "1",
    `${out}/v8-frames/${name}.png`,
  ]);
run([
  "-ss",
  String(shots.find((s) => s.name === "08-ana-reply").timeline + 2),
  "-i",
  `${out}/hotpress-collaboration-v8.mp4`,
  "-frames:v",
  "1",
  "-q:v",
  "2",
  `${out}/hotpress-collaboration-v8-poster.jpg`,
]);
for (const [dir, vf] of [
  ["v8-every2s", "fps=1/2"],
  ["v8-phone", "fps=1/2,scale=390:-1"],
])
  run([
    "-i",
    `${out}/hotpress-collaboration-v8.mp4`,
    "-vf",
    vf,
    `${out}/${dir}/%03d.png`,
  ]);
await page.setViewportSize({ width: 1600, height: 1000 });
await page.setContent(
  base +
    `<div style="background:#182028;padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:12px">${frames.map(([name]) => `<div><div style="font-size:22px">${name}</div><img style="width:100%" src="data:image/png;base64,${readFileSync(`${out}/v8-frames/${name}.png`).toString("base64")}"></div>`).join("")}</div>`,
);
await page
  .locator("img")
  .evaluateAll((imgs) => Promise.all(imgs.map((i) => i.decode())));
await page.screenshot({ path: `${out}/v8-contact-sheet.png`, fullPage: true });
const phones = readdirSync(`${out}/v8-phone`).sort();
await page.setViewportSize({ width: 810, height: 760 });
for (let i = 0; i < phones.length; i += 6) {
  await page.setContent(
    base +
      `<div style="background:#182028;padding:10px;display:grid;grid-template-columns:390px 390px;gap:10px">${phones
        .slice(i, i + 6)
        .map(
          (file, j) =>
            `<div><div style="font-size:16px">${(i + j) * 2 + 1} s</div><img style="width:390px;display:block" src="data:image/png;base64,${readFileSync(`${out}/v8-phone/${file}`).toString("base64")}"></div>`,
        )
        .join("")}</div>`,
  );
  await page
    .locator("img")
    .evaluateAll((imgs) => Promise.all(imgs.map((i) => i.decode())));
  await page.screenshot({
    path: `${out}/v8-phone-review-${i / 6 + 1}.png`,
    fullPage: true,
  });
}
await browser.close();
writeFileSync(
  `${out}/v8-metadata.json`,
  JSON.stringify(
    {
      duration: total,
      starts,
      mergeAppearance,
      shots,
      frames,
      medianMs: latency.edits.medianMs,
      latencySource: `${out}/suite/latency.json`,
      master: probe(`${out}/hotpress-collaboration-v8.mp4`),
      web: probe(`${out}/hotpress-collaboration-v8-web.mp4`),
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({ duration: total, medianMs: latency.edits.medianMs }),
);
