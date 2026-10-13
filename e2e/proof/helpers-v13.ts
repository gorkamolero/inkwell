import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { test as base, expect, type Page } from "@playwright/test";
import postgres from "postgres";
import { authorColor } from "../../src/lib/collaboration-identity";
import { createSharedSessionViaApi } from "../fixtures/liveblocks-helpers";
import { setupAuthBeforeNavigation } from "../utils/auth-helpers";
import { output } from "./rooms";
export const editor = (p: Page) =>
  p.getByRole("textbox", { name: "Collaborative Editor", exact: true });
export async function ready(p: Page) {
  await expect(editor(p)).toBeVisible();
  await expect(p.getByText("Live", { exact: true })).toBeVisible({
    timeout: 30000,
  });
}
export async function state(p: Page) {
  return editor(p).evaluate((el) =>
    (el as any).__lexicalEditor.getEditorState().toJSON(),
  );
}
export async function converge(a: Page, b: Page) {
  await expect
    .poll(
      async () => {
        const [left, right] = await Promise.all([state(a), state(b)]);
        return JSON.stringify(left) === JSON.stringify(right);
      },
      { timeout: 20000 },
    )
    .toBe(true);
}
export async function end(p: Page) {
  await editor(p).click();
  await p.keyboard.press("ControlOrMeta+a");
  await p.keyboard.press("ArrowRight");
}
type Proof = { a: Page; b: Page; c: Page; id: string; url: string };
export const test = base.extend<{ proof: Proof }>({
  proof: async ({ browser }, use, info) => {
    const style = info.title.includes("Style round 2");
    const recording = info.title.includes("record a real");
    const portfolio = info.title.includes("portfolio");
    const contexts = await Promise.all(
      [0, 1, 2].map((i) =>
        browser.newContext({
          deviceScaleFactor: 2,
          viewport: style
            ? { width: 1440, height: 1000 }
            : portfolio
              ? { width: 872, height: 800 }
              : { width: 1280, height: recording ? 600 : 800 },
        }),
      ),
    );
    const [a, b, c] = await Promise.all(contexts.map((ctx) => ctx.newPage()));
    for (const ctx of contexts)
      await ctx.route("**/*", (route) => {
        const url = new URL(route.request().url());
        return url.hostname === "hotpress.app" ||
          url.hostname.endsWith(".hotpress.app")
          ? route.abort()
          : route.continue();
      });
    const browserErrors: string[] = [];
    const authorizationFailures: string[] = [];
    for (const p of [a, b, c]) {
      p.on("response", async (response) => {
        try {
          const url = new URL(response.url());
          if (url.pathname === "/api/liveblocks-auth" && response.ok()) {
            const body = await response.json();
            const payload = JSON.parse(
              Buffer.from(body.token.split(".")[1], "base64url").toString(),
            );
            const requestedRoom = response.request().postDataJSON()?.room;
            console.log(
              "Granted room permissions",
              ["A", "B", "C"][[a, b, c].indexOf(p)],
              requestedRoom,
              payload.perms?.[requestedRoom],
            );
          }
          if (
            url.hostname.endsWith("liveblocks.io") &&
            response.status() >= 400
          ) {
            const body = await response.json().catch(() => ({}));
            // Log only the service's error enum; never arbitrary bodies or headers.
            const errorCode =
              typeof body.error === "string" && /^[A-Z_]+$/.test(body.error)
                ? body.error
                : "UNCLASSIFIED";
            const bearer = response
              .request()
              .headers()
              ["authorization"]?.split(" ")[1];
            const tokenKind = bearer
              ? JSON.parse(
                  Buffer.from(bearer.split(".")[1], "base64url").toString(),
                ).k
              : "none";
            if ([401, 403].includes(response.status()))
              authorizationFailures.push(
                `${response.request().method()} ${url.pathname}: ${response.status()}`,
              );
            console.log(
              "Liveblocks HTTP failure",
              tokenKind,
              ["A", "B", "C"][[a, b, c].indexOf(p)],
              response.request().method(),
              response.status(),
              url.pathname,
              errorCode,
            );
          }
        } catch {
          /* A closing page may make diagnostic response bodies unavailable. */
        }
      });
      p.on("pageerror", (error) => {
        browserErrors.push(
          error.message.replace(/eyJ[A-Za-z0-9_.-]+/g, "[redacted]"),
        );
        console.log(
          "Browser error",
          error.message.includes("LexicalComposerContext")
            ? "Missing Lexical context"
            : error.message.includes("thread")
              ? "Thread fetch/render failed"
              : error.stack?.replace(/eyJ[A-Za-z0-9_.-]+/g, "[redacted]"),
        );
      });
    }
    const ids = [randomUUID(), randomUUID()].map((id) => `proof-${id}`);
    if (/portfolio v(?:[678]|11|13|20)/.test(info.title))
      while (authorColor(ids[0]) !== "#15803D") ids[0] += "-c";
    if (style)
      while (authorColor(ids[0]) === authorColor(ids[1])) ids[1] += "-c";
    const dbUrl = new URL(process.env.DATABASE_URL!);
    if (
      !["localhost", "127.0.0.1"].includes(dbUrl.hostname) ||
      dbUrl.pathname !== "/inkwell"
    )
      throw new Error("Proof requires local inkwell database");
    const sql = postgres(process.env.DATABASE_URL!, { onnotice: () => {} });
    try {
      for (const [index, page] of [a, c].entries()) {
        const user = {
          id: ids[index],
          name: index === 0 ? (portfolio ? "Ana" : "Writer A") : "Writer C",
          email: `${ids[index]}@example.invalid`,
          image: "",
          login: ids[index],
          accessToken: "",
        };
        await sql`insert into "user" (id, name, email) values (${user.id}, ${user.name}, ${user.email})`;
        await setupAuthBeforeNavigation(page, user);
        await page.unroute("**/api/auth/session"); // exercise real NextAuth response with the minted cookie
      }
      const session = await createSharedSessionViaApi(a);
      await ready(a);
      if (!recording) {
        await b.goto(session.url);
        await ready(b);
      }
      await use({ a, b, c, id: session.sessionId, url: session.url });
      if (
        recording &&
        !portfolio &&
        (browserErrors.length || authorizationFailures.length)
      ) {
        const path = `${output}/video-scenario-v2.json`;
        const scenario = JSON.parse(readFileSync(path, "utf8"));
        scenario.errors.push(
          "Browser or authorization errors occurred; see the test report.",
        );
        writeFileSync(path, JSON.stringify(scenario, null, 2));
      }
      if (portfolio && (browserErrors.length || authorizationFailures.length)) {
        const path = `${output}/portfolio-scenario.json`;
        const scenario = JSON.parse(readFileSync(path, "utf8"));
        scenario.passed = false;
        scenario.errors = [
          "Browser or authorization error; do not publish this take.",
        ];
        writeFileSync(path, JSON.stringify(scenario, null, 2));
      }
      expect(
        browserErrors,
        "Browser errors can interrupt the Lexical/Yjs listener chain",
      ).toEqual([]);
      expect(
        authorizationFailures,
        "No mounted feature may silently fail authorization",
      ).toEqual([]);
    } finally {
      if (info.status !== info.expectedStatus) {
        const states = await Promise.all(
          [a, b].map(async (p) => ({
            lexical: await state(p).catch(() => null),
            yjs: await p
              .evaluate(() => (window as any).__collaborationSnapshot?.())
              .catch(() => null),
          })),
        );
        writeFileSync(
          `${output}/failed-states-${process.env.HOTPRESS_PROOF_RUN_ID}-${info.testId.replace(/[^a-zA-Z0-9]/g, "")}.json`,
          JSON.stringify(states, null, 2),
        );
        for (const [i, p] of [a, b, c].entries())
          if (!p.isClosed() && p.url() !== "about:blank") {
            await info
              .attach(`person-${i}`, {
                body: await p.screenshot(),
                contentType: "image/png",
              })
              .catch(() => {});
            await info
              .attach(`dom-${i}`, {
                body: await p.locator("body").innerText(),
                contentType: "text/plain",
              })
              .catch(() => {});
          }
      }
      await Promise.all(contexts.map((ctx) => ctx.close()));
      if (style) {
        writeFileSync(
          `${output}/style-video-end.json`,
          JSON.stringify({ end: Date.now() }),
        );
        await a.video()!.saveAs(`${output}/style-owner-raw.webm`);
        await b.video()!.saveAs(`${output}/style-guest-raw.webm`);
      }
      for (const id of ids) await sql`delete from "user" where id = ${id}`;
      await sql.end();
    }
  },
});
test.use({ actionTimeout: 15000, navigationTimeout: 30000 });
export { expect };
