import { writeFileSync } from "node:fs";
import type { Page, Locator } from "@playwright/test";
import {
  test,
  expect,
  editor,
  ready,
  end,
  converge,
  selectPhrase,
  comment,
  state,
} from "./helpers";
import { output } from "./rooms";

// Every action belongs to one uninterrupted take. A failed assertion invalidates it.
test("record a real portfolio collaboration session", async ({
  proof: { a, b, url },
}) => {
  test.setTimeout(120000);
  const events: { name: string; seconds: number }[] = [];
  let started = 0;
  const event = (name: string) =>
    events.push({ name, seconds: (Date.now() - started) / 1000 });
  const pause = (ms: number) => a.waitForTimeout(ms);
  const beat = async (s: number) =>
    pause(Math.max(0, started + s * 1000 - Date.now()));
  const positions = new Map<Page, { x: number; y: number }>();
  const glide = async (p: Page, x: number, y: number, ms = 650) => {
    const from = positions.get(p) || { x: 20, y: 20 };
    const n = Math.max(24, Math.round(ms / 16));
    for (let i = 1; i <= n; i++) {
      const t = i / n,
        u = t * t * (3 - 2 * t);
      await p.mouse.move(
        from.x + (x - from.x) * u + Math.sin(Math.PI * u) * 28,
        from.y + (y - from.y) * u - Math.sin(Math.PI * u) * 22,
        { steps: 1 },
      );
      await p.waitForTimeout(ms / n);
    }
    positions.set(p, { x, y });
  };
  const approach = async (p: Page, target: Locator, click = true) => {
    const r = (await target.boundingBox())!;
    await glide(p, r.x + r.width / 2, r.y + r.height / 2);
    await pause(160);
    if (click) await p.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
  };
  const type = async (p: Page, text: string) => {
    for (let i = 0; i < text.length; i++) {
      await p.keyboard.type(text[i]);
      await p.waitForTimeout(62 + ((i * 37) % 65));
    }
  };
  const select = async (p: Page, phrase: string) => {
    // selectPhrase's click lands at the editor centre; approach it first.
    await approach(p, editor(p), false);
    await selectPhrase(p, phrase);
  };
  const atEnd = async (p: Page, phrase: string) => {
    await select(p, phrase);
    await p.keyboard.press("ArrowRight");
    await p.keyboard.press("ArrowLeft");
  };
  const style = `
    [aria-label="Collaborative Editor"] { font-size:26px!important; line-height:1.55!important; }
    [aria-label="Collaborative Editor"] p { margin:0 0 25px!important; }
    [aria-label="Collaborative Editor"] h1 { font-size:38px!important; margin:8px 0 28px!important; }
    .lb-comment-body,.lb-composer-editor { font-size:18px!important; line-height:1.45!important; }
  `;
  for (const p of [a, b])
    await p.addInitScript((css) => {
      const install = () => {
        const s = document.createElement("style");
        s.textContent = css;
        document.head.append(s);
      };
      if (document.head) install();
      else
        document.addEventListener("DOMContentLoaded", install, { once: true });
    }, style);
  await a.addStyleTag({ content: style });
  await a.getByTitle("Click to edit title").click();
  await a.locator('input[maxlength="100"]').fill("Harbor");
  await a.locator('input[maxlength="100"]').press("Enter");
  await end(a);
  await a.keyboard.type(
    "# Chapter One\nMara reached the harbor before dawn. The water lay dark and quiet.\nThe boats waited in the mist. Ropes creaked softly against the wooden posts.\nA lantern glowed beside the gate. Its light traced a narrow path across the stones.\nBeyond the seawall, the town was still asleep.",
  );
  await b.setContent(
    '<html><body style="margin:0;background:#fafafa"></body></html>',
  );
  for (const p of [a, b]) {
    await p.mouse.move(20, 20);
    positions.set(p, { x: 20, y: 20 });
    await p.evaluate(() => {
      const slate = document.createElement("div");
      slate.id = "recording-sync";
      slate.style.cssText =
        "position:fixed;inset:0;z-index:2147483647;background:rgb(0,255,0)";
      document.body.append(slate);
    });
  }
  await pause(500);
  await Promise.all(
    [a, b].map((p) =>
      p.evaluate(() => document.getElementById("recording-sync")!.remove()),
    ),
  );
  started = Date.now();
  let passed = false;
  try {
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
    await glide(a, 310, 340, 1000);
    await glide(b, 510, 410, 1000);
    await expect(a.getByTestId("remote-pointer")).toBeVisible();
    await expect(b.getByTestId("remote-pointer")).toBeVisible();
    event("pointers-visible");
    await beat(7);
    event("parallel");
    await Promise.all([
      atEnd(a, "The boats waited in the mist."),
      atEnd(b, "A lantern glowed beside the gate."),
    ]);
    await Promise.all([type(a, ", sails still"), type(b, ", burning low")]);
    await converge(a, b);
    await expect(
      a.locator(".lb-lexical-cursors").getByText(guest, { exact: true }),
    ).toBeVisible();
    await expect(
      b.locator(".lb-lexical-cursors").getByText("Ana", { exact: true }),
    ).toBeVisible();
    event("parallel-visible");
    await beat(14);
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
    await beat(20);
    event("comments");
    await comment(a, "before dawn", "Keep this quiet opening?", {
      select: async (p, phrase) => {
        await select(p, phrase);
        await pause(500);
      },
      click: approach,
      write: async (p, target, text) => {
        await approach(p, target);
        await type(p, text);
        event("composer-ready");
      },
    });
    for (const p of [a, b])
      await expect(p.locator(".hotpress-comment-pin")).toBeVisible();
    event("comment-visible");
    await beat(29);
    event("reply");
    await approach(b, b.locator(".hotpress-comment-pin"), false);
    await expect(b.locator(".hotpress-comment-preview")).toBeVisible();
    event("hover-visible");
    await pause(750);
    await b.mouse.down();
    await pause(80);
    await b.mouse.up();
    const pop = b.locator(".hotpress-comment-popover");
    await expect(pop).toBeVisible();
    await expect(
      pop.getByText("Keep this quiet opening?", { exact: true }),
    ).toBeVisible();
    await approach(b, pop.locator(".lb-composer-editor"));
    await type(b, "Yes, let the harbor wake slowly.");
    await approach(b, pop.getByRole("button", { name: "Reply", exact: true }));
    await approach(a, a.locator(".hotpress-comment-pin"));
    await expect(
      a
        .locator(".hotpress-comment-popover")
        .getByText("Yes, let the harbor wake slowly.", { exact: true }),
    ).toBeVisible();
    await expect(
      a.locator(".lb-thread .lb-user").filter({ hasText: guest }),
    ).toHaveCount(1);
    await pause(250);
    event("reply-visible");
    await pause(3300);
    await beat(41);
    for (const p of [a, b]) await p.keyboard.press("Escape");
    await pause(800);
    await beat(43);
    event("offline");
    await b.context().setOffline(true);
    await expect(b.getByText("Offline", { exact: true })).toBeVisible();
    await Promise.all([
      atEnd(a, "The boats waited in the mist, sails still."),
      atEnd(b, "A lantern glowed beside the gate, burning low."),
    ]);
    await Promise.all([
      type(a, " as the tide turned"),
      type(b, " until sunrise"),
    ]);
    await expect(editor(a)).not.toContainText("until sunrise");
    await expect(editor(b)).not.toContainText("as the tide turned");
    event("offline-visible");
    await pause(4000);
    await beat(53);
    event("reconnect");
    await b.context().setOffline(false);
    await ready(b);
    for (const p of [a, b]) {
      await expect(editor(p)).toContainText("as the tide turned");
      await expect(editor(p)).toContainText("until sunrise");
    }
    await converge(a, b);
    event("merged");
    await Promise.all([glide(a, 820, 700), glide(b, 820, 700)]);
    await pause(2200);
    await beat(58);
    expect((Date.now() - started) / 1000).toBeLessThanOrEqual(62);
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
