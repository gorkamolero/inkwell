# Hotpress Demo Video Spec

**Goal:** Automated 60-90 second demo video showing 3 writers collaborating in real-time, with PDF regenerating on save.

**Content:** "Dead Channels" — field notes from the abandoned internet

---

## The Content: Dead Channels

### Title Page
```
DEAD CHANNELS
Field Notes from the Abandoned Internet

By Alex Chen, Jordan Reyes, Sam Okonkwo
```

### Chapter 1: The Forum That Forgot Itself
*Written by: Alex*

```
Last post: March 14, 2009

We found it through a broken link on a broken link. A forum for regional 
weather enthusiasts in central Ohio — 4,847 posts about cloud formations, 
barometric pressure, the smell before rain.

Then silence.

The admin's final message, pinned for fifteen years: "Server costs due next 
month. Anyone want to chip in?" 

No replies. No one.

The weather kept happening without them.
```

### Chapter 2: The Geocities Graveyard
*Written by: Jordan*

```
Archived: October 26, 2009

Blinking GIFs. Guestbooks signed by ghosts. "Welcome to my homepage!" — 
pages that welcomed no one for fifteen years.

We found:
- Someone's cat named Whiskers (1994-2007, "best friend ever")
- Wedding photos from 1998, the bride's face pixelated by time
- A shrine to Buffy the Vampire Slayer, "UNDER CONSTRUCTION" since 2001
- A kid's poetry about Y2K fears that never came true

All preserved in digital amber. Frozen mid-sentence.

The internet's Pompeii, still loading.
```

### Chapter 3: The Chatroom That Never Closed
*Written by: Sam*

```
Status: Online

It's still running. A Java applet on a .edu server that no one maintains. 
Computer Science department, small liberal arts college, somewhere in Vermont.

We logged in. 

Empty. 

But the "Users Online" counter shows 3. It has shown 3 since 2011. We checked 
the Wayback Machine. Always 3.

We typed "hello" and watched it echo into nothing.

Somewhere, a server hums. Waiting.
```

### Chapter 4: The Abandoned MMO
*Written by: Alex + Jordan*

```
Peak players: 12,847 (December 2006)
Current players: 1

The fantasy kingdom of Aethermoor still exists. The servers still run — 
someone pays the bills, no one knows who. 

NPCs still offer quests. Shop inventories refresh daily. Seasons change.
The auction house has 200,000 listings from players who will never return.

We created characters. Walked through empty cities built for thousands.
Found a player — "DarkLord1994" — standing in the town square.

AFK since 2019. Still logged in. 

His character breathes. Blinks. Waits for a command that won't come.

We /waved. No response. We left him there.

The kingdom endures.
```

### Chapter 5: Signing Off
*Written by: All three*

```
These places exist in the spaces between.

Not dead — undead. Servers humming, data persisting, pages loading for 
no one. Digital ghosts running on autopilot.

We document them because someone should. Because every abandoned forum 
was once someone's community. Every dead homepage was someone's pride.

The internet doesn't forget. It just stops paying attention.

We're still looking. 

More field notes to come.

— A, J, S
```

---

## Technical Spec: Playwright Automation

### Prerequisites
```bash
npm install playwright @playwright/test
npx playwright install chromium
```

### Test Accounts Needed
| User | Email | Display Name |
|------|-------|--------------|
| User 1 | alex@test.hotpress.app | Alex Chen |
| User 2 | jordan@test.hotpress.app | Jordan Reyes |
| User 3 | sam@test.hotpress.app | Sam Okonkwo |

### Script Structure

```typescript
// demo-video.ts
import { chromium, Browser, Page } from 'playwright';

const HOTPRESS_URL = 'https://hotpress.app';
const DOCUMENT_ID = 'demo-dead-channels'; // create this first

const USERS = [
  { email: 'alex@test.hotpress.app', password: '...', name: 'Alex' },
  { email: 'jordan@test.hotpress.app', password: '...', name: 'Jordan' },
  { email: 'sam@test.hotpress.app', password: '...', name: 'Sam' },
];

async function main() {
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--window-size=1920,1080']
  });

  // Create 3 browser contexts (isolated sessions)
  const contexts = await Promise.all(
    USERS.map(u => browser.newContext({ 
      viewport: { width: 1920, height: 1080 },
      recordVideo: { dir: './recordings' }
    }))
  );

  const pages = await Promise.all(contexts.map(c => c.newPage()));

  // Login all users
  for (let i = 0; i < USERS.length; i++) {
    await login(pages[i], USERS[i]);
  }

  // Navigate all to the same document
  for (const page of pages) {
    await page.goto(`${HOTPRESS_URL}/doc/${DOCUMENT_ID}`);
  }

  // Wait for Liveblocks to connect
  await Promise.all(pages.map(p => p.waitForTimeout(2000)));

  // === CHOREOGRAPHED TYPING SEQUENCE ===
  
  // Scene 1: Alex types Chapter 1 title
  await typeWithDelay(pages[0], '# Chapter 1: The Forum That Forgot Itself\n\n');
  await pages[0].waitForTimeout(500);

  // Scene 2: Alex types opening paragraph
  await typeWithDelay(pages[0], 'Last post: March 14, 2009\n\n');
  await typeWithDelay(pages[0], 'We found it through a broken link on a broken link...');
  
  // Scene 3: Jordan starts Chapter 2 (simultaneous)
  await typeWithDelay(pages[1], '\n\n# Chapter 2: The Geocities Graveyard\n\n');
  
  // ... continue choreography ...

  // Final: Show PDF regeneration
  await pages[0].click('[data-testid="export-pdf"]'); // adjust selector
  await pages[0].waitForTimeout(3000); // dramatic pause

  // Cleanup
  await browser.close();
}

async function login(page: Page, user: typeof USERS[0]) {
  await page.goto(`${HOTPRESS_URL}/login`);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
}

async function typeWithDelay(page: Page, text: string, delay = 50) {
  // Type character by character for realistic effect
  for (const char of text) {
    await page.keyboard.type(char, { delay });
  }
}

main();
```

### Recording Setup

**Option A: Playwright's built-in recording**
```typescript
const context = await browser.newContext({
  recordVideo: { dir: './recordings', size: { width: 1920, height: 1080 } }
});
```

**Option B: OBS/ffmpeg external capture**
```bash
# Record specific window
ffmpeg -f x11grab -video_size 1920x1080 -i :0.0 -c:v libx264 -preset ultrafast output.mp4
```

**Option C: Composite view (recommended)**
- Run 3 browsers side-by-side in a tiled layout
- Single screen capture of all 3
- Shows collaboration visually

### Choreography Timeline

```
0:00 - 0:05  | Title card: "Hotpress — Write together. Publish instantly."
0:05 - 0:10  | Show empty document, 3 cursors appear (users joining)
0:10 - 0:25  | Alex types Chapter 1 opening
0:25 - 0:35  | Jordan starts Chapter 2 (split screen moment)
0:35 - 0:45  | Sam adds Chapter 3, all typing simultaneously
0:45 - 0:55  | Quick montage: cursors flying, text appearing
0:55 - 1:05  | PDF EXPORT — show regeneration, the magic moment
1:05 - 1:10  | Final PDF displayed, "Your book. Ready now."
1:10 - 1:15  | CTA: "hotpress.app"
```

---

## Post-Production

### Video Edit
- Add subtle zoom/pan to follow action
- Cursor highlights or name labels
- Background music (lo-fi, ambient)
- Text overlays for key moments

### Deliverables
1. **Twitter version:** 60 sec, 1080x1080 square crop
2. **Website hero:** 90 sec, 16:9, no sound (autoplay)
3. **Full version:** YouTube/longer form if needed

### Tools
- DaVinci Resolve (free) for editing
- Or ffmpeg for simple cuts

---

## Checklist

- [ ] Create 3 test accounts on Hotpress
- [ ] Create demo document "Dead Channels"
- [ ] Write full Playwright script
- [ ] Test script locally
- [ ] Record demo
- [ ] Edit video
- [ ] Post to Twitter
- [ ] Add to landing page

---

*Spec written: 2026-01-15*
*Execution: Weekend*
