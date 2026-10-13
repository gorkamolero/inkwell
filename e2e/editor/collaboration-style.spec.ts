import { writeFileSync, mkdirSync } from "node:fs";
import {
  test,
  expect,
  editor,
  ready,
  end,
  converge,
  selectPhrase,
} from "../proof/helpers";
import { output } from "../proof/rooms";

test("Style round 2 — all states, guest identity and motion", async ({
  proof: { a, b, c, url },
}) => {
  test.setTimeout(180000);
  const marks: { name: string; start: number; end: number }[] = [];
  const shot = async (p: typeof a, name: string) => {
    await p.waitForTimeout(300);
    await p.screenshot({ path: `${output}/${name}.png` });
  };
  const motion = async (name: string, action: () => Promise<void>) => {
    const cdp = await b.context().newCDPSession(b);
    const dir = `${output}/motion-frames/${name}`;
    mkdirSync(dir, { recursive: true });
    const frames: { file: string; time: number }[] = [];
    cdp.on("Page.screencastFrame", ({ data, sessionId, metadata }) => {
      const file = `${dir}/${String(frames.length).padStart(5, "0")}.png`;
      writeFileSync(file, Buffer.from(data, "base64"));
      frames.push({ file, time: metadata.timestamp * 1000 });
      void cdp.send("Page.screencastFrameAck", { sessionId });
    });
    const start = Date.now();
    await cdp.send("Page.startScreencast", {
      format: "png",
      maxWidth: 1440,
      maxHeight: 1000,
      everyNthFrame: 1,
    });
    await b.waitForTimeout(350);
    await action();
    await b.waitForTimeout(650);
    await cdp.send("Page.stopScreencast");
    const end = Date.now();
    await cdp.detach();
    writeFileSync(`${dir}/frames.json`, JSON.stringify({ start, end, frames }));
    marks.push({ name, start, end });
  };
  await c.goto(url);
  await ready(c);
  await c.setViewportSize({ width: 1440, height: 1000 });
  await end(a);
  await a.keyboard.type(
    "The morning harbor\nMara watched the lanterns shimmer across the water before the first boats returned.\nThe boats waited in the mist.\nA lantern glowed beside the gate.",
  );
  await converge(a, b);
  const box = (await editor(a).boundingBox())!;
  await c.mouse.move(box.x + 300, box.y + 200);
  await a.mouse.move(box.x + 100, box.y + 100);
  await expect(b.getByTestId("remote-pointer")).toHaveCount(2);
  await shot(b, "1440-two-pointers");
  await motion("pointer-curve", async () => {
    for (let i = 0; i <= 55; i++) {
      const t = i / 55;
      await a.mouse.move(
        box.x + 100 + 380 * t,
        box.y + 100 + 70 * Math.sin(t * Math.PI),
      );
      await a.waitForTimeout(25);
    }
  });
  await selectPhrase(a, "water");
  await end(c);
  await shot(b, "1440-caret-selection");
  await a.mouse.click(10, 10);
  await c.mouse.click(10, 10);
  await selectPhrase(b, "The boats");
  await shot(b, "1440-toolbar");
  await motion("composer-open", async () => {
    await b.getByRole("button", { name: "Comment", exact: true }).click();
  });
  await shot(b, "1440-composer-pending");
  await b.locator(".lb-composer-editor").fill("Let the harbor wake slowly.");
  await motion("pin-appear", async () => {
    await b.getByRole("button", { name: "Send", exact: true }).click();
  });
  await end(b);
  await b.mouse.move(10, 10);
  const pin = b.locator(".hotpress-comment-pin");
  await expect(pin).toBeVisible();
  await shot(b, "1440-pin-long-line-above");
  // Pin geometry must intersect neither glyphs nor the long line above.
  expect(
    await pin.evaluate((el) => {
      const p = el.getBoundingClientRect();
      const root = document.querySelector(
        '[aria-label="Collaborative Editor"]',
      )!;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        const range = document.createRange();
        range.selectNodeContents(n);
        for (const r of range.getClientRects())
          if (
            p.left < r.right &&
            p.right > r.left &&
            p.top < r.bottom &&
            p.bottom > r.top
          )
            return false;
      }
      return true;
    }),
  ).toBe(true);
  await motion("hover-preview", async () => {
    await pin.hover();
  });
  await shot(b, "1440-hover-preview");
  await b.mouse.move(10, 10);
  await pin.focus();
  await shot(b, "1440-focus");
  await motion("popover-open-close", async () => {
    await pin.click();
    await b.waitForTimeout(650);
    await b.keyboard.press("Escape");
  });
  await pin.click();
  const pop = b.locator(".hotpress-comment-popover");
  const guest = (
    await b.getByTitle("Click to change your name").locator("span").innerText()
  ).trim();
  await pop
    .locator(".lb-composer-editor")
    .fill("Yes, give this moment room to breathe.");
  await pop.getByRole("button", { name: "Reply", exact: true }).click();
  for (const p of [a, b]) {
    if (p === a) await p.locator(".hotpress-comment-pin").click();
    await expect(
      p.locator(".lb-thread .lb-user").filter({ hasText: guest }),
    ).toHaveCount(2);
    await shot(p, `1440-popover-reply-${p === a ? "owner" : "guest"}`);
  }
  await a.keyboard.press("Escape");
  await b.keyboard.press("Escape");
  await b.mouse.click(10, 10);
  await b.setViewportSize({ width: 390, height: 844 });
  await shot(b, "390-pin-long-line-above");
  await selectPhrase(a, "water");
  await c.mouse.click(10, 10);
  await shot(b, "390-caret-selection-no-pointers");
  await a.mouse.click(10, 10);
  await selectPhrase(b, "lantern");
  await shot(b, "390-toolbar");
  await b.getByRole("button", { name: "Comment", exact: true }).click();
  await shot(b, "390-composer-pending");
  await b.keyboard.press("Escape");
  await end(b);
  await motion("phone-sheet-open-close", async () => {
    await pin.click();
    await b.waitForTimeout(650);
    await b.mouse.click(10, 200);
  });
  await expect(pop).toHaveCount(0);
  await pin.click();
  await shot(b, "390-sheet-reply-guest");
  await b.evaluate(() => {
    const vv = window.visualViewport!;
    Object.defineProperty(vv, "height", { configurable: true, value: 450 });
    vv.dispatchEvent(new Event("resize"));
  });
  await expect
    .poll(
      async () => (await pop.locator(".lb-composer-editor").boundingBox())!.y,
    )
    .toBeLessThan(450);
  await shot(b, "390-sheet-keyboard-inset");
  await b.evaluate(() => {
    const vv = window.visualViewport!;
    delete (vv as unknown as { height?: number }).height;
    vv.dispatchEvent(new Event("resize"));
  });
  await end(a);
  await c.mouse.click(10, 10);
  await a.setViewportSize({ width: 390, height: 844 });
  await a.locator(".hotpress-comment-pin").click();
  await shot(a, "390-sheet-reply-owner");
  expect(await b.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await pop
    .getByRole("button", { name: "Resolve thread", exact: true })
    .click();
  await expect(pin).toHaveCount(0);
  await shot(b, "390-resolved");
  await a.setViewportSize({ width: 1440, height: 1000 });
  await expect(a.locator(".hotpress-comment-pin")).toHaveCount(0);
  await shot(a, "1440-resolved");
  writeFileSync(`${output}/motion-marks.json`, JSON.stringify(marks, null, 2));
});
