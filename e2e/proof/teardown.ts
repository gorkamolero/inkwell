import { appendFileSync } from "node:fs";
import { deleteTestRoom } from "../fixtures/liveblocks-helpers";
import { output, roomIds } from "./rooms";
export default async function teardown() {
  for (const id of roomIds()) {
    await deleteTestRoom(id);
    appendFileSync(
      `${output}/cleanup.jsonl`,
      JSON.stringify({ id, deletedAt: new Date().toISOString() }) + "\n",
    );
  }
}
