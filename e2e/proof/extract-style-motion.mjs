import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
const output = process.env.HOTPRESS_PROOF_OUTPUT;
if (!output) throw new Error("HOTPRESS_PROOF_OUTPUT required");
const marks = JSON.parse(readFileSync(`${output}/motion-marks.json`));
for (const mark of marks) {
  const dir = `${output}/motion-frames/${mark.name}`;
  const { frames, end } = JSON.parse(readFileSync(`${dir}/frames.json`));
  const length = (end - frames[0].time) / 1000;
  const concat =
    frames
      .map(
        (frame, i) =>
          `file '${frame.file}'\nduration ${Math.max(0.001, ((frames[i + 1]?.time ?? end) - frame.time) / 1000)}`,
      )
      .join("\n") + `\nfile '${frames.at(-1).file}'\n`;
  writeFileSync(`${dir}/input.txt`, concat);
  execFileSync("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    `${dir}/input.txt`,
    "-t",
    String(length),
    "-vf",
    "pad=1440:1000:0:0:color=white,fps=30",
    "-c:v",
    "libvpx-vp9",
    "-crf",
    "25",
    "-b:v",
    "0",
    `${output}/${mark.name}.webm`,
  ]);
  execFileSync("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-i",
    `${output}/${mark.name}.webm`,
    "-vf",
    `fps=${9 / length},${mark.name.startsWith("phone-") ? "crop=390:844:0:0" : "scale=720:-1"},tile=3x3`,
    "-frames:v",
    "1",
    `${output}/${mark.name}-strip.png`,
  ]);
  mark.duration = length;
  mark.compositorFrames = frames.length;
}
writeFileSync(
  `${output}/motion-index.json`,
  JSON.stringify(
    {
      width: 1440,
      fps: 30,
      note: "Timestamped Chromium compositor frames encoded at 30 fps. Static intervals repeat the last real frame. Phone is a real 390px viewport padded to the requested 1440px canvas.",
      clips: marks,
    },
    null,
    2,
  ),
);
