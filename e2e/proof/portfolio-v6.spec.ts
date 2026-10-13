import { writeFileSync } from "node:fs";
import type { Page, Locator } from "@playwright/test";
import { test, expect, editor, ready, end, converge, state } from "./helpers";
import { output } from "./rooms";
import { GUEST_COOKIE, guestIdentity } from "../../src/lib/guest-identity";
import { authorColor, guestName } from "../../src/lib/collaboration-identity";

test("record a real portfolio v6 collaboration session", async ({
  proof: { a, b, url },
}) => {
  test.setTimeout(100000);
  const events: { name: string; seconds: number }[] = [];
  let started = 0;
  const event = (name: string) =>
    events.push({ name, seconds: (Date.now() - started) / 1000 });
  const pause = (ms: number) => a.waitForTimeout(ms);
  const positions = new Map<Page, { x: number; y: number }>();
  const glide = async (p: Page, x: number, y: number, ms = 400) => {
    const from = positions.get(p) || { x: 15, y: 650 };
    const bend = p === a ? 24 : -35;
    for (let i = 1; i <= 20; i++) {
      const t = i / 20,
        u = t * t * (3 - 2 * t);
      await p.mouse.move(
        from.x + (x - from.x) * u + Math.sin(Math.PI * u) * bend,
        from.y + (y - from.y) * u - Math.sin(Math.PI * u) * (p === a ? 16 : 32),
      );
      await p.waitForTimeout(ms / 20);
    }
    positions.set(p, { x, y });
  };
  const approach = async (p: Page, target: Locator, click = true) => {
    const r = (await target.boundingBox())!;
    await glide(p, r.x + r.width / 2, r.y + r.height / 2);
    if (click) await p.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
  };
  const phrase = async (p: Page, text: string) =>
    editor(p).evaluate((el, text) => {
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        const i = n.textContent!.indexOf(text);
        if (i < 0) continue;
        const r = document.createRange();
        r.setStart(n, i);
        r.setEnd(n, i + text.length);
        const rs = [...r.getClientRects()];
        return {
          x: rs[0].left + 1,
          y: rs[0].top + rs[0].height / 2,
          endX: rs.at(-1)!.right - 1,
          endY: rs.at(-1)!.top + rs.at(-1)!.height / 2,
        };
      }
      throw new Error(`Missing phrase: ${text}`);
    }, text);
  const select = async (p: Page, text: string) => {
    const r = await phrase(p, text);
    await glide(p, r.x, r.y);
    await p.mouse.down();
    await glide(p, r.endX, r.endY, 500);
    await p.mouse.up();
    await expect
      .poll(() => p.evaluate(() => getSelection()?.toString()))
      .toBe(text);
  };
  const insert = async (
    p: Page,
    text: string,
    where: "start" | "end" = "end",
  ) => {
    const r = await phrase(p, text);
    const x = where === "start" ? r.x : r.endX,
      y = where === "start" ? r.y : r.endY;
    await glide(p, x, y);
    await p.mouse.click(x, y);
    // Click near the glyph boundary, then use paragraph boundaries for end insertions.
    if (where === "end") await p.keyboard.press("End");
  };
  const type = (p: Page, text: string) => p.keyboard.type(text, { delay: 140 });
  const style = `
    [aria-label="Collaborative Editor"]{font-size:30px!important;line-height:1.5!important}
    [aria-label="Collaborative Editor"] p{margin:0 0 22px!important}
    [aria-label="Collaborative Editor"] h1{font-size:36px!important;margin:0 0 22px!important}
    .lb-comment-body,.lb-composer-editor{font-size:24px!important;line-height:1.35!important}
    .lb-user,.hotpress-popover-heading,.hotpress-preview-author{font-size:18px!important}
    .hotpress-comment-preview{font-size:22px!important}
    [title="Click to edit title"]{color:#000!important}
    .hotpress-pointer>span,.lb-lexical-cursors>div>span>span>span{font-size:21px!important;line-height:24px!important}
    .lb-lexical-cursors>div>span>span>span{top:-32px!important}
    .hotpress-collaboration-header span.uppercase{font-size:21px!important;line-height:24px!important}
    .hotpress-pin-count{font-size:20px!important;line-height:23px!important}
  `;
  for (const p of [a, b])
    await p.addInitScript((css) => {
      document.addEventListener("DOMContentLoaded", () => {
        const s = document.createElement("style");
        s.textContent = css;
        document.head.append(s);
      });
    }, style);
  await b.addInitScript(() => {
    const NativeSocket = window.WebSocket;
    (window as any).__recordingSockets = [];
    window.WebSocket = class extends NativeSocket {
      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        (window as any).__recordingSockets.push(this);
      }
    };
  });
  await a.addStyleTag({ content: style });
  await a.getByTitle("Click to edit title").click();
  await a.locator('input[maxlength="100"]').fill("Harbor");
  await a.locator('input[maxlength="100"]').press("Enter");
  await end(a);
  await a.keyboard.type(
    "# Chapter One\nMara reached the harbor before dawn.\nThe boats waited.\nA lantern glowed.",
  );
  await a.mouse.click(820, 650);
  await b.setContent(
    '<html><body style="margin:0;background:#fff"></body></html>',
  );
  // A local pointer overlay records real mouse events; remote pointers are the app's own.
  const pointer = async (p: Page) =>
    p.evaluate(() => {
      const el = document.createElement("div");
      el.id = "recording-pointer";
      el.style.cssText =
        "position:fixed;left:0;top:0;z-index:99;pointer-events:none;opacity:0";
      el.innerHTML =
        '<svg width="21" height="26" viewBox="0 0 21 26"><path d="M1 1 L1 21 L6 16 L10 25 L14 23 L10 14 L19 14 Z" fill="black" stroke="white" stroke-width="1.5"/></svg>';
      document.body.append(el);
      let idle: ReturnType<typeof setTimeout>;
      el.style.transition = "opacity 200ms";
      document.addEventListener("pointermove", (e) => {
        clearTimeout(idle);
        idle = setTimeout(() => {
          el.style.opacity = "0";
        }, 1100);
        el.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
        el.style.opacity = "1";
      });
    });
  await pointer(a);
  let identity = guestIdentity();
  while (
    authorColor(identity.id) !== "#2563EB" ||
    guestName(identity.id) !== "Bold Editor"
  )
    identity = guestIdentity();
  await b.context().addCookies([
    {
      name: GUEST_COOKIE,
      value: identity.cookie,
      url: "http://localhost:3847",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await a.evaluate(() => {
    const container = document.querySelector(
      '[title="Click to change your name"]',
    )!.parentElement!.parentElement!;
    const observer = new MutationObserver(() => {
      if (container.querySelector(":scope > div[title]")) {
        (window as any).__recordingAvatarArrival = Date.now();
        observer.disconnect();
      }
    });
    observer.observe(container, { childList: true });
  });
  for (const p of [a, b]) {
    await p.mouse.move(15, 650);
    positions.set(p, { x: 15, y: 650 });
    await p.evaluate(() => {
      const s = document.createElement("div");
      s.id = "recording-sync";
      s.style.cssText =
        "position:fixed;inset:0;z-index:2147483647;background:rgb(0,255,0)";
      document.body.append(s);
    });
  }
  await Promise.all([a, b].map((p) => p.screenshot()));
  await pause(1000);
  await Promise.all(
    [a, b].map((p) =>
      p.evaluate(() => document.getElementById("recording-sync")!.remove()),
    ),
  );
  started = Date.now();
  let passed = false;
  try {
    event("alone");
    await expect(
      a.getByTitle("Click to change your name").locator("span"),
    ).toHaveText("Ana");
    await glide(a, 280, 205, 700);
    await pause(800);
    event("join");
    await b.goto(url);
    await ready(b);
    await converge(a, b);
    const guest = (
      await b
        .getByTitle("Click to change your name")
        .locator("span")
        .innerText()
    ).trim();
    await pointer(b);
    event("joined");
    const avatarAt = await a.evaluate(
      () => (window as any).__recordingAvatarArrival,
    );
    expect(avatarAt).toBeGreaterThan(started);
    events.push({
      name: "avatar-arrival",
      seconds: (avatarAt - started) / 1000,
    });
    await expect(a.getByTitle(guest, { exact: true })).toBeVisible();
    await pause(1500);
    event("parallel-ana");
    await Promise.all([
      insert(a, "The boats waited."),
      insert(b, "A lantern glowed."),
    ]);
    await Promise.all([
      type(a, " Sails stirred."),
      type(b, " Light warmed the quay."),
    ]);
    event("parallel-visible");
    await converge(a, b);
    await pause(300);
    event("sentence");
    await Promise.all([select(a, "harbor"), select(b, "before")]);
    await Promise.all([
      a.keyboard.press("ArrowLeft"),
      b.keyboard.press("ArrowLeft"),
    ]);
    await Promise.all([type(a, "old "), type(b, "just ")]);
    await converge(a, b);
    await expect(editor(a)).toContainText(
      "Mara reached the old harbor just before dawn.",
    );
    event("sentence-visible");
    await pause(500);
    // Park the guest away before selecting the comment anchor.
    await insert(b, "A lantern glowed.");
    await glide(b, 460, 320, 200);
    event("comments");
    await select(a, "before dawn");
    event("selection-visible");
    await pause(300);
    await approach(a, a.getByRole("button", { name: "Comment", exact: true }));
    await approach(a, a.locator(".lb-composer-editor"));
    await a.keyboard.type("Keep this quiet opening?", { delay: 70 });
    event("composer-ready");
    await approach(a, a.getByRole("button", { name: "Send", exact: true }));
    for (const p of [a, b])
      await expect(p.locator(".hotpress-comment-pin")).toBeVisible();
    event("comment-visible");
    event("reply");
    await approach(b, b.locator(".hotpress-comment-pin"), false);
    await expect(b.locator(".hotpress-comment-preview")).toBeVisible();
    event("hover-visible");
    await pause(550);
    await b.mouse.down();
    await b.mouse.up();
    const pop = b.locator(".hotpress-comment-popover");
    await expect(
      pop.getByText("Keep this quiet opening?", { exact: true }),
    ).toBeVisible();
    await approach(b, pop.locator(".lb-composer-editor"));
    await b.keyboard.type("Yes. Let it wake slowly.", { delay: 70 });
    event("reply-ready");
    await approach(
      b,
      pop.getByRole("button", { name: "Reply", exact: true }),
      false,
    );
    event("reply-send");
    await b.mouse.down();
    await b.mouse.up();
    await expect(a.locator(".hotpress-pin-count")).toHaveText("2");
    event("count-two");
    await pause(650);
    await approach(a, a.locator(".hotpress-comment-pin"));
    const anaPop = a.locator(".hotpress-comment-popover");
    await expect(
      anaPop.getByText("Yes. Let it wake slowly.", { exact: true }),
    ).toBeVisible();
    await expect(anaPop.locator(".lb-user[data-loading]")).toHaveCount(0);
    await expect(
      anaPop.locator(".lb-user").filter({ hasText: guest }),
    ).toHaveCount(1);
    await pause(250);
    event("reply-visible");
    await pause(1500);
    for (const p of [a, b])
      await approach(
        p,
        p
          .locator(".hotpress-comment-popover")
          .getByRole("button", { name: "Close comment" }),
      );
    event("offline-intro");
    await pause(450);
    event("offline");
    await b.context().setOffline(true);
    // Sever the actual socket too: Chromium offline emulation can retain a
    // stalled socket and replay its individual queued packets after recovery.
    await b.evaluate(() => {
      for (const socket of (window as any).__recordingSockets) socket.close();
    });
    await expect(b.getByText("Offline", { exact: true })).toBeVisible();
    event("offline-badge");
    await pause(1100);
    await insert(b, "Light warmed the quay.");
    await b.keyboard.press("Enter");
    await type(b, "The town woke slowly.");
    event("offline-visible");
    await expect(editor(a)).not.toContainText("The town woke slowly.");
    await b.mouse.click(400, 25);
    await pause(400);
    event("online-writing");
    await pause(350);
    await insert(a, "Sails stirred.");
    await type(a, " The tide turned.");
    event("online-visible");
    await expect(editor(b)).not.toContainText("The tide turned.");
    await a.mouse.click(400, 25);
    await pause(350);
    await a.evaluate(() => {
      const el = document.querySelector('[aria-label="Collaborative Editor"]')!;
      (window as any).__mergeObservations = [];
      new MutationObserver(() => {
        (window as any).__mergeObservations.push({
          at: Date.now(),
          text: el.textContent,
        });
      }).observe(el, { childList: true, subtree: true, characterData: true });
    });
    event("reconnect-intro");
    await pause(500);
    event("reconnect");
    await b.context().setOffline(false);
    await expect(editor(a)).toContainText("The town woke slowly.");
    event("arrival");
    await ready(b);
    event("live-badge");
    await converge(a, b);
    event("merged");
    await pause(3500);
    const observations = await a.evaluate(
      () => (window as any).__mergeObservations,
    );
    const arrivals = observations.filter((x: any) =>
      x.text.includes("The town"),
    );
    writeFileSync(
      `${output}/merge-observations.json`,
      JSON.stringify(observations, null, 2),
    );
    expect(arrivals.length).toBeGreaterThan(0);
    expect(
      arrivals.every((x: any) => x.text.includes("The town woke slowly.")),
    ).toBe(true);

    passed = true;
  } finally {
    writeFileSync(
      `${output}/portfolio-scenario.json`,
      JSON.stringify(
        {
          passed,
          events,
          durationSeconds: (Date.now() - started) / 1000,
          continuousTake: true,
          sharePath: new URL(url).pathname,
          finalDocuments: await Promise.all([
            state(a).catch(() => null),
            state(b).catch(() => null),
          ]),
        },
        null,
        2,
      ),
    );
  }
});
