import postgres from "postgres";

/** Remove only the local session fixtures named in this invocation's manifest. */
export async function deleteLocalSessions(ids: string[]) {
  const url = new URL(process.env.DATABASE_URL!);
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.pathname !== "/inkwell") {
    throw new Error("Proof cleanup requires local inkwell database");
  }
  const sql = postgres(process.env.DATABASE_URL!, { onnotice: () => {} });
  try {
    if (ids.length) await sql`delete from writing_sessions where id = any(${ids})`;
  } finally {
    await sql.end();
  }
}
