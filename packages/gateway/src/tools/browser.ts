import { registerTool } from './registry.js';

let browserInstance: import('playwright').Browser | null = null;

async function getBrowser(): Promise<import('playwright').Browser> {
  if (browserInstance) return browserInstance;
  const { chromium } = await import('playwright');
  browserInstance = await chromium.launch({ headless: true });
  return browserInstance;
}

registerTool(
  {
    name: 'browser_navigate',
    description: 'Open a URL in a headless browser and return page content',
    parameters: {
      url: { type: 'string', description: 'URL to navigate to' },
      waitFor: { type: 'string', description: 'CSS selector to wait for (optional)' },
      screenshot: { type: 'boolean', description: 'Take a screenshot (default false)' },
    },
    requiresApproval: true,
    timeout: 60000,
  },
  async (args) => {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
      await page.goto(args.url as string, { waitUntil: 'domcontentloaded', timeout: 30000 });

      if (args.waitFor) {
        await page.waitForSelector(args.waitFor as string, { timeout: 10000 });
      }

      const title = await page.title();
      const text = await page.evaluate(() => {
        const body = document.body;
        if (!body) return '';
        // Remove scripts and styles
        body.querySelectorAll('script, style, noscript').forEach(el => el.remove());
        return body.innerText.slice(0, 10000);
      });

      let result = `Title: ${title}\n\nContent:\n${text}`;

      if (args.screenshot) {
        const buffer = await page.screenshot({ type: 'png' });
        result += `\n\n[Screenshot taken: ${buffer.length} bytes]`;
      }

      return result;
    } finally {
      await page.close();
    }
  }
);

registerTool(
  {
    name: 'browser_click',
    description: 'Click an element on the current page',
    parameters: {
      selector: { type: 'string', description: 'CSS selector of element to click' },
      url: { type: 'string', description: 'URL to navigate to first (optional)' },
    },
    requiresApproval: true,
    timeout: 30000,
  },
  async (args) => {
    const browser = await getBrowser();
    const page = await browser.newPage();

    try {
      if (args.url) {
        await page.goto(args.url as string, { waitUntil: 'domcontentloaded' });
      }

      await page.click(args.selector as string, { timeout: 10000 });
      await page.waitForLoadState('domcontentloaded');

      const title = await page.title();
      const url = page.url();
      return `Clicked element. Page: ${title} (${url})`;
    } finally {
      await page.close();
    }
  }
);

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
