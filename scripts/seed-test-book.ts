/**
 * Seeds a test book session for PDF preview testing
 * Run with: pnpm tsx scripts/seed-test-book.ts
 */

import { createId } from "@paralleldrive/cuid2";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { writingSessions } from "../src/lib/db/schema";
import { getDefaultConfig } from "../src/lib/format-schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL not set - run with: pnpm tsx scripts/seed-test-book.ts");
}

const client = postgres(DATABASE_URL);
const db = drizzle(client);

const sampleContent = {
  root: {
    children: [
      {
        children: [{ detail: 0, format: 0, mode: "normal", style: "", text: "# The Midnight Garden", type: "text", version: 1 }],
        direction: "ltr", format: "", indent: 0, type: "paragraph", version: 1
      },
      {
        children: [{ detail: 0, format: 0, mode: "normal", style: "", text: "The garden came alive at midnight, when the moon cast silver shadows across the ancient stone paths. Eleanor had discovered this secret years ago, when she was just a child sneaking out of her grandmother's cottage.", type: "text", version: 1 }],
        direction: "ltr", format: "", indent: 0, type: "paragraph", version: 1
      },
      {
        children: [{ detail: 0, format: 0, mode: "normal", style: "", text: "Now, at twenty-three, she returned to find the garden unchanged—the roses still bloomed in impossible colors, the fountain still sang its haunting melody, and the statues still watched with knowing eyes.", type: "text", version: 1 }],
        direction: "ltr", format: "", indent: 0, type: "paragraph", version: 1
      },
      {
        children: [{ detail: 0, format: 0, mode: "normal", style: "", text: "---", type: "text", version: 1 }],
        direction: "ltr", format: "", indent: 0, type: "paragraph", version: 1
      },
      {
        children: [{ detail: 0, format: 0, mode: "normal", style: "", text: "She followed the familiar path to the heart of the garden, where the great willow tree wept into a pond of starlight. Here, she had first met him—the gardener who wasn't quite human.", type: "text", version: 1 }],
        direction: "ltr", format: "", indent: 0, type: "paragraph", version: 1
      },
      {
        children: [{ detail: 0, format: 0, mode: "normal", style: "", text: "\"You've returned,\" a voice said from the shadows. \"I wondered if you would.\"", type: "text", version: 1 }],
        direction: "ltr", format: "", indent: 0, type: "paragraph", version: 1
      },
      {
        children: [{ detail: 0, format: 0, mode: "normal", style: "", text: "# Chapter Two: The Bargain", type: "text", version: 1 }],
        direction: "ltr", format: "", indent: 0, type: "paragraph", version: 1
      },
      {
        children: [{ detail: 0, format: 0, mode: "normal", style: "", text: "The gardener stepped into the moonlight, and Eleanor caught her breath. He looked exactly as she remembered—tall and lean, with eyes like polished amber and hair the color of autumn leaves.", type: "text", version: 1 }],
        direction: "ltr", format: "", indent: 0, type: "paragraph", version: 1
      },
      {
        children: [{ detail: 0, format: 0, mode: "normal", style: "", text: "\"I need your help,\" she said, her voice steadier than she felt. \"My grandmother is dying, and the doctors say there's nothing they can do.\"", type: "text", version: 1 }],
        direction: "ltr", format: "", indent: 0, type: "paragraph", version: 1
      },
      {
        children: [{ detail: 0, format: 0, mode: "normal", style: "", text: "He tilted his head, considering. \"And you remember what I told you, all those years ago? That magic always has a price?\"", type: "text", version: 1 }],
        direction: "ltr", format: "", indent: 0, type: "paragraph", version: 1
      },
      {
        children: [{ detail: 0, format: 0, mode: "normal", style: "", text: "\"I remember,\" Eleanor said. \"And I'm willing to pay it.\"", type: "text", version: 1 }],
        direction: "ltr", format: "", indent: 0, type: "paragraph", version: 1
      }
    ],
    direction: "ltr", format: "", indent: 0, type: "root", version: 1
  }
};

async function main() {
  const sessionId = createId();
  const shareSlug = createId().slice(0, 10).toLowerCase();
  const config = getDefaultConfig("book");

  // Update metadata in config
  (config as any).meta.title = "The Midnight Garden";
  (config as any).meta.subtitle = "A Novel of Magic and Memory";
  (config as any).meta.author = "Eleanor Blackwood";
  (config as any).meta.series = { name: "The Garden Chronicles", number: 1 };
  (config as any).meta.isbn = "978-0-123456-78-9";

  // Add front matter
  (config as any).frontMatter = [
    { type: "halfTitle" },
    { type: "title", includeSubtitle: true, includeAuthor: true },
    { type: "copyright", template: "fiction" },
    { type: "dedication", content: "For my grandmother,\nwho first showed me the garden.", align: "center" },
    { type: "epigraph", quote: "All that we see or seem is but a dream within a dream.", attribution: "Edgar Allan Poe" },
    { type: "toc", depth: 1 },
  ];

  // Add back matter
  (config as any).backMatter = [
    { type: "acknowledgements", content: "I would like to thank my editor, my agent, and everyone who believed in this story from the beginning.\n\nSpecial thanks to the midnight gardeners everywhere." },
    { type: "aboutAuthor", content: "Eleanor Blackwood lives in a small cottage surrounded by roses that bloom in impossible colors. When not writing, she tends to her garden and listens to the stories the statues tell." },
    { type: "alsoBy", books: [{ title: "The Weeping Willow" }, { title: "Starlight Pond" }, { title: "The Amber-Eyed Gardener" }] },
  ];

  await db.insert(writingSessions).values({
    id: sessionId,
    shareSlug: shareSlug,
    title: "The Midnight Garden",
    type: "book",
    content: JSON.stringify(sampleContent),
    formatConfig: config as any,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  console.log("\n✅ Created test book session!\n");
  console.log("Session ID:", sessionId);
  console.log("Share slug:", shareSlug);
  console.log("\n📖 Open in browser:");
  console.log(`   http://localhost:3000/s/${shareSlug}`);
  console.log("\n🔧 Test preview API:");
  console.log(`   curl -X POST http://localhost:3000/api/sessions/${sessionId}/preview -H 'Content-Type: application/json' -d '{"quality":"preview"}'`);

  await client.end();
}

main().catch(console.error);
