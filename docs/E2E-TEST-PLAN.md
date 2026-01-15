# Complete End-to-End Test: Writing Session -> Collaboration -> Export

## Purpose
Periodic test plan to verify the complete user flow from session creation through real-time collaboration, formatting, upgrading to paid tier, and exporting PDF/EPUB files.

## Prerequisites
- Dev server running on port 3847
- Stripe CLI forwarding webhooks
- Browser automation available (agent-browser)

## Test Phases

### Phase 1: Create New Writing Session
**Actions:**
1. Navigate to `/projects` or dashboard
2. Click "Create New Project" button
3. Enter title: "End-to-End Test Novel"
4. Wait for session creation and redirect to `/s/[slug]`
5. Wait for Liveblocks "Live" badge to appear

**Expected Behavior:**
- Session creates successfully
- Editor loads with empty content
- "Live" badge shows in green
- Toolbar shows: Copy Link, Templates, Customize, Preview buttons

---

### Phase 2: Test Real-Time Collaboration
**Actions:**
1. Keep Browser A open on the session
2. Copy the session URL
3. Open second browser session with the same URL
4. In Browser A: Type "# Chapter One: The Beginning"
5. Verify text appears in Browser B within 1-2 seconds
6. In Browser B: Type "The story begins here..."
7. Verify text appears in Browser A

**Expected Behavior:**
- Both browsers connect to same Liveblocks room
- Text syncs in real-time (<2 seconds latency)
- Both users see "Live" badge

---

### Phase 3: Add Structured Content
**Actions:**
Type this content in Browser A:
```markdown
# Chapter One: The Beginning

The midnight garden revealed itself only to those who knew where to look. Eleanor pressed her palm against the rusted iron gate, feeling the cold metal bite into her skin.

# Chapter Two: The Journey

Three years she had searched for this place—through dusty archives, faded letters, and the cryptic notes her grandmother had left behind.

# Chapter Three: The Resolution

The name hung between them like a spell. The young man stepped forward, and moonlight caught his face.
```

**Expected Behavior:**
- Content syncs to Browser B
- Markdown formatting previews correctly
- Chapter headings render as H1

---

### Phase 4: Configure Format Settings
**Actions:**
1. Click "Customize" button in toolbar
2. Configure Metadata: Title, Author, Subtitle
3. Configure Typography: body font, heading font
4. Configure Chapters: enable numbering, Roman numerals
5. Configure Page Layout: 6x9 page size
6. Configure Headers/Footers: enable with templates
7. Save and reload page
8. Verify settings persisted

**Expected Behavior:**
- Format panel opens smoothly
- All sections expand/collapse
- Changes save to database
- Settings persist across page reload

---

### Phase 5: Preview PDF (Free Tier)
**Actions:**
1. Click "Preview" button
2. Wait for PDF preview to generate
3. Verify formatting, chapters, headers/footers
4. **Verify "Made with Hotpress" footer appears** (free tier)

**Expected Behavior:**
- Preview generates within 5-10 seconds
- All formatting applies correctly
- Free tier watermark appears

---

### Phase 6: Test Creator Upgrade Flow
**Actions:**
1. Click upgrade button (Creator - $12.99)
2. Verify redirect to Stripe Checkout
3. Simulate payment via Stripe CLI:
   ```bash
   stripe trigger checkout.session.completed \
     --add checkout_session:metadata.type=creator_book_purchase \
     --add checkout_session:metadata.userId=[user-id] \
     --add checkout_session:metadata.sessionId=[session-id] \
     --add checkout_session:mode=payment
   ```
4. Verify database records purchase
5. Refresh page and regenerate preview
6. **Verify "Made with Hotpress" footer is gone**

**Expected Behavior:**
- Upgrade flow works end-to-end
- Footer removed after Creator purchase

---

### Phase 7: Download and Verify PDF
**Actions:**
1. Click "Download PDF" button
2. Open downloaded PDF
3. Verify all chapters, formatting, no watermark

**Expected Behavior:**
- PDF downloads successfully
- All formatting applied correctly
- No watermark after purchase

---

### Phase 8: Download and Verify EPUB
**Actions:**
1. Check "ePub" format option
2. Click "Download EPUB" button
3. Open in reader and verify TOC, content, metadata

**Expected Behavior:**
- EPUB downloads successfully
- Chapters in correct order with TOC
- No watermark after purchase

---

### Phase 9: Verify Collaboration Persistence
**Actions:**
1. Add new content in Browser A
2. Verify it appears in Browser B
3. Close Browser B, add more content, reopen
4. Verify all changes present

**Expected Behavior:**
- Changes persist in Liveblocks storage
- No data loss

---

## Testing Commands Reference
```bash
# Database checks
psql $DATABASE_URL -c "SELECT * FROM writing_sessions ORDER BY created_at DESC LIMIT 1;"
psql $DATABASE_URL -c "SELECT * FROM purchased_books;"
psql $DATABASE_URL -c "SELECT * FROM subscriptions;"

# Stripe CLI
stripe listen --forward-to localhost:3847/api/webhooks/stripe
stripe trigger checkout.session.completed --help

# Browser agent
agent-browser open [url] --headed
agent-browser screenshot /tmp/test-screenshot.png
agent-browser close

# Server management
lsof -ti:3847
pnpm dev
```

## Success Criteria
- [ ] Session creates successfully
- [ ] Real-time collaboration works (<2s latency)
- [ ] Content syncs between browsers
- [ ] Format settings save and persist
- [ ] PDF preview generates with formatting
- [ ] Free tier shows "Made with Hotpress" footer
- [ ] Upgrade flow works end-to-end
- [ ] Footer removed after Creator purchase
- [ ] PDF downloads with all formatting
- [ ] EPUB downloads with structure
- [ ] No watermark on paid tier exports
- [ ] Collaboration persists across sessions
