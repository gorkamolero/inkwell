import { chromium } from '@playwright/test';

async function captureConsoleLogs() {
  console.log('Starting browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleLogs: Array<{ type: string; text: string; timestamp: number }> = [];
  const startTime = Date.now();

  // Listen to all console events
  page.on('console', (msg) => {
    const elapsed = Date.now() - startTime;
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: elapsed
    });
  });

  // Also listen to page errors
  page.on('pageerror', (error) => {
    const elapsed = Date.now() - startTime;
    consoleLogs.push({
      type: 'error',
      text: `PAGE ERROR: ${error.message}`,
      timestamp: elapsed
    });
  });

  console.log('Navigating to http://localhost:3847/s/<TEST_SLUG>...');
  await page.goto('http://localhost:3847/s/<TEST_SLUG>', { 
    waitUntil: 'networkidle',
    timeout: 30000 
  });

  console.log('Waiting 3 seconds to capture logs...');
  await page.waitForTimeout(3000);

  await browser.close();

  // Report findings
  console.log('\n=== CONSOLE LOG REPORT ===\n');
  console.log(`Total messages captured: ${consoleLogs.length}\n`);

  // Filter for OutputSection sessionId messages
  const outputSectionLogs = consoleLogs.filter(log => 
    log.text.includes('[OutputSection] sessionId:')
  );

  if (outputSectionLogs.length > 0) {
    console.log(`Found ${outputSectionLogs.length} [OutputSection] sessionId messages:\n`);
    outputSectionLogs.forEach(log => {
      console.log(`[${log.timestamp}ms] ${log.type}: ${log.text}`);
    });
  } else {
    console.log('No [OutputSection] sessionId messages found.');
  }

  console.log('\n=== ALL CONSOLE LOGS ===\n');
  consoleLogs.forEach(log => {
    console.log(`[${log.timestamp}ms] ${log.type}: ${log.text}`);
  });

  console.log('\n=== END REPORT ===');
}

captureConsoleLogs().catch(console.error);
