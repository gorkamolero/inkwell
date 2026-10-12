import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync } from "node:fs";
import {
  test,
  expect,
  editor,
  append,
  converge,
  end,
  comment,
} from "../proof/helpers";
import { output } from "../proof/rooms";
test.describe("Video — real two-person scenario", () => {
  test("record a real paced collaboration session", async ({
    proof: { a, b },
  }) => {
    test.setTimeout(90000);
    const started = Date.now();
    const evidence = {
      commentsVerified: false,
      offlineVerified: false,
      commentHttpStatus: null as number | null,
      errors: [] as string[],
      events: [] as { name: string; seconds: number }[],
    };
    const event = (name: string) =>
      evidence.events.push({ name, seconds: (Date.now() - started) / 1000 });
    const beat = async (seconds: number) => {
      const remaining = started + seconds * 1000 - Date.now();
      if (remaining > 0) await a.waitForTimeout(remaining);
    };
    try {
      await append(a, "Our story begins by the sea. ");
      await converge(a, b);
      await beat(3);
      await Promise.all([end(a), end(b)]);
      await Promise.all([
        a.keyboard.type("Warm sunlight. ", { delay: 75 }),
        b.keyboard.type("Gentle waves. ", { delay: 90 }),
      ]);
      await converge(a, b);
      event("concurrent edits converged");
      const guest = (
        await b
          .getByTitle("Click to change your name")
          .locator("span")
          .innerText()
      ).trim();
      await expect(
        a.locator(".lb-lexical-cursors").getByText(guest, { exact: true }),
      ).toBeVisible();
      await expect(
        b.locator(".lb-lexical-cursors").getByText("Writer A", { exact: true }),
      ).toBeVisible();
      await beat(9);
      try {
        const responsePromise = a.waitForResponse(
          (r) =>
            new URL(r.url()).hostname.endsWith("liveblocks.io") &&
            new URL(r.url()).pathname.endsWith("/threads") &&
            r.request().method() === "POST",
          { timeout: 10000 },
        );
        await comment(a, "Our story", "Shall we keep this opening?");
        const response = await responsePromise;
        evidence.commentHttpStatus = response.status();
        event("comment submitted");
        await b.getByTitle("Toggle Comments Sidebar").click();
        if (!response.ok())
          throw new Error(`Comment rejected: HTTP ${response.status()}`);
        const thread = b.locator(".lb-lexical-anchored-threads .lb-thread");
        await expect(
          thread.getByText("Shall we keep this opening?", { exact: true }),
        ).toBeVisible({ timeout: 5000 });
        await beat(14);
        await thread
          .getByText("Shall we keep this opening?", { exact: true })
          .click();
        await thread
          .locator(".lb-composer-editor")
          .fill("Yes, it sets the scene.");
        await thread
          .getByRole("button", { name: "Reply", exact: true })
          .click();
        await a.getByTitle("Toggle Comments Sidebar").click();
        await expect(
          a
            .locator(".lb-lexical-anchored-threads")
            .getByText("Yes, it sets the scene.", { exact: true }),
        ).toBeVisible({ timeout: 5000 });
        await a.getByTitle("Toggle Comments Sidebar").click();
        evidence.commentsVerified = true;
        event("reply verified");
      } catch {
        evidence.errors.push(
          `Comments/reply not verified (submission HTTP ${evidence.commentHttpStatus ?? "unknown"}); see network log`,
        );
      }
      await beat(20);
      if (
        await b
          .getByRole("heading", { name: "Comments", exact: true })
          .isVisible()
      )
        await b.getByTitle("Toggle Comments Sidebar").click();
      if (
        await a
          .getByRole("heading", { name: "Comments", exact: true })
          .isVisible()
      )
        await a.getByTitle("Toggle Comments Sidebar").click();
      await a.keyboard.press("Escape");
      await b.keyboard.press("Escape");
      await b.context().setOffline(true);
      event("B offline");
      await append(b, " B kept writing offline.");
      await append(a, " A continued online.");
      await expect(editor(a)).not.toContainText("B kept writing offline.");
      await expect(editor(b)).not.toContainText("A continued online.");
      await beat(28);
      await b.context().setOffline(false);
      event("B reconnecting");
      for (const p of [a, b])
        for (const phrase of ["B kept writing offline.", "A continued online."])
          await expect(editor(p)).toContainText(phrase, { timeout: 10000 });
      await converge(a, b);
      evidence.offlineVerified = true;
      event("offline edits converged");
      await Promise.all([end(a), end(b)]);
      await beat(36);
    } finally {
      if (!evidence.offlineVerified)
        evidence.errors.push(
          "Offline/reconnect not verified; inspect the saved state pair and test failure",
        );
      writeFileSync(
        `${output}/video-scenario.json`,
        JSON.stringify(
          {
            scenarioSeconds: (Date.now() - started) / 1000,
            rawRecordingsIncludeSetup: true,
            paced: true,
            mockedTransport: false,
            ...evidence,
          },
          null,
          2,
        ),
      );
    }
    expect(
      evidence.commentsVerified,
      "The footage is explicitly labelled partial if comments fail",
    ).toBe(true);
  });
  test.afterAll(() => {
    execFileSync("node", ["e2e/proof/compose-video.mjs"], { stdio: "inherit" });
    const { durationSeconds } = JSON.parse(
      readFileSync(`${output}/video-duration.json`, "utf8"),
    );
    expect(durationSeconds).toBeGreaterThanOrEqual(30);
    expect(durationSeconds).toBeLessThanOrEqual(50);
  });
});
