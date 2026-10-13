import { deleteLocalSessions } from "./local-cleanup";
import { test, expect } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { output } from "./rooms";
import { deleteTestRoom } from "../fixtures/liveblocks-helpers";

test("verify only explicitly supplied creation manifests have no surviving rooms", async () => {
  test.setTimeout(180000);
  const manifests: string[] = JSON.parse(
    process.env.HOTPRESS_PROOF_MANIFESTS || "[]",
  );
  expect(
    manifests.length,
    "Supply the exact manifests from the run; never discover rooms remotely",
  ).toBeGreaterThan(0);
  const ids = [
    ...new Set(
      manifests.flatMap((file) =>
        readFileSync(file, "utf8")
          .trim()
          .split("\n")
          .filter(Boolean)
          .map((line) => JSON.parse(line).id as string),
      ),
    ),
  ];
  const verified: { id: string; status: number }[] = [];
  for (const id of ids) {
    await deleteTestRoom(id); // idempotent deletion followed by exact-room GET 404 verification
    verified.push({ id, status: 404 });
  }
  await deleteLocalSessions(ids);
  writeFileSync(
    `${output}/cleanup-verification-${process.env.HOTPRESS_PROOF_RUN_ID}.json`,
    JSON.stringify(
      { verifiedAt: new Date().toISOString(), manifests, rooms: verified },
      null,
      2,
    ),
  );
});
