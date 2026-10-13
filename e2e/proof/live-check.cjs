// Live two-person check on hotpress.app: two anonymous guests in one shared document.
const { chromium } = require('@playwright/test');
const BASE = 'https://hotpress.app';
const out = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

(async () => {
  const browser = await chromium.launch();
  const ctxA = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const ctxB = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const failures = [];
  const lbErrors = [];
  const consoleErrors = [];
  const offlineErrors = [];
  const offlineWindow = { A: false, B: false };
  let phase = 'setup';
  for (const [name, ctx] of [['A', ctxA], ['B', ctxB]]) {
    ctx.on('response', r => {
      if (/liveblocks\.io|\/api\/liveblocks-auth/.test(r.url()) && r.status() >= 400) lbErrors.push(`${name} ${r.status()} ${r.url().replace(/\?.*/, '')}`);
    });
  }
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();
  for (const [n, p] of [['A', pageA], ['B', pageB]]) { p.on('pageerror', e => failures.push(`${n} page error: ${e.message.slice(0, 160)}`)); p.on('console', m => { if (m.type() !== 'error' || /Failed to load resource|404/.test(m.text())) return; const t = m.text().replace(/tok=[^&\s']+/g, 'tok=[redacted]').slice(0, 140); (offlineWindow[n] ? offlineErrors : consoleErrors).push(`${new Date().toISOString().slice(11,19)} [${phase}] ${n}: ${t}`); }); }

  // A creates an anonymous session and a share link.
  // Create the test session through the API only. Loading the homepage first would let its own editor
  // create a second session and race this one for the hp_session cookie (seen as a 403 on share).
  const created = await pageA.request.post(`${BASE}/api/sessions`, { data: { type: 'book' } });
  if (!created.ok()) throw new Error(`create session: ${created.status()}`);
  const sessionId = (await created.json()).session.id;
  const shared = await pageA.request.post(`${BASE}/api/sessions/${sessionId}/share`, { data: {} });
  if (!shared.ok()) throw new Error(`share: ${shared.status()}`);
  const { shareUrl } = await shared.json();
  out('session', sessionId, 'share', shareUrl);

  const editor = p => p.getByRole('textbox', { name: /editor/i }).first();
  const text = p => editor(p).innerText();
  await pageA.goto(shareUrl);
  await pageB.goto(shareUrl);
  await editor(pageA).waitFor({ timeout: 30000 });
  await editor(pageB).waitFor({ timeout: 30000 });
  await pageA.waitForTimeout(3000);

  const waitFor = async (p, needle, ms = 15000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { if ((await text(p)).includes(needle)) return Date.now() - t0; await p.waitForTimeout(100); }
    return -1;
  };

  phase = 'sync';
  // 1. A types, B sees. 2. B types, A sees.
  await editor(pageA).click(); await pageA.keyboard.press('ControlOrMeta+a'); await pageA.keyboard.press('Backspace');
  await pageA.keyboard.type('Live check from A.');
  let ms = await waitFor(pageB, 'Live check from A.');
  out('A -> B', ms >= 0 ? `ok (${ms} ms)` : 'FAILED'); if (ms < 0) failures.push('A->B sync');
  await editor(pageB).click(); await pageB.keyboard.press('ControlOrMeta+End');
  await pageB.keyboard.press('Enter'); await pageB.keyboard.type('Reply from B.');
  ms = await waitFor(pageA, 'Reply from B.');
  out('B -> A', ms >= 0 ? `ok (${ms} ms)` : 'FAILED'); if (ms < 0) failures.push('B->A sync');

  phase = 'burst';
  // 3. Rapid typing burst from A, no delay: both editors must end identical.
  await editor(pageA).click(); await pageA.keyboard.press('ControlOrMeta+End'); await pageA.keyboard.press('Enter');
  const burst = Array.from({ length: 10 }, (_, i) => `Anchor ${i}.`).join(' ');
  await pageA.keyboard.type(burst, { delay: 0 });
  let same = false;
  for (let i = 0; i < 100 && !same; i++) { await pageA.waitForTimeout(200); same = (await text(pageA)) === (await text(pageB)) && (await text(pageB)).includes('Anchor 9.'); }
  out('rapid burst', same ? 'ok, both editors identical' : 'FAILED');
  if (!same) failures.push(`rapid burst: A=${JSON.stringify(await text(pageA))} B=${JSON.stringify(await text(pageB))}`);

  phase = 'offline';
  // 4. B offline 9 s while both type; after reconnect both have both sentences and match.
  offlineWindow.B = true;
  await ctxB.setOffline(true);
  await editor(pageB).click(); await pageB.keyboard.press('ControlOrMeta+End'); await pageB.keyboard.press('Enter');
  await pageB.keyboard.type('B wrote this offline.');
  await editor(pageA).click(); await pageA.keyboard.press('ControlOrMeta+End'); await pageA.keyboard.press('Enter');
  await pageA.keyboard.type('A kept writing online.');
  await pageA.waitForTimeout(9000);
  await ctxB.setOffline(false);
  await pageB.waitForTimeout(3000); offlineWindow.B = false; // reconnect settles
  let merged = false;
  for (let i = 0; i < 150 && !merged; i++) {
    await pageA.waitForTimeout(200);
    const a = await text(pageA), b = await text(pageB);
    merged = a === b && a.includes('B wrote this offline.') && a.includes('A kept writing online.');
  }
  out('offline 9 s and merge', merged ? 'ok, both editors identical' : 'FAILED');
  if (!merged) failures.push(`offline merge: A=${JSON.stringify(await text(pageA))} B=${JSON.stringify(await text(pageB))}`);

  phase = 'late-joiner';
  // 5. Persistence: a fresh third visitor gets the whole document.
  const ctxC = await browser.newContext();
  const pageC = await ctxC.newPage();
  await pageC.goto(shareUrl); await editor(pageC).waitFor({ timeout: 30000 });
  let full = false;
  for (let i = 0; i < 75 && !full; i++) { await pageC.waitForTimeout(200); full = (await text(pageC)) === (await text(pageA)); }
  out('late joiner gets the full document', full ? 'ok' : 'FAILED'); if (!full) failures.push('late joiner');

  phase = 'pointer';
  // 6. Figma-style pointer: A moves the mouse over the document; B sees A's pointer.
  const boxA = await editor(pageA).boundingBox();
  for (let i = 0; i <= 20; i++) { await pageA.mouse.move(boxA.x + 120 + i * 12, boxA.y + 60 + 30 * Math.sin(i / 20 * Math.PI)); await pageA.waitForTimeout(30); }
  let pointerOk = false;
  try { await pageB.getByTestId('remote-pointer').first().waitFor({ state: 'visible', timeout: 10000 }); pointerOk = true; } catch {}
  out('remote pointer on the other screen', pointerOk ? 'ok' : 'FAILED'); if (!pointerOk) failures.push('remote pointer');
  await pageB.screenshot({ path: process.argv[2] + '/live-pointer-B.png' });

  phase = 'selection';
  // 6b. Coloured remote selection: A selects a phrase; B sees it tinted.
  await editor(pageA).click();
  await pageA.evaluate(() => {
    const ed = document.querySelector('[contenteditable="true"]'); ed.focus();
    const walker = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT);
    let node; while ((node = walker.nextNode())) { const i = node.textContent.indexOf('Live check'); if (i >= 0) { const r = document.createRange(); r.setStart(node, i); r.setEnd(node, i + 10); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.dispatchEvent(new Event('selectionchange')); break; } }
  });
  let selectionOk = false;
  for (let i = 0; i < 50 && !selectionOk; i++) {
    await pageB.waitForTimeout(100);
    selectionOk = await pageB.evaluate(() => {
      const els = [...document.querySelectorAll('.lb-lexical-cursors *')];
      return els.some(el => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return r.width > 20 && r.height > 8 && cs.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor) && !el.textContent.trim(); });
    });
  }
  out('coloured remote selection on the other screen', selectionOk ? 'ok' : 'FAILED'); if (!selectionOk) failures.push('remote selection tint');
  await pageB.screenshot({ path: process.argv[2] + '/live-selection-B.png' });
  await pageA.mouse.click(boxA.x + 5, boxA.y + boxA.height - 5);

  phase = 'comment';
  // 7. Comment: A selects a word, comments; B sees the pin, opens the popover and replies; A sees the reply.
  await editor(pageA).click();
  await pageA.evaluate(() => {
    const ed = document.querySelector('[contenteditable="true"]'); ed.focus();
    const walker = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT);
    let node; while ((node = walker.nextNode())) { const i = node.textContent.indexOf('Reply from B'); if (i >= 0) { const r = document.createRange(); r.setStart(node, i); r.setEnd(node, i + 5); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.dispatchEvent(new Event('selectionchange')); break; } }
  });
  await pageA.waitForTimeout(600);
  let commentOk = false;
  try {
    const commentBtn = pageA.getByRole('button', { name: 'Comment', exact: true });
    if (await commentBtn.count()) await commentBtn.first().click({ timeout: 8000 });
    else await pageA.getByRole('button', { name: 'Add Comment (select text first)', exact: true }).click({ timeout: 8000 });
    await pageA.locator('.lb-composer-editor').first().fill('Live comment from A.');
    await pageA.getByRole('button', { name: 'Send', exact: true }).first().click();
    out('  comment sent by A');
    await pageB.locator('.hotpress-comment-pin').first().waitFor({ state: 'visible', timeout: 15000 });
    await pageB.locator('.hotpress-comment-pin').first().click();
    await pageB.locator('.hotpress-comment-popover').first().waitFor({ state: 'visible', timeout: 8000 });
    await pageB.screenshot({ path: process.argv[2] + '/live-popover-B.png' });
    const reply = pageB.locator('.hotpress-comment-popover .lb-composer-editor').first();
    await reply.fill('Live reply from B.');
    await pageB.locator('.hotpress-comment-popover').getByRole('button', { name: 'Reply', exact: true }).click();
    await pageA.locator('.hotpress-comment-pin').first().click();
    await pageA.getByText('Live reply from B.').first().waitFor({ state: 'visible', timeout: 15000 });
    await pageA.screenshot({ path: process.argv[2] + '/live-popover-A.png' });
    commentOk = true;
  } catch (e) { failures.push('comment flow: ' + e.message.split('\n')[0]); }
  out('comment, pin, popover and reply across both screens', commentOk ? 'ok' : 'FAILED');

  await pageA.screenshot({ path: process.argv[2] + '/live-A.png' });
  await pageB.screenshot({ path: process.argv[2] + '/live-B.png' });

  phase = 'cleanup';
  // Clean up: the creator deletes the test session.
  const del = await pageA.request.delete(`${BASE}/api/sessions/${sessionId}`);
  out('cleanup: delete session', del.status());

  out('console errors while deliberately offline (expected):', offlineErrors.length); out('console errors otherwise:', consoleErrors.length ? consoleErrors.join(' | ') : 'none'); if (consoleErrors.length) failures.push('console errors');
  out('Liveblocks/auth HTTP errors:', lbErrors.length ? lbErrors.join(' | ') : 'none');
  out('RESULT', failures.length ? 'FAIL\n - ' + failures.join('\n - ') : 'ALL PASSED');
  await browser.close();
  process.exit(failures.length ? 1 : 0);
})().catch(e => { console.error('ERROR', e.message); process.exit(2); });
