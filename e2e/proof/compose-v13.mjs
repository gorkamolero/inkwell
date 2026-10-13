import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { chromium } from "@playwright/test";
const out = process.env.HOTPRESS_PROOF_OUTPUT;
if (!out) throw Error("Explicit output required");
const accepted = out;
// New v13 capture only; never mix takes.
const take = `${out}/${process.env.HOTPRESS_TAKE || "take-7"}`,
  fresh = take;
const scenario = JSON.parse(readFileSync(`${take}/portfolio-scenario.json`));
const latency = JSON.parse(readFileSync(`${out}/suite/latency.json`));
if (
  !scenario.passed ||
  !scenario.continuousTake ||
  /Editor|Writer|Scribe/.test(scenario.guestName) ||
  latency.edits.rawMs.length !== 30
)
  throw Error("Invalid continuous take or measurement");
const at = (n) => scenario.events.find((e) => e.name === n).seconds;
const freshAt = at;
const assets = `${out}/v13-composition-assets`;
for (const d of [
  assets,
  `${out}/v13-frames`,
  `${out}/v13-every2s`,
  `${out}/v13-phone`,
  `${out}/v13-transitions`,
  `${out}/v13-transitions-phone`,
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
const starts = {};
for (const source of [take])
  for (const who of ["ana", "guest"]) {
    const path = `${source}/raw-${who}.webm`;
    starts[path] = Date.parse(scenario.takeStartedAt)/1000-JSON.parse(readFileSync(`${source}/cdp-${who}/frames.json`))[0].timestamp;
  }
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.route(/^https?:/, (route) => route.abort());
const font = readFileSync(
  "node_modules/@fontsource/inter/files/inter-latin-500-normal.woff2",
).toString("base64");
const base = `<style>@font-face{font-family:Inter;src:url(data:font/woff2;base64,${font})}*{box-sizing:border-box}body{margin:0;font:500 44px Inter;color:white}.pill{position:absolute;bottom:20px;border-radius:44px;background:#0c131ded;padding:17px 27px;white-space:nowrap}.tag{right:32px;font-size:32px}.caption{left:32px}</style>`;
const visibleStrings = [];
async function asset(name, html) {
  await page.setContent(base + html);
  const visibleText = await page.locator("body").innerText();
  if (/[\x27]/.test(visibleText)) throw Error(`Straight apostrophe in ${name}`);
  if (visibleText.includes("${"))
    throw Error(`Uninterpolated visible text in ${name}`);
  visibleStrings.push({ asset: name, text: visibleText });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `${assets}/${name}.png`,
    omitBackground: true,
  });
  return `${assets}/${name}.png`;
}
// Use the captured DOM observations to locate the arrival; verify against pixels separately.
const observations=JSON.parse(readFileSync(`${take}/both-merge-observations.json`));
const began=Date.parse(scenario.takeStartedAt);
const mergeAppearance=(observations[0].find(x=>x.text.includes("The town woke slowly.")).at-began)/1000;
const guestAppearance=(observations[1].find(x=>x.text.includes("The tide turned.")).at-began)/1000;
const reconnectPixels=execFileSync("ffmpeg",["-v","error","-ss",String(starts[`${take}/raw-guest.webm`]+at("reconnect")),"-i",`${take}/raw-guest.webm`,"-t","2","-vf","fps=30,crop=350:120:1100:0,format=rgb24","-f","rawvideo","-"],{maxBuffer:12e6});
let liveFrame=-1;
for(let i=0;i<reconnectPixels.length/(350*120*3);i++){
  const pixels=reconnectPixels.subarray(i*350*120*3,(i+1)*350*120*3);let green=0;
  for(let j=0;j<pixels.length;j+=3) if(pixels[j]<100&&pixels[j+1]>175&&pixels[j+2]<190) green++;
  if(green>100){liveFrame=i;break;}
}
if(liveFrame<0)throw Error("No captured guest LIVE badge");
const guestLivePixel=at("reconnect")+liveFrame/30;
if(guestLivePixel>=mergeAppearance)throw Error("No real LIVE-to-arrival interval available");
const shots=[];
function shot(name,who,s,e,caption,crop="full") {shots.push({name,who,s,e,caption,crop,source:take,holdEnd:0});}
shot("01-alone","ana",at("alone"),at("join"),"One story. Two writers.");
shot("02-link","guest",at("joined")+.15,at("guest-pointer"),`${scenario.guestName} joins through the share link`);
shot("02-arrival","ana",at("guest-pointer"),at("parallel-ana"),`${scenario.guestName} joins through the share link`);
shot("03-ana-writing","ana",at("parallel-ana"),at("parallel-guest"),"Two writers, one document","document");
shot("03-guest-writing","guest",at("parallel-guest"),at("parallel-visible")+.2,"Two writers, one document","document");
shot("04-sentence","ana",at("sentence")+8/30,at("sentence-end"),"Same sentence, two places","sentence");
shot("05-comment","ana",at("comments"),at("comment-posted")+.8,"Select a phrase. Start a thread.","comment");
shot("07-guest-reply","guest",at("reply"),at("reply-send")+.15,"Hover, open, reply","comment");
shot("08-ana-reply","ana",at("count-two")+.2,at("reply-visible")+1.5,"The reply reaches Ana","comment");
shot("09-offline-start","guest",at("offline-badge")+.08,at("offline-partial"),"Offline. Still writing.");
shot("10-ana-meanwhile","ana",at("online-writing"),at("online-visible")+.4,"Meanwhile, Ana keeps writing","document");
shot("09-offline-writing","guest",at("offline-finishing"),at("offline-visible")+.45,"Offline. Still writing.");
// Ana is continuously LIVE: include the actual reconnect and arrival in one real shot.
shot("11-merge","ana",guestLivePixel,guestLivePixel+3,"Back online. Both edits merge.");
shot("12-match","both",guestLivePixel+3,guestLivePixel+6.6,"The same story on both screens","match");
const median = (latency.edits.medianMs / 1000).toFixed(1);
const endHtml = `<div style="position:absolute;inset:0;background:#182028;display:flex;align-items:center;justify-content:center;text-align:center"><div style="width:1800px"><div style="font-size:78px">Hotpress, real-time collaboration</div><div style="font-size:58px;line-height:1.55;margin-top:65px;color:#c6d0da">Edits reach the other writer in about ${median} s<br><span style="font-size:48px">median of 30 edits</span></div><div style="font-size:60px;margin-top:24px;color:#c6d0da">Tested end to end against Liveblocks</div></div></div>`;
const end = await asset("end", endHtml);
// Only the two uninterrupted recordings from this take are permitted.
for (const [i, q] of shots.entries()) {
  if (q.source !== take || q.e <= q.s || (i && q.s < shots[i - 1].e - 0.001))
    throw Error(`Nonchronological source range: ${q.name}`);
}
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
      (q.holdStart ?? 0) +
      (q.holdEnd ?? 0);
  q.duration = dur;
  q.timeline = timeline;
  const caption = await asset(
    `caption-${i}`,
    `<div class="pill caption">${q.caption}</div>`,
  );
  const tag = await asset(
    `tag-${i}`,
    q.who === "both"
      ? `<div class="pill" style="left:40px;top:780px;bottom:auto;font-size:38px">Ana’s screen</div><div class="pill" style="left:980px;top:780px;bottom:auto;font-size:38px">${scenario.guestName}’s screen</div>`
      : `<div class="pill tag">${q.who === "ana" ? "Ana’s screen" : `${scenario.guestName}’s screen`}</div>`,
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
  q.sourceSize=[1744,1600];
  if(q.crop==="match") {
    const bf=`${take}/raw-guest.webm`;
    args.push("-ss",String(starts[bf]+q.s),"-i",bf);
    q.cropRect=[8,8,1728,950];q.renderSize=[900,494];q.bodyTextPx=60*900/1728;
    filter="[0:v]setpts=PTS-STARTPTS,crop=1728:950:8:8,scale=900:494,setsar=1[a];[3:v]setpts=PTS-STARTPTS,crop=1728:950:8:8,scale=900:494,setsar=1[g];color=c=0x182028:s=1920x1080:r=30[bg];[bg][a]overlay=40:230[x];[x][g]overlay=980:230[b];";
  } else {
    const crops={full:[8,8,1728,900,1824,950,48,16],document:[8,240,1728,850,1824,898,48,50],sentence:[8,280,1728,750,1920,834,0,80],comment:[8,240,1728,1100,1500,954,210,16]};
    const [x,y,w,h,rw,rh,px,py]=crops[q.crop];
    q.cropRect=[x,y,w,h];q.renderSize=[rw,rh];q.bodyTextPx=60*rw/w;
    filter=`[0:v]crop=${w}:${h}:${x}:${y},scale=${rw}:${rh},pad=1920:1080:${px}:${py}:color=0x182028,setsar=1[b];`;
  }
  q.upscale=Math.max(q.renderSize[0]/q.cropRect[2],q.renderSize[1]/q.cropRect[3]);
  if(q.upscale>1.25) throw Error("Excessive source upscale");
  let baseLabel="b";
  if(q.name==="11-merge") {
    q.attributions=[{start:.6,text:"Ana, written meanwhile"},{start:1.35,text:`${scenario.guestName}, written offline`}];
    for(const [j,mark] of q.attributions.entries()){
      const file=await asset(`merge-attribution-${j}`,`<div class="pill" style="top:238px;bottom:auto;${j===0?"right:64px":"left:64px"};font-size:32px;padding:10px 18px">${mark.text}</div>`);
      args.push("-loop","1","-i",file);
      filter+=`[${3+j}:v]format=rgba,fade=t=in:st=${mark.start}:d=0.2:alpha=1[attrib${j}];[${baseLabel}][attrib${j}]overlay=0:0[marked${j}];`;
      baseLabel=`marked${j}`;
    }
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
if (total < 45 || total > 65)
  throw Error(`Duration ${total} outside 45–65 seconds`);
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
  `${out}/hotpress-collaboration-v13.mp4`,
]);
run([
  "-i",
  `${out}/hotpress-collaboration-v13.mp4`,
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
  `${out}/hotpress-collaboration-v13-web.mp4`,
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
    `${out}/hotpress-collaboration-v13.mp4`,
    "-frames:v",
    "1",
    `${out}/v13-frames/${name}.png`,
  ]);
run([
  "-ss",
  String(shots.find((s) => s.name === "08-ana-reply").timeline + 2),
  "-i",
  `${out}/hotpress-collaboration-v13.mp4`,
  "-frames:v",
  "1",
  "-q:v",
  "2",
  `${out}/hotpress-collaboration-v13-poster.jpg`,
]);
for (const [dir, vf] of [
  ["v13-every2s", "fps=1/2"],
  ["v13-phone", "fps=1/2,scale=390:-1"],
])
  run([
    "-i",
    `${out}/hotpress-collaboration-v13.mp4`,
    "-vf",
    vf,
    `${out}/${dir}/%03d.png`,
  ]);
const transitions = [];
for (const q of [...shots,{name:"13-end",timeline,duration:4}]) {
  const name=q.name;
  const offsets=[-.75,-.5,-.25,-1/30,0,.25,.5,.75];
  for (const [i, offset] of offsets.entries()) {
    const t = Math.max(0, q.timeline + offset);
    transitions.push({ name, offset, t });
    for (const phone of [false, true])
      run([
        "-ss",
        String(t),
        "-i",
        `${out}/hotpress-collaboration-v13.mp4`,
        ...(phone ? ["-vf", "scale=390:-1"] : []),
        "-frames:v",
        "1",
        `${out}/v13-transitions${phone ? "-phone" : ""}/${name}-${i}.png`,
      ]);
  }
}
await page.setViewportSize({ width: 1600, height: 1000 });
await page.setContent(
  base +
    `<div style="background:#182028;padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:12px">${frames.map(([name]) => `<div><div style="font-size:22px">${name}</div><img style="width:100%" src="data:image/png;base64,${readFileSync(`${out}/v13-frames/${name}.png`).toString("base64")}"></div>`).join("")}</div>`,
);
await page
  .locator("img")
  .evaluateAll((imgs) => Promise.all(imgs.map((i) => i.decode())));
await page.screenshot({ path: `${out}/v13-contact-sheet.png`, fullPage: true });
const phones = readdirSync(`${out}/v13-phone`).sort();
await page.setViewportSize({ width: 810, height: 760 });
for (let i = 0; i < phones.length; i += 6) {
  await page.setContent(
    base +
      `<div style="background:#182028;padding:10px;display:grid;grid-template-columns:390px 390px;gap:10px">${phones
        .slice(i, i + 6)
        .map(
          (file, j) =>
            `<div><div style="font-size:16px">${(i + j) * 2 + 1} s</div><img style="width:390px;display:block" src="data:image/png;base64,${readFileSync(`${out}/v13-phone/${file}`).toString("base64")}"></div>`,
        )
        .join("")}</div>`,
  );
  await page
    .locator("img")
    .evaluateAll((imgs) => Promise.all(imgs.map((i) => i.decode())));
  await page.screenshot({
    path: `${out}/v13-phone-review-${i / 6 + 1}.png`,
    fullPage: true,
  });
}
// Phone-size transition sheets retain the same 390 px review scale.
await page.setViewportSize({ width: 810, height: 1000 });
for (const {name} of [...shots,{name:"13-end"}]) {
  const files = readdirSync(`${out}/v13-transitions-phone`)
    .filter((f) => f.startsWith(`${name}-`))
    .sort();
  await page.setContent(
    `<body style="margin:0;padding:10px;background:#182028;color:white;display:grid;grid-template-columns:390px 390px;gap:10px;font:14px sans-serif">${files.map((file) => `<div>${file}<img style="display:block;width:390px" src="data:image/png;base64,${readFileSync(`${out}/v13-transitions-phone/${file}`).toString("base64")}"></div>`).join("")}</body>`,
  );
  await page
    .locator("img")
    .evaluateAll((imgs) => Promise.all(imgs.map((i) => i.decode())));
  await page.screenshot({
    path: `${out}/v13-phone-transition-${name}.png`,
    fullPage: true,
  });
}
await browser.close();
writeFileSync(
  `${out}/v13-metadata.json`,
  JSON.stringify(
    {
      duration: total,
      source: take,
      takeStartedAt: scenario.takeStartedAt,
      takeEndedAt: scenario.takeEndedAt,
      continuousTake: true,
      visibleStrings,
      transitions,
      starts,
      mergeAppearance,
      guestAppearance,
      guestLivePixel,
      reconnectDelayMs:{ana:(mergeAppearance-at("reconnect"))*1000,guest:(guestAppearance-at("reconnect"))*1000},
      shots,
      frames,
      medianMs: latency.edits.medianMs,
      latencySource: `${accepted}/suite/latency.json`,
      master: probe(`${out}/hotpress-collaboration-v13.mp4`),
      web: probe(`${out}/hotpress-collaboration-v13-web.mp4`),
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({ duration: total, medianMs: latency.edits.medianMs }),
);
