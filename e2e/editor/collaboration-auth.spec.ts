import { test, expect } from "../proof/helpers";

test("Authentication — exact-room and roomless access tokens cannot broaden access", async ({
  proof: { a, b, id },
}) => {
  for (const page of [a, b]) {
    const tokenFor = async (room?: string) => {
      const response = await page.request.post("/api/liveblocks-auth", {
        data: room ? { room } : {},
      });
      expect(response.status()).toBe(200);
      const { token } = await response.json();
      return {
        token,
        payload: JSON.parse(
          Buffer.from(token.split(".")[1], "base64url").toString(),
        ),
      };
    };
    const scoped = await tokenFor(id);
    expect(scoped.payload.k).toBe("acc");
    expect(scoped.payload.perms).toEqual({
      [id]: ["room:write", "comments:write"],
    });
    const roomless = await tokenFor();
    expect(roomless.payload.k).toBe("acc");
    expect(typeof scoped.payload.uid).toBe("string");
    expect(roomless.payload.uid).toBe(scoped.payload.uid);
    expect(roomless.payload.perms).toEqual({});
    const forbidden = await page.request.get(
      `https://api.liveblocks.io/v2/c/rooms/${id}/threads`,
      {
        headers: { Authorization: `Bearer ${roomless.token}` },
      },
    );
    expect(forbidden.status()).toBe(403);
    const wildcard = await page.request.post("/api/liveblocks-auth", {
      data: { room: "*" },
    });
    expect(wildcard.status()).toBe(400);
    if (page === b) {
      const cookie = (await page.context().cookies()).find(
        (c) => c.name === "hotpress-guest",
      )!;
      expect(cookie.httpOnly).toBe(true);
      const tampered = await page.request.post("/api/liveblocks-auth", {
        data: { room: id },
        headers: {
          Cookie: `hotpress-guest=${cookie.value.slice(0, -1)}${cookie.value.endsWith("A") ? "B" : "A"}`,
        },
      });
      const { token } = await tampered.json();
      expect(
        JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString())
          .uid,
      ).not.toBe(scoped.payload.uid);
    }
  }
});
