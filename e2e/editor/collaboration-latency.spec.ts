import { writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import {
  test,
  expect,
  append,
  converge,
  end,
  selectPhrase,
} from "../proof/helpers";
import { output } from "../proof/rooms";
function stats(raw: number[]) {
  const sorted = [...raw].sort((a, b) => a - b);
  return {
    rawMs: raw,
    medianMs: raw.length
      ? (sorted[(raw.length - 1) >> 1] + sorted[raw.length >> 1]) / 2
      : null,
    p95Ms: raw.length ? sorted[Math.ceil(raw.length * 0.95) - 1] : null,
  };
}
test.describe("Measure — real remote DOM observation latency", () => {
  test("30 edits and 10 comment attempts, no mocked transport", async ({
    proof: { a, b, id },
  }) => {
    test.setTimeout(180000);
    const edits: number[] = [],
      comments: number[] = [];
    const attempts: {
      run: number;
      httpStatus: number;
      latencyMs: number | null;
    }[] = [];
    const save = () => {
      const json = JSON.stringify(
        {
          measuredAt: new Date().toISOString(),
          roomId: id,
          method:
            "Node monotonic clock from input dispatch through remote DOM observation (requestAnimationFrame); includes automation overhead. p95 nearest rank.",
          edits: stats(edits),
          comments: { ...stats(comments), attempts },
        },
        null,
        2,
      );
      writeFileSync(
        `${output}/latency-${process.env.HOTPRESS_PROOF_RUN_ID}.json`,
        json,
      );
      writeFileSync(`${output}/latency.json`, json);
    };
    await append(a, "Latency document. ");
    await converge(a, b);
    for (let i = 0; i < 30; i++) {
      await end(a);
      const marker = ` [edit-${i.toString().padStart(2, "0")}]`;
      const start = performance.now();
      await a.keyboard.insertText(marker);
      await b.waitForFunction(
        (marker) =>
          document
            .querySelector('[role="textbox"][contenteditable="true"]')
            ?.textContent?.includes(marker),
        marker,
        { polling: "raf" },
      );
      edits.push(performance.now() - start);
      save();
    }
    await a.screenshot({ path: `${output}/latency-before-comments.png` });
    await b.getByTitle("Toggle Comments Sidebar").click();
    for (let i = 0; i < 10; i++) {
      await append(a, ` Latency anchor ${i}.`);
      await converge(a, b);
      await selectPhrase(a, `Latency anchor ${i}.`);
      await a
        .getByRole("button", {
          name: "Add Comment (select text first)",
          exact: true,
        })
        .click();
      await a.locator(".lb-composer-editor").fill(`Latency comment ${i}`);
      const responsePromise = a.waitForResponse(
        (r) =>
          new URL(r.url()).hostname.endsWith("liveblocks.io") &&
          new URL(r.url()).pathname.endsWith("/threads") &&
          r.request().method() === "POST",
        { timeout: 15000 },
      );
      const start = performance.now();
      await a.getByRole("button", { name: "Send", exact: true }).click();
      const response = await responsePromise;
      let latencyMs: number | null = null;
      if (response.ok()) {
        await b.waitForFunction(
          (text) =>
            [...document.querySelectorAll(".lb-comment-body")].some(
              (el) => el.textContent === text,
            ),
          `Latency comment ${i}`,
          { polling: "raf", timeout: 15000 },
        );
        latencyMs = performance.now() - start;
        comments.push(latencyMs);
        await b
          .locator(".lb-lexical-anchored-threads")
          .getByRole("button", { name: "Resolve thread", exact: true })
          .click();
      } else {
        await expect(
          a.getByText(`Latency comment ${i}`, { exact: true }),
        ).toHaveCount(0);
      }
      attempts.push({ run: i + 1, httpStatus: response.status(), latencyMs });
      save();
    }
    expect(
      comments,
      "Every comment must actually appear on the other browser to count as a latency sample",
    ).toHaveLength(10);
  });
});
