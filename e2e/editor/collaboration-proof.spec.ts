import { Liveblocks } from "@liveblocks/node";
import { writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { output } from "../proof/rooms";
import {
  test,
  expect,
  editor,
  ready,
  state,
  converge,
  append,
  end,
  comment,
} from "../proof/helpers";
test.describe("Join — authenticated owner, anonymous guest, authenticated collaborator", () => {
  test("three isolated people connect to the same shared room", async ({
    proof: { a, b, c, url, id },
  }) => {
    await c.goto(url);
    await ready(c);
    expect(new URL(url).pathname).toMatch(/^\/s\//);
    const session = await (await a.request.get(`/api/sessions/${id}`)).json();
    expect(session.session.ownerId).toMatch(/^proof-/);
    expect(
      (await (await a.request.get("/api/auth/session")).json()).user.id,
    ).toBe(session.session.ownerId);
    expect(
      (await (await b.request.get("/api/auth/session")).json())?.user,
    ).toBeUndefined();
    expect(
      (await (await c.request.get("/api/auth/session")).json()).user.id,
    ).not.toBe(session.session.ownerId);
    for (const p of [a, b, c]) {
      await expect(
        p
          .locator('[title="Writer A"]')
          .or(p.getByTitle("Click to change your name")),
      ).not.toHaveCount(0);
    }
    await append(a, "Three people share this room.");
    for (const p of [b, c])
      await expect(editor(p)).toContainText("Three people share this room.");
  });
});
test.describe("Presence — live avatars and moving selection cursor", () => {
  test("every person sees the others and guest cursor moves", async ({
    proof: { a, b, c, url },
  }) => {
    await c.goto(url);
    await ready(c);
    const guest = (
      await b
        .getByTitle("Click to change your name")
        .locator("span")
        .innerText()
    ).trim();
    for (const [p, names] of [
      [a, [guest, "Writer C"]],
      [b, ["Writer A", "Writer C"]],
      [c, ["Writer A", guest]],
    ] as const) {
      for (const name of names)
        await expect(p.getByTitle(name, { exact: true })).toBeVisible();
    }
    await append(a, "Cursor movement across a shared paragraph.");
    await converge(a, b);
    await end(b);
    const cursor = a
      .locator(".lb-lexical-cursors")
      .getByText(guest, { exact: true });
    await expect(cursor).toBeVisible();
    const before = await cursor.boundingBox();
    await b.keyboard.press("Home");
    await expect
      .poll(async () => (await cursor.boundingBox())?.x)
      .not.toBe(before?.x);
  });
});
test.describe("Converging edits — concurrent typing, bold, clipboard paste", () => {
  test("full serialized Lexical documents converge", async ({
    proof: { a, b },
  }) => {
    await append(a, "A shared paragraph: ");
    await converge(a, b);
    await Promise.all([end(a), end(b)]);
    await Promise.all([a.keyboard.type("ALPHA"), b.keyboard.type("BRAVO")]);
    await converge(a, b);
    const concurrentText = (await editor(a).innerText()).replace(
      "A shared paragraph: ",
      "",
    );
    expect([...concurrentText].sort().join("")).toBe(
      [..."ALPHABRAVO"].sort().join(""),
    );
    await end(a);
    await a.keyboard.press("ControlOrMeta+b");
    await a.keyboard.type(" BOLD ");
    await a.keyboard.press("ControlOrMeta+b");
    await b.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await end(b);
    await b.evaluate(() => navigator.clipboard.writeText(" Pasted by B."));
    await b.keyboard.press("ControlOrMeta+v");
    await expect(editor(a)).toContainText("Pasted by B.");
    await converge(a, b);
    expect(JSON.stringify(await state(a))).toContain("BOLD");
    await expect(editor(b).locator("strong,b")).toContainText("BOLD");
  });
});
test.describe("Rapid typing — full paragraph integrity", () => {
  test("a zero-delay paragraph preserves every character", async ({
    proof: { a, b },
  }) => {
    const text = Array.from(
      { length: 10 },
      (_, i) => `Latency anchor ${i}. `,
    ).join("");
    await append(a, text);
    await converge(a, b);
    await expect(editor(b)).toHaveText(text);
    for (const page of [a, b]) {
      const yjsText = await page.evaluate(() =>
        (window as any)
          .__collaborationSnapshot()
          .flat(Infinity)
          .filter((part: unknown) => typeof part === "string")
          .join(""),
      );
      expect(yjsText).toBe(text);
    }
  });
});
test.describe("Comments — anchor, reply, resolve, reload", () => {
  test("thread survives on both people", async ({ proof: { a, b } }) => {
    await append(a, "An anchored phrase for discussion.");
    await converge(a, b);
    await comment(a, "anchored phrase", "Please review this phrase.");
    await b.getByTitle("Toggle Comments Sidebar").click();
    const threadB = b.locator(".lb-lexical-anchored-threads .lb-thread");
    await expect(
      threadB.getByText("Please review this phrase.", { exact: true }),
    ).toBeVisible();
    const anchored = await state(b);
    const marks: any[] = [];
    const visit = (node: any) => {
      if (node.type === "lb-thread-mark") marks.push(node);
      node.children?.forEach(visit);
    };
    visit(anchored.root);
    expect(
      marks.some(
        (mark) =>
          mark.children.map((child: any) => child.text || "").join("") ===
          "anchored phrase",
      ),
    ).toBe(true);
    await threadB
      .getByText("Please review this phrase.", { exact: true })
      .click();
    await threadB.locator(".lb-composer-editor").fill("Reviewed by the guest.");
    await threadB.getByRole("button", { name: "Reply", exact: true }).click();
    await a.getByTitle("Toggle Comments Sidebar").click();
    await expect(
      a
        .locator(".lb-lexical-anchored-threads")
        .getByText("Reviewed by the guest.", { exact: true }),
    ).toBeVisible();
    await threadB
      .getByRole("button", { name: "Resolve thread", exact: true })
      .click();
    const liveblocks = new Liveblocks({
      secret: process.env.LIVEBLOCKS_SECRET_KEY!,
    });
    const roomId = (
      await (await a.request.get("/api/sessions?current=true")).json()
    ).session.id;
    const persisted = async () =>
      (await liveblocks.getThreads({ roomId })).data.map((t) => ({
        resolved: t.resolved,
        comments: t.comments.map((c) => c.body),
      }));
    await expect.poll(persisted).toEqual([
      expect.objectContaining({
        resolved: true,
        comments: expect.arrayContaining([
          expect.any(Object),
          expect.any(Object),
        ]),
      }),
    ]);
    for (const p of [a, b]) {
      await p.reload();
      await ready(p);
    }
    await converge(a, b);
    expect(JSON.stringify(await state(a))).toContain("lb-thread-mark");
    const threads = await persisted();
    expect(threads).toHaveLength(1);
    expect(threads[0].resolved).toBe(true);
    expect(JSON.stringify(threads)).toContain("Please review this phrase.");
    expect(JSON.stringify(threads)).toContain("Reviewed by the guest.");
  });
});
test.describe("Offline and reconnect — no sentences lost", () => {
  test("offline and online edits merge", async ({ proof: { a, b } }) => {
    await append(a, "Starting together.");
    await converge(a, b);
    await b.context().setOffline(true);
    const offlineStarted = Date.now();
    await append(b, " Guest writes offline.");
    await append(a, " Owner writes online.");
    expect(await b.evaluate(() => navigator.onLine)).toBe(false);
    await expect(editor(a)).not.toContainText("Guest writes offline.");
    await expect(editor(b)).not.toContainText("Owner writes online.");
    await b.waitForTimeout(Math.max(0, 9000 - (Date.now() - offlineStarted)));
    await b.context().setOffline(false);
    for (const p of [a, b])
      for (const text of [
        "Starting together.",
        "Guest writes offline.",
        "Owner writes online.",
      ])
        await expect(editor(p)).toContainText(text, { timeout: 30000 });
    await converge(a, b);
  });
});
test.describe("Late joiner and reload — complete document restored", () => {
  test("new person and all reloads receive the full state", async ({
    proof: { a, b, c, url },
  }) => {
    await append(a, "First sentence.");
    await converge(a, b);
    await append(b, " Second sentence.");
    await converge(b, a);
    await c.goto(url);
    await ready(c);
    await converge(a, c);
    const expected = await state(a);
    for (const p of [a, b, c]) {
      await p.reload();
      await ready(p);
      await expect.poll(() => state(p)).toEqual(expected);
    }
  });
});
test.describe("Saved state — Postgres-backed session matches live state", () => {
  test("session GET contains the whole serialized document", async ({
    proof: { a, b, id },
  }) => {
    await append(a, "Owner persisted sentence.");
    await converge(a, b);
    await append(b, " Guest persisted sentence.");
    await converge(b, a);
    const expected = await state(a);
    await expect
      .poll(async () => {
        const response = await a.request.get(`/api/sessions/${id}`);
        expect(response.ok()).toBeTruthy();
        return JSON.parse((await response.json()).session.content);
      })
      .toEqual(expected);
  });
});

test.describe("PDF preview — local generation includes both writers", () => {
  test("generated PDF text includes both contributions", async ({
    proof: { a, b, id },
  }) => {
    test.setTimeout(120000);
    await append(a, "Owner PDF sentence.");
    await converge(a, b);
    await append(b, " Guest PDF sentence.");
    await converge(b, a);
    await expect
      .poll(
        async () =>
          (await (await a.request.get(`/api/sessions/${id}`)).json()).session
            .content,
      )
      .toContain("Guest PDF sentence.");
    const response = await a.request.post(`/api/sessions/${id}/preview`, {
      data: { quality: "preview" },
      timeout: 60000,
    });
    expect(response.status()).toBe(200);
    const { previewUrl } = await response.json();
    expect(previewUrl).toMatch(/^data:application\/pdf;base64,/);
    const path = `${output}/collaboration-preview.pdf`;
    writeFileSync(path, Buffer.from(previewUrl.split(",")[1], "base64"));
    const text = execFileSync("pdftotext", [path, "-"], { encoding: "utf8" });
    for (const sentence of ["Owner PDF sentence.", "Guest PDF sentence."])
      expect(text.replace(/\s+/g, "")).toContain(sentence.replace(/\s+/g, ""));
  });
});

test("Comment authors — real names reach the other person and survive departure", async ({
  proof: { a, b, c, url },
}) => {
  const guest = (
    await b.getByTitle("Click to change your name").locator("span").innerText()
  ).trim();
  await append(a, "A phrase worth discussing.");
  await converge(a, b);
  await comment(a, "phrase", "An opening thought.");
  await b.getByTitle("Toggle Comments Sidebar").click();
  const threadB = b.locator(".lb-lexical-anchored-threads .lb-thread");
  await expect(threadB.getByText("Writer A", { exact: true })).toBeVisible();
  await threadB.getByText("An opening thought.", { exact: true }).click();
  await threadB.locator(".lb-composer-editor").fill("A guest thought.");
  await threadB.getByRole("button", { name: "Reply", exact: true }).click();
  await a.getByTitle("Toggle Comments Sidebar").click();
  await expect(
    a.locator(".lb-thread").getByText(guest, { exact: true }),
  ).toBeVisible();
  const userId = (await (await a.request.get("/api/auth/session")).json()).user
    .id;
  expect(
    (
      await b.request.post("/api/liveblocks-users", {
        data: { userIds: [userId] },
      })
    ).status(),
  ).toBe(401);
  const profiles = await a.request.post("/api/liveblocks-users", {
    data: { userIds: [userId, "missing"] },
  });
  expect(await profiles.json()).toEqual([{ name: "Writer A" }, null]);
  await a.goto("about:blank");
  await b.goto("about:blank");
  await c.goto(url);
  await ready(c);
  await c.getByTitle("Toggle Comments Sidebar").click();
  const threadC = c.locator(".lb-lexical-anchored-threads .lb-thread");
  await expect(threadC.getByText("Writer A", { exact: true })).toBeVisible();
  await expect(threadC.getByText(/^Guest [a-z0-9]+$/)).toBeVisible();
  await expect(threadC).not.toContainText("Anonymous");
});
