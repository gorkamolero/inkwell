import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import type { Locator, Page } from "@playwright/test";
import { authorColor, guestName } from "../../src/lib/collaboration-identity";
import { GUEST_COOKIE, guestIdentity } from "../../src/lib/guest-identity";
import {
  converge,
  editor,
  end,
  expect,
  ready,
  state,
  test,
} from "./helpers-v13";
import { output } from "./rooms";

test("record a real portfolio v20 collaboration session", async ({
  proof: { a, b, url },
}) => {
  test.setTimeout(300000);
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
        const rs = Array.from(r.getClientRects());
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
  let identity = guestIdentity();
  while (
    authorColor(identity.id) !== "#2563EB" ||
    guestName(identity.id) !== "Swift Author"
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
  const captures = await Promise.all(
    [a, b].map(async (p, i) => {
      const who = i === 0 ? "ana" : "guest",
        dir = `${output}/cdp-${who}`;
      mkdirSync(dir, { recursive: true });
      const cdp = await p.context().newCDPSession(p);
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width: 872,
        height: 800,
        deviceScaleFactor: 2,
        mobile: false,
        scale: 1,
      });
      const frames: { file: string; timestamp: number }[] = [];
      cdp.on("Page.screencastFrame", async (f) => {
        const file = `${dir}/${String(frames.length).padStart(6, "0")}.png`;
        writeFileSync(file, Buffer.from(f.data, "base64"));
        frames.push({ file, timestamp: f.metadata.timestamp! });
        await cdp
          .send("Page.screencastFrameAck", { sessionId: f.sessionId })
          .catch(() => {});
      });
      await cdp.send("Page.startScreencast", {
        format: "png",
        maxWidth: 1744,
        maxHeight: 1600,
        everyNthFrame: 1,
      });
      return { who, cdp, frames, dir };
    }),
  );
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
    await insert(a, "A lantern glowed.");
    await a.keyboard.type(" ");
    await pause(500);
    await a.keyboard.press("Backspace");
    await a.mouse.move(810, 550);
    await pause(500);
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
    await a.mouse.move(50, 395);
    positions.set(a, { x: 50, y: 395 });
    event("ana-pointer");
    await glide(a, 550, 395, 1500);
    await expect(
      b.locator(".hotpress-pointer").filter({ hasText: "Ana" }),
    ).toBeVisible();
    await pause(650);
    event("ana-pointer-end");
    await a.mouse.move(30, 550);
    await b.mouse.move(50, 395);
    positions.set(b, { x: 50, y: 395 });
    event("guest-pointer");
    await glide(b, 550, 395, 1500);
    await pause(650);
    event("parallel-ana");
    await insert(a, "The boats waited.");
    await a.mouse.move(30, 540);
    await type(a, " Sails stirred.");
    await glide(a, 30, 550, 250);
    event("parallel-guest");
    await insert(b, "A lantern glowed.");
    await b.mouse.move(800, 540);
    await type(b, " Light warmed the quay.");
    event("parallel-visible");
    await converge(a, b);
    await pause(300);
    // Collapse both selections before this shot starts; the final edit has no
    // transient single-character selection from the preparation gesture.
    await Promise.all([select(a, "harbor"), select(b, "before")]);
    await Promise.all([
      a.keyboard.press("ArrowLeft"),
      b.keyboard.press("ArrowLeft"),
    ]);
    await expect
      .poll(() => a.evaluate(() => getSelection()?.isCollapsed))
      .toBe(true);
    await expect
      .poll(() => b.evaluate(() => getSelection()?.isCollapsed))
      .toBe(true);
    await pause(200);
    await Promise.all([a.mouse.move(30, 540), b.mouse.move(800, 540)]);
    event("sentence");
    await pause(1400);
    event("sentence-typing");
    await Promise.all([
      a.keyboard.type("old ", { delay: 380 }),
      b.keyboard.type("just ", { delay: 380 }),
    ]);
    await converge(a, b);
    await expect(editor(a)).toContainText(
      "Mara reached the old harbor just before dawn.",
    );
    event("sentence-visible");
    await pause(1400);
    event("sentence-end");
    // Park the guest away before selecting the comment anchor.
    await b.mouse.click(400, 25);
    await glide(b, 120, 550, 300);
    await pause(400);
    event("comments");
    await pause(1000);
    event("selection-start");
    await select(a, "Light warmed the quay");
    event("selection-visible");
    await pause(300);
    await approach(a, a.getByRole("button", { name: "Comment", exact: true }));
    await approach(a, a.locator(".lb-composer-editor"));
    await a.keyboard.type("Keep this quiet opening?", { delay: 70 });
    event("composer-ready");
    await approach(a, a.getByRole("button", { name: "Send", exact: true }));
    await expect(a.locator(".hotpress-comment-pin")).toBeVisible();
    event("comment-posted");
    await expect(b.locator(".hotpress-comment-pin")).toBeVisible();
    event("comment-visible");
    await a.mouse.move(30, 600);
    await pause(1800);
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
    await glide(a, 400, 470, 200);
    event("reply-visible");
    await pause(1500);
    for (const p of [a, b])
      await approach(
        p,
        p
          .locator(".hotpress-comment-popover")
          .getByRole("button", { name: "Close comment" }),
      );
    event("reply-closed");
    await pause(250);
    event("reply-zoom-start");
    await pause(1000);
    event("reply-zoom-end");
    event("offline-intro");
    // Position the native browser selection after the last text node. Let
    // Lexical consume selectionchange before the real Enter key is dispatched.
    await editor(b).evaluate((el) => {
      el.focus();
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let last: Node | null = null;
      for (let n = w.nextNode(); n; n = w.nextNode()) last = n;
      const r = document.createRange();
      r.setStart(last!, last!.textContent!.length);
      r.collapse(true);
      const sel = getSelection()!;
      sel.removeAllRanges();
      sel.addRange(r);
      document.dispatchEvent(new Event("selectionchange"));
    });
    await pause(300);
    await b.keyboard.press("Enter");
    await pause(200);
    await expect(editor(b).locator("p").last()).toHaveText("");
    await expect(editor(b)).toContainText(
      "Mara reached the old harbor just before dawn.",
    );
    await b.mouse.move(810, 550);
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
    event("offline-typing");
    await type(b, "The town ");
    await pause(400);
    event("offline-partial");
    await expect(editor(a)).not.toContainText("The town");
    await insert(a, "Sails stirred.");
    await a.mouse.move(30, 540);
    event("online-writing");
    await type(a, " The tide turned.");
    event("online-visible");
    await pause(400);
    await expect(editor(b)).not.toContainText("The tide turned.");
    event("offline-finishing");
    await type(b, "woke slowly.");
    event("offline-visible");
    await pause(500);
    await b.mouse.click(400, 25);
    await a.mouse.click(400, 25);
    await Promise.all(
      [a, b].map((p) =>
        p.evaluate(() => {
          const el = document.querySelector(
            '[aria-label="Collaborative Editor"]',
          )!;
          (window as any).__mergeObservations = [];
          new MutationObserver(() => {
            (window as any).__mergeObservations.push({
              at: Date.now(),
              text: el.textContent,
            });
          }).observe(el, {
            childList: true,
            subtree: true,
            characterData: true,
          });
        }),
      ),
    );
    event("reconnect-intro");
    await pause(1800);
    event("reconnect");
    await b.context().setOffline(false);
    await expect(editor(a)).toContainText("The town woke slowly.");
    event("arrival");
    await ready(b);
    event("live-badge");
    await converge(a, b);
    event("merged");
    await pause(6500);
    event("match-end");
    const bothObservations = await Promise.all(
      [a, b].map((p) => p.evaluate(() => (window as any).__mergeObservations)),
    );
    writeFileSync(
      `${output}/both-merge-observations.json`,
      JSON.stringify(bothObservations, null, 2),
    );
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

    await expect(editor(a)).toContainText(
      "Mara reached the old harbor just before dawn.",
    );
    await expect(editor(a).locator("p").last()).toHaveText(
      "The town woke slowly.",
    );
    passed = true;
  } finally {
    const ended = Date.now();
    await Promise.all(
      captures.map((cap) => cap.cdp.send("Page.stopScreencast")),
    );
    for (const cap of captures) {
      writeFileSync(`${cap.dir}/frames.json`, JSON.stringify(cap.frames));
      const lines = cap.frames.flatMap((f, i) => [
        `file '${f.file}'`,
        `duration ${i + 1 < cap.frames.length ? Math.max(0.001, cap.frames[i + 1].timestamp - f.timestamp) : Math.max(0.1, ended / 1000 - f.timestamp)}`,
      ]);
      lines.push(`file '${cap.frames.at(-1)!.file}'`);
      writeFileSync(`${cap.dir}/concat.txt`, lines.join("\n"));
      execFileSync("ffmpeg", [
        "-v",
        "error",
        "-y",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        `${cap.dir}/concat.txt`,
        "-vf",
        "fps=30",
        "-c:v",
        "libvpx-vp9",
        "-lossless",
        "1",
        "-deadline",
        "realtime",
        "-cpu-used",
        "8",
        "-threads",
        "4",
        `${output}/raw-${cap.who}.webm`,
      ]);
    }
    writeFileSync(
      `${output}/portfolio-scenario.json`,
      JSON.stringify(
        {
          passed,
          guestName: guestName(identity.id),
          events,
          durationSeconds: (ended - started) / 1000,
          continuousTake: true,
          takeStartedAt: new Date(started).toISOString(),
          takeEndedAt: new Date(ended).toISOString(),
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
