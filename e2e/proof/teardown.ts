import { deleteLocalSessions } from "./local-cleanup";
import { appendFileSync } from "node:fs";
import { deleteTestRoom } from "../fixtures/liveblocks-helpers";
import { output, roomIds } from "./rooms";
export default async function teardown() {
  const ids = roomIds();
  for (const id of ids) {
    await deleteTestRoom(id);
    appendFileSync(
      `${output}/cleanup.jsonl`,
      JSON.stringify({ id, deletedAt: new Date().toISOString() }) + "\n",
    );
  }
  await deleteLocalSessions(ids);
}
