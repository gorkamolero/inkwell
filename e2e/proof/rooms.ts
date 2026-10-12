import { appendFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
export const output =
  process.env.HOTPRESS_PROOF_OUTPUT ||
  "/private/tmp/claude-501/-Users-gorkolas-Developer-job-hunt-command-center/130c3c3e-ffb7-43bf-a354-cb1c2408aaed/scratchpad/hotpress-proof";
export function trackRoom(id: string) {
  mkdirSync(output, { recursive: true });
  appendFileSync(
    resolve(
      output,
      `rooms-${process.env.HOTPRESS_PROOF_RUN_ID || "legacy"}.jsonl`,
    ),
    JSON.stringify({ id, createdAt: new Date().toISOString() }) + "\n",
  );
}
export function roomIds() {
  const file = resolve(
    output,
    `rooms-${process.env.HOTPRESS_PROOF_RUN_ID || "legacy"}.jsonl`,
  );
  return existsSync(file)
    ? [
        ...new Set(
          readFileSync(file, "utf8")
            .trim()
            .split("\n")
            .filter(Boolean)
            .map((line) => JSON.parse(line).id as string),
        ),
      ]
    : [];
}
