import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync } from "node:fs";
import { test, expect, editor, ready, append, converge, end, comment, selectPhrase } from "../proof/helpers";
import { output } from "../proof/rooms";

test.describe("Video — real two-person scenario", () => {
  test("record a real paced collaboration session", async ({ proof: { a, b, url } }) => {
    test.setTimeout(100000);
    const started = Date.now();
    const evidence = {
      commentsVerified: false, offlineVerified: false, differentParagraphsVerified: false,
      sameSentenceVerified: false, errors: [] as string[],
      events: [] as { name: string; seconds: number }[],
    };
    const event = (name: string) => evidence.events.push({ name, seconds: (Date.now() - started) / 1000 });
    const beat = async (seconds: number) => {
      const remaining = started + seconds * 1000 - Date.now();
      if (remaining > 0) await a.waitForTimeout(remaining);
    };
    const readable = async (p: typeof a) => p.addStyleTag({ content: `
      [aria-label="Collaborative Editor"] { font-size: 20px !important; line-height: 1.5 !important; }
      .lb-comment-body, .lb-composer-editor { font-size: 16px !important; }
    ` });
    const paragraphEnd = async (p: typeof a, index: number) => {
      await editor(p).locator("p").nth(index).click();
      await p.keyboard.press("End");
    };
    try {
      await readable(a);
      await end(a);
      await a.keyboard.type("Our story begins by the sea.\nA: \nB: ", { delay: 55 });
      await b.goto(url); // The guest actually enters through the share link on camera.
      await ready(b);
      await readable(b);
      await converge(a, b);
      event("B joined through share link");
      await beat(7);
      await Promise.all([paragraphEnd(a, 1), paragraphEnd(b, 2)]);
      await Promise.all([
        a.keyboard.type("Warm sunlight fills the harbor.", { delay: 85 }),
        b.keyboard.type("Gentle waves reach the shore.", { delay: 95 }),
      ]);
      await converge(a, b);
      await expect(editor(a)).toContainText("Warm sunlight fills the harbor.");
      await expect(editor(a)).toContainText("Gentle waves reach the shore.");
      evidence.differentParagraphsVerified = true;
      const guest = (await b.getByTitle("Click to change your name").locator("span").innerText()).trim();
      await expect(a.getByTitle(guest, { exact: true })).toBeVisible();
      await expect(b.getByTitle("Writer A", { exact: true })).toBeVisible();
      await expect(a.locator(".lb-lexical-cursors").getByText(guest, { exact: true })).toBeVisible();
      await expect(b.locator(".lb-lexical-cursors").getByText("Writer A", { exact: true })).toBeVisible();
      event("different paragraphs and both cursors verified");
      await beat(13);
      await Promise.all([selectPhrase(a, "story"), selectPhrase(b, "sea")]);
      await Promise.all([a.keyboard.press("ArrowLeft"), b.keyboard.press("ArrowLeft")]);
      await Promise.all([
        a.keyboard.type("shared ", { delay: 120 }),
        b.keyboard.type("quiet ", { delay: 120 }),
      ]);
      await converge(a, b);
      await expect(editor(a)).toContainText("Our shared story begins by the quiet sea.");
      evidence.sameSentenceVerified = true;
      event("same sentence edits merged");
      await beat(18);
      await comment(a, "shared story", "Shall we keep this opening?");
      await b.getByTitle("Toggle Comments Sidebar").click();
      const thread = b.locator(".lb-lexical-anchored-threads .lb-thread");
      await expect(thread.getByText("Shall we keep this opening?", { exact: true })).toBeVisible();
      event("B saw A's comment");
      await beat(23);
      await thread.getByText("Shall we keep this opening?", { exact: true }).click();
      await thread.locator(".lb-composer-editor").pressSequentially("Yes, it sets the scene.", { delay: 75 });
      await thread.getByRole("button", { name: "Reply", exact: true }).click();
      await a.getByTitle("Toggle Comments Sidebar").click();
      await expect(a.locator(".lb-lexical-anchored-threads").getByText("Yes, it sets the scene.", { exact: true })).toBeVisible();
      evidence.commentsVerified = true;
      event("A saw B's reply");
      await beat(30);
      for (const p of [a, b]) {
        await p.getByTitle("Toggle Comments Sidebar").click();
        await p.keyboard.press("Escape");
      }
      await b.context().setOffline(true);
      const offlineAt = Date.now();
      await expect(b.getByText("Offline", { exact: true })).toBeVisible();
      event("B offline");
      await Promise.all([paragraphEnd(a, 1), paragraphEnd(b, 2)]);
      await Promise.all([
        a.keyboard.type(" A continued online.", { delay: 85 }),
        b.keyboard.type(" B kept writing offline.", { delay: 90 }),
      ]);
      await expect(editor(a)).not.toContainText("B kept writing offline.");
      await expect(editor(b)).not.toContainText("A continued online.");
      await b.waitForTimeout(Math.max(0, 9000 - (Date.now() - offlineAt)));
      await b.context().setOffline(false);
      event("B reconnecting after nine seconds");
      for (const p of [a, b]) for (const phrase of ["B kept writing offline.", "A continued online."])
        await expect(editor(p)).toContainText(phrase, { timeout: 15000 });
      await converge(a, b);
      await ready(b);
      evidence.offlineVerified = true;
      event("both offline-period edits merged");
      await beat(50);
    } catch (error) {
      evidence.errors.push("Scenario failed; see the test report and actual footage.");
      throw error;
    } finally {
      writeFileSync(`${output}/video-scenario-v2.json`, JSON.stringify({
        scenarioSeconds: (Date.now() - started) / 1000, paced: true, mockedTransport: false, ...evidence,
      }, null, 2));
    }
  });
  test.afterAll(() => {
    execFileSync("node", ["e2e/proof/compose-video.mjs"], { stdio: "inherit" });
    const { durationSeconds } = JSON.parse(readFileSync(`${output}/video-duration-v2.json`, "utf8"));
    expect(durationSeconds).toBeGreaterThanOrEqual(40);
    expect(durationSeconds).toBeLessThanOrEqual(60);
  });
});
