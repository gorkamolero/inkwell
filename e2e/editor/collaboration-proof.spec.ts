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
  selectPhrase,
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
        (window as unknown as { __collaborationSnapshot: () => unknown[] })
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
    await b.locator(".hotpress-comment-pin").click();
    const threadB = b.locator(".hotpress-comment-popover .lb-thread");
    await expect(
      threadB.getByText("Please review this phrase.", { exact: true }),
    ).toBeVisible();
    const anchored = await state(b);
    type SnapshotNode = {
      type: string;
      text?: string;
      children?: SnapshotNode[];
    };
    const marks: SnapshotNode[] = [];
    const visit = (node: SnapshotNode) => {
      if (node.type === "lb-thread-mark") marks.push(node);
      node.children?.forEach(visit);
    };
    visit(anchored.root);
    expect(
      marks.some(
        (mark) =>
          mark.children?.map((child) => child.text || "").join("") ===
          "anchored phrase",
      ),
    ).toBe(true);
    await threadB
      .getByText("Please review this phrase.", { exact: true })
      .click();
    await threadB.locator(".lb-composer-editor").fill("Reviewed by the guest.");
    await threadB.getByRole("button", { name: "Reply", exact: true }).click();
    await a.locator(".hotpress-comment-pin").click();
    await expect(
      a
        .locator(".hotpress-comment-popover")
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
  await b.locator(".hotpress-comment-pin").click();
  const threadB = b.locator(".hotpress-comment-popover .lb-thread");
  await expect(threadB.getByText("Writer A", { exact: true })).toBeVisible();
  await threadB.getByText("An opening thought.", { exact: true }).click();
  await threadB.locator(".lb-composer-editor").fill("A guest thought.");
  await threadB.getByRole("button", { name: "Reply", exact: true }).click();
  await expect(threadB.getByText(guest, { exact: true })).toBeVisible();
  await a.locator(".hotpress-comment-pin").click();
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
  await c.locator(".hotpress-comment-pin").click();
  const threadC = c.locator(".hotpress-comment-popover .lb-thread");
  await expect(threadC.getByText("Writer A", { exact: true })).toBeVisible();
  await expect(threadC.getByText(guest, { exact: true })).toBeVisible();
  await expect(threadC).not.toContainText("Anonymous");
});

test("Product — moving pointers, highlight and pin, preview, popover reply, composer, resolve and phone sheet; no sidebar", async ({
  proof: { a, b },
}) => {
  test.setTimeout(90000);
  await Promise.all(
    [a, b].map((p) => p.setViewportSize({ width: 1440, height: 1000 })),
  );
  await end(a);
  await a.keyboard.type(
    "The morning harbor\nMara reached the harbor before dawn.\nThe boats waited in the mist.\nA lantern glowed beside the gate.",
  );
  await converge(a, b);
  const box = (await editor(a).boundingBox())!;
  await a.mouse.move(box.x + 110, box.y + 110);
  await b.mouse.move(box.x + 260, box.y + 150);
  for (const p of [a, b])
    await expect(p.getByTestId("remote-pointer")).toBeVisible();
  const pointer = b.getByTestId("remote-pointer");
  await expect
    .poll(async () =>
      Math.abs((await pointer.boundingBox())!.x - (box.x + 110)),
    )
    .toBeLessThan(3);
  const before = (await pointer.boundingBox())!;
  const motion = pointer.evaluate(
    (el) =>
      new Promise<number[]>((resolve) => {
        const samples: number[] = [];
        const start = performance.now();
        const frame = () => {
          samples.push(el.getBoundingClientRect().x);
          if (performance.now() - start < 650) requestAnimationFrame(frame);
          else resolve(samples);
        };
        requestAnimationFrame(frame);
      }),
  );
  await a.mouse.move(box.x + 300, box.y + 170);
  const samples = await motion;
  expect(samples.some((x) => x > before.x + 10 && x < box.x + 280)).toBe(true);
  writeFileSync(`${output}/pointer-motion.json`, JSON.stringify(samples));
  await expect
    .poll(async () => (await pointer.boundingBox())!.x)
    .toBeGreaterThan(before.x + 100);
  await a.screenshot({
    animations: "disabled",
    path: `${output}/product-pointer-owner.png`,
  });
  await b.screenshot({
    animations: "disabled",
    path: `${output}/product-pointer-guest.png`,
  });
  await b.setViewportSize({ width: 1100, height: 1000 });
  const narrower = (await editor(b).boundingBox())!;
  await expect
    .poll(async () =>
      Math.abs((await pointer.boundingBox())!.x - narrower.x - 300),
    )
    .toBeLessThan(3);
  await b.setViewportSize({ width: 1440, height: 1000 });
  await expect(pointer).toHaveAttribute("data-idle", "true", { timeout: 5000 });
  await a.mouse.move(5, 5);
  await expect(pointer).toHaveCount(0);
  await end(b);
  await selectPhrase(a, "before dawn");
  const remoteSelection = b.locator(".lb-lexical-cursors > div > span").first();
  await expect
    .poll(async () => (await remoteSelection.boundingBox())?.width || 0)
    .toBeGreaterThan(50);
  const flag = b
    .locator(".lb-lexical-cursors")
    .getByText("Writer A", { exact: true });
  await expect(flag.locator("..")).toHaveCSS("width", "2px");
  await expect(flag).toHaveCSS("font-size", "13px");
  await b.screenshot({
    animations: "disabled",
    path: `${output}/product-caret-selection.png`,
  });
  await a.getByRole("button", { name: "Comment", exact: true }).click();
  await expect(a.locator(".lb-lexical-floating-composer")).toBeVisible();
  await a.screenshot({
    animations: "disabled",
    path: `${output}/product-composer.png`,
  });
  await a.locator(".lb-composer-editor").fill("Keep this quiet opening?");
  await a.getByRole("button", { name: "Send", exact: true }).click();
  const pin = b.locator(".hotpress-comment-pin");
  await expect(pin).toBeVisible();
  await expect(
    b.locator(
      "aside[aria-label='Document comments'], .hotpress-comment-margin, .lb-lexical-anchored-threads",
    ),
  ).toHaveCount(0);
  const mark = editor(b).locator(".lb-lexical-thread-mark");
  await expect(mark).toHaveCSS("background-color", "rgb(255, 241, 172)");
  await b.mouse.move(5, 5);
  await b.screenshot({
    animations: "disabled",
    path: `${output}/product-highlight-pin.png`,
  });
  await pin.hover();
  await expect(b.locator(".hotpress-comment-preview")).toBeVisible();
  await b.screenshot({
    animations: "disabled",
    path: `${output}/product-hover-preview.png`,
  });
  await pin.click();
  const popover = b.getByRole("dialog", { name: "Comment thread" });
  await expect(popover.locator(".lb-composer-editor")).toBeVisible();
  const guestName = (await b.getByTitle("Click to change your name").locator("span").innerText()).trim();
  await popover
    .locator(".lb-composer-editor")
    .fill("Yes, let the harbor wake slowly.");
  await popover.getByRole("button", { name: "Reply", exact: true }).click();
  await expect(
    popover.getByText("Yes, let the harbor wake slowly.", { exact: true }),
  ).toBeVisible();
  await expect(popover.locator(".lb-user").filter({ hasText: guestName })).toHaveCount(1);
  await expect(popover.locator(".lb-user[data-loading]")).toHaveCount(0);
  await b.screenshot({
    animations: "disabled",
    path: `${output}/product-popover-reply.png`,
  });
  await b.keyboard.press("Escape");
  await expect(popover).toHaveCount(0);
  await b.getByTitle("Next unresolved comment").click();
  await expect(popover).toBeVisible();
  await b.mouse.click(10, 10);
  await expect(popover).toHaveCount(0);
  await b.setViewportSize({ width: 390, height: 844 });
  await b.screenshot({
    animations: "disabled",
    path: `${output}/product-phone-highlight-pin.png`,
  });
  await selectPhrase(b, "boats");
  await b.getByRole("button", { name: "Comment", exact: true }).click();
  await expect(b.locator(".lb-lexical-floating-composer")).toBeVisible();
  await b.screenshot({
    animations: "disabled",
    path: `${output}/product-phone-composer.png`,
  });
  await b.keyboard.press("Escape");
  await expect(b.locator(".lb-lexical-floating-composer")).toHaveCount(0);
  await end(b);
  await pin.click();
  await expect(popover).toBeVisible();
  await expect.poll(async () => (await popover.boundingBox())!.x).toBe(8);
  const sheet = (await popover.boundingBox())!;
  expect(sheet.x).toBe(8);
  expect(sheet.y + sheet.height).toBeGreaterThan(825);
  await a.mouse.move(box.x + 130, box.y + 100);
  await expect(b.getByTestId("remote-pointer")).toHaveCount(1);
  // Narrow views also show remote mouse pointers; touch input still publishes none.
  await expect(b.getByTestId("remote-pointer")).toBeVisible();
  expect(
    await b.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await b.screenshot({
    animations: "disabled",
    path: `${output}/product-phone-bottom-sheet.png`,
  });
  await popover
    .getByRole("button", { name: "Resolve thread", exact: true })
    .click();
  await expect(pin).toHaveCount(0);
  await expect(editor(b).locator("[data-comment-resolved=true]")).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  await b.screenshot({
    animations: "disabled",
    path: `${output}/product-phone-resolved.png`,
  });
  await a.setViewportSize({ width: 1440, height: 1000 });
  await expect(a.locator(".hotpress-comment-pin")).toHaveCount(0);
  await a.screenshot({
    animations: "disabled",
    path: `${output}/product-resolved.png`,
  });
});
