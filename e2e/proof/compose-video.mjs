import { execFileSync } from "node:child_process";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  openSync,
  closeSync,
} from "node:fs";
const output =
  process.env.HOTPRESS_PROOF_OUTPUT ||
  "/private/tmp/claude-501/-Users-gorkolas-Developer-job-hunt-command-center/130c3c3e-ffb7-43bf-a354-cb1c2408aaed/scratchpad/hotpress-proof";
const local = `${output}/ffmpeg-9.0.2/ffmpeg`;
const ffmpeg =
  process.env.HOTPRESS_PROOF_FFMPEG || (existsSync(local) ? local : "ffmpeg");
const scenario = JSON.parse(
  readFileSync(`${output}/video-scenario-v2.json`, "utf8"),
);
const failed = [
  scenario.errors?.length && "scenario checks",
  !scenario.differentParagraphsVerified && "parallel paragraphs",
  !scenario.sameSentenceVerified && "same sentence",
  !scenario.commentsVerified && "comments",
  !scenario.offlineVerified && "reconnect",
]
  .filter(Boolean)
  .join(" and ");
const caveat = failed
  ? `,drawtext=text='PARTIAL PROOF - ${failed} failed; see report':fontcolor=white:fontsize=24:box=1:boxcolor=black@0.85:x=(w-tw)/2:y=h-36`
  : "";
const filters =
  "[0:v]crop=1280:440:0:0,pad=1280:480:0:40:color=black,drawtext=text='Writer A':fontcolor=white:fontsize=26:x=20:y=7[a];[1:v]crop=1280:440:0:0,pad=1280:480:0:40:color=black,drawtext=text='Writer B':fontcolor=white:fontsize=26:x=20:y=7[b];[a][b]hstack=inputs=2:shortest=1" +
  caveat +
  "[v]";
const log = openSync(`${output}/ffmpeg-compose.log`, "w");
try {
  execFileSync(
    ffmpeg,
    [
      "-y",
      "-i",
      `${output}/writer-a-v2.webm`,
      "-i",
      `${output}/writer-b-v2.webm`,
      "-filter_complex",
      filters,
      "-map",
      "[v]",
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "20",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      `${output}/collaboration-split-screen-v2.mp4`,
    ],
    { stdio: ["ignore", "ignore", log] },
  );
} finally {
  closeSync(log);
}
const metadata = JSON.parse(
  execFileSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration:stream=codec_name,pix_fmt,width,height",
      "-of",
      "json",
      `${output}/collaboration-split-screen-v2.mp4`,
    ],
    { encoding: "utf8" },
  ),
);
writeFileSync(
  `${output}/video-duration-v2.json`,
  JSON.stringify(
    { durationSeconds: Number(metadata.format.duration), ...metadata },
    null,
    2,
  ),
);
console.log(`Video duration: ${metadata.format.duration}s`);
