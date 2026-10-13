import { writeFileSync } from "node:fs";
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
} from "../proof/helpers";
import { output } from "../proof/rooms";

test("record a real portfolio collaboration session", async ({
  proof: { a, b, url },
}) => {
  test.setTimeout(120000);
  const events: { name: string; seconds: number }[] = [];
  let started = 0;
  const event = (name: string) =>
    events.push({ name, seconds: (Date.now() - started) / 1000 });
  const beat = async (seconds: number) => {
    await a.waitForTimeout(Math.max(0, started + seconds * 1000 - Date.now()));
  };
  const style = `
    [aria-label="Collaborative Editor"] { font-size:24px!important; line-height:1.6!important; }
    [aria-label="Collaborative Editor"] p { margin:0 0 24px!important; }
    [aria-label="Collaborative Editor"] h1 { font-size:38px!important; margin:12px 0 28px!important; }
    .lb-root { --lb-font-size:18px; }
    .lb-comment-body,.lb-composer-editor { font-size:18px!important; line-height:1.5!important; }
  `;
  // Apply readability styling before each navigation paints; no content or status is replaced.
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
  await expect(a.getByTitle("Click to edit title")).toHaveText("Harbor");
  await end(a);
  await a.keyboard.type(
    "# Chapter One\nMara reached the harbor before dawn.\nThe boats waited in the mist.\nA lantern glowed beside the gate.",
  );
  await expect(editor(a).locator("h1")).toHaveText("Chapter One");
  await b.setContent(
    '<html><body style="margin:0;background:#fafafa"></body></html>',
  );
  // A shared visual slate provides an exact timestamp in each raw recording.
  for (const p of [a, b])
    await p.evaluate(() => {
      const slate = document.createElement("div");
      slate.id = "recording-sync";
      slate.style.cssText =
        "position:fixed;inset:0;z-index:2147483647;background:rgb(0,255,0)";
      document.body.append(slate);
    });
  await a.waitForTimeout(500);
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
    await expect(a.getByTitle(guest, { exact: true })).toBeVisible();
    await expect(b.getByTitle("Ana", { exact: true })).toBeVisible();
    const atEnd = async (p: typeof a, index: number) => {
      await editor(p).locator("p").nth(index).click();
      await p.keyboard.press("End");
      await p.keyboard.press("ArrowLeft");
    };
    await Promise.all([atEnd(a, 1), atEnd(b, 2)]);
    await expect(
      a.locator(".lb-lexical-cursors").getByText(guest, { exact: true }),
    ).toBeVisible();
    await expect(
      b.locator(".lb-lexical-cursors").getByText("Ana", { exact: true }),
    ).toBeVisible();
    await beat(6);
    event("parallel");
    await Promise.all([
      a.keyboard.type(", their sails still", { delay: 125 }),
      b.keyboard.type(", warm against the cold", { delay: 110 }),
    ]);
    await converge(a, b);
    await expect(editor(a)).toContainText(
      "The boats waited in the mist, their sails still.",
    );
    await expect(editor(a)).toContainText(
      "A lantern glowed beside the gate, warm against the cold.",
    );
    await beat(13);
    event("sentence");
    await Promise.all([selectPhrase(a, "harbor"), selectPhrase(b, "before")]);
    await Promise.all([
      a.keyboard.press("ArrowLeft"),
      b.keyboard.press("ArrowLeft"),
    ]);
    await Promise.all([
      a.keyboard.type("old ", { delay: 180 }),
      b.keyboard.type("just ", { delay: 180 }),
    ]);
    await converge(a, b);
    await expect(editor(a)).toContainText(
      "Mara reached the old harbor just before dawn.",
    );
    await beat(19);
    event("comments");
    await selectPhrase(a, "before dawn");
    await a.waitForTimeout(1000);
    await a
      .getByRole("button", {
        name: "Add Comment (select text first)",
        exact: true,
      })
      .click();
    await a
      .locator(".lb-composer-editor")
      .pressSequentially("Keep this quiet opening?", { delay: 85 });
    await a.getByRole("button", { name: "Send", exact: true }).click();
    await b.getByTitle("Toggle Comments Sidebar").click();
    const thread = b.locator(".lb-lexical-anchored-threads .lb-thread");
    await expect(
      thread.getByText("Keep this quiet opening?", { exact: true }),
    ).toBeVisible();
    await expect(thread.getByText("Ana", { exact: true })).toBeVisible();
    await beat(27);
    await thread.getByText("Keep this quiet opening?", { exact: true }).click();
    await b.getByTitle("Toggle Comments Sidebar").click();
    const reply = b.locator(".lb-lexical-floating-threads .lb-thread");
    await reply
      .locator(".lb-composer-editor")
      .pressSequentially("Yes, let the harbor wake slowly.", { delay: 70 });
    await reply.getByRole("button", { name: "Reply", exact: true }).click();
    await editor(b).locator("h1").click();
    await b.getByTitle("Toggle Comments Sidebar").click();
    await a.getByTitle("Toggle Comments Sidebar").click();
    const threadA = a.locator(".lb-lexical-anchored-threads .lb-thread");
    await expect(
      threadA.getByText("Yes, let the harbor wake slowly.", { exact: true }),
    ).toBeVisible();
    await expect(threadA.getByText(guest, { exact: true })).toBeVisible();
    event("reply-visible");
    await a.screenshot({ path: `${output}/step4-ana.png` });
    await b.screenshot({ path: `${output}/step4-guest.png` });
    await beat(35);
    for (const p of [a, b]) {
      await p.getByTitle("Toggle Comments Sidebar").click();
      await p.keyboard.press("Escape");
      await editor(p).locator("h1").click();
    }
    event("offline");
    await b.context().setOffline(true);
    await expect(b.getByText("Offline", { exact: true })).toBeVisible();
    await Promise.all([atEnd(a, 1), atEnd(b, 2)]);
    await Promise.all([
      a.keyboard.type(" as the tide turned", { delay: 120 }),
      b.keyboard.type(" until the sun rose", { delay: 120 }),
    ]);
    await expect(editor(a)).not.toContainText("until the sun rose");
    await expect(editor(b)).not.toContainText("as the tide turned");
    await beat(47);
    event("reconnect");
    await b.context().setOffline(false);
    await ready(b);
    for (const p of [a, b]) {
      await expect(editor(p)).toContainText("as the tide turned");
      await expect(editor(p)).toContainText("until the sun rose");
    }
    await converge(a, b);
    event("merged");
    await Promise.all([a, b].map((p) => p.mouse.move(930, 850)));
    await a.waitForTimeout(2500);
    await beat(55);
    passed = true;
  } finally {
    writeFileSync(
      `${output}/portfolio-scenario.json`,
      JSON.stringify(
        {
          passed,
          events,
          durationSeconds: (Date.now() - started) / 1000,
          finalDocuments: await Promise.all([
            state(a).catch(() => null),
            state(b).catch(() => null),
          ]),
          continuousTake: true,
        },
        null,
        2,
      ),
    );
  }
});
