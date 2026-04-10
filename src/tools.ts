import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { closeBrowser, getPage } from './browser.js';
import { assertNotMasked, getFilteredContent, hideMaskedElements } from './masking.js';

export function registerTools(server: McpServer, maskedSelectors: string[]): void {
  // ─── navigate ───────────────────────────────────────────────────────────────
  server.tool(
    'browser_navigate',
    'Navigate the browser to the given URL.',
    { url: z.string().url().describe('The URL to navigate to') },
    async ({ url }) => {
      const page = await getPage();
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      const title = await page.title();
      return {
        content: [{ type: 'text', text: `Navigated to ${url}\nPage title: ${title}` }],
      };
    }
  );

  // ─── screenshot ──────────────────────────────────────────────────────────────
  server.tool(
    'browser_screenshot',
    'Take a screenshot of the current page. Masked elements are hidden.',
    {},
    async () => {
      const page = await getPage();
      const cleanup = await hideMaskedElements(page, maskedSelectors);
      let screenshot: Buffer;
      try {
        screenshot = await page.screenshot({ type: 'png', fullPage: false });
      } finally {
        await cleanup();
      }
      return {
        content: [
          {
            type: 'image',
            data: screenshot.toString('base64'),
            mimeType: 'image/png',
          },
        ],
      };
    }
  );

  // ─── snapshot ────────────────────────────────────────────────────────────────
  server.tool(
    'browser_snapshot',
    'Get a structured text snapshot of the current page (role, name, and text of interactive elements). Masked elements are excluded.',
    {},
    async () => {
      const page = await getPage();
      const cleanup = await hideMaskedElements(page, maskedSelectors);
      let snapshot: string;
      try {
        snapshot = await page.evaluate(() => {
          interface NodeInfo {
            role: string;
            name: string;
            text: string;
            children?: NodeInfo[];
          }

          function extractNode(el: Element): NodeInfo | null {
            const style = window.getComputedStyle(el);
            if (style.visibility === 'hidden' || style.display === 'none') return null;

            const role = el.getAttribute('role') ?? el.tagName.toLowerCase();
            const name =
              el.getAttribute('aria-label') ??
              el.getAttribute('alt') ??
              el.getAttribute('placeholder') ??
              (el as HTMLInputElement).value ??
              '';
            const text = (el as HTMLElement).innerText?.trim() ?? '';

            const childNodes: NodeInfo[] = [];
            for (const child of Array.from(el.children)) {
              const n = extractNode(child);
              if (n) childNodes.push(n);
            }

            return { role, name, text, ...(childNodes.length ? { children: childNodes } : {}) };
          }

          return JSON.stringify(extractNode(document.body), null, 2);
        });
      } finally {
        await cleanup();
      }
      return { content: [{ type: 'text', text: snapshot }] };
    }
  );

  // ─── get_page_content ────────────────────────────────────────────────────────
  server.tool(
    'browser_get_page_content',
    'Get the HTML source of the current page. Masked elements are removed from the returned HTML.',
    {},
    async () => {
      const page = await getPage();
      const html = await getFilteredContent(page, maskedSelectors);
      return { content: [{ type: 'text', text: html }] };
    }
  );

  // ─── click ───────────────────────────────────────────────────────────────────
  server.tool(
    'browser_click',
    'Click an element on the page identified by a CSS selector. Blocked for masked elements.',
    { selector: z.string().describe('CSS selector of the element to click') },
    async ({ selector }) => {
      const page = await getPage();
      await assertNotMasked(page, selector, maskedSelectors);
      await page.click(selector);
      return { content: [{ type: 'text', text: `Clicked element: ${selector}` }] };
    }
  );

  // ─── type ────────────────────────────────────────────────────────────────────
  server.tool(
    'browser_type',
    'Type text into an element identified by a CSS selector. Blocked for masked elements.',
    {
      selector: z.string().describe('CSS selector of the element to type into'),
      text: z.string().describe('Text to type'),
    },
    async ({ selector, text }) => {
      const page = await getPage();
      await assertNotMasked(page, selector, maskedSelectors);
      await page.type(selector, text);
      return { content: [{ type: 'text', text: `Typed "${text}" into element: ${selector}` }] };
    }
  );

  // ─── fill ────────────────────────────────────────────────────────────────────
  server.tool(
    'browser_fill',
    'Fill a form field with a value (replaces existing content). Blocked for masked elements.',
    {
      selector: z.string().describe('CSS selector of the form field'),
      value: z.string().describe('Value to fill'),
    },
    async ({ selector, value }) => {
      const page = await getPage();
      await assertNotMasked(page, selector, maskedSelectors);
      await page.fill(selector, value);
      return { content: [{ type: 'text', text: `Filled "${value}" into element: ${selector}` }] };
    }
  );

  // ─── select_option ───────────────────────────────────────────────────────────
  server.tool(
    'browser_select_option',
    'Select an option in a <select> element. Blocked for masked elements.',
    {
      selector: z.string().describe('CSS selector of the <select> element'),
      value: z.string().describe('Value of the option to select'),
    },
    async ({ selector, value }) => {
      const page = await getPage();
      await assertNotMasked(page, selector, maskedSelectors);
      await page.selectOption(selector, value);
      return {
        content: [{ type: 'text', text: `Selected option "${value}" in element: ${selector}` }],
      };
    }
  );

  // ─── hover ───────────────────────────────────────────────────────────────────
  server.tool(
    'browser_hover',
    'Hover over an element identified by a CSS selector. Blocked for masked elements.',
    { selector: z.string().describe('CSS selector of the element to hover over') },
    async ({ selector }) => {
      const page = await getPage();
      await assertNotMasked(page, selector, maskedSelectors);
      await page.hover(selector);
      return { content: [{ type: 'text', text: `Hovered over element: ${selector}` }] };
    }
  );

  // ─── wait_for_selector ───────────────────────────────────────────────────────
  server.tool(
    'browser_wait_for_selector',
    'Wait for an element matching a CSS selector to appear in the DOM.',
    {
      selector: z.string().describe('CSS selector to wait for'),
      timeout: z
        .number()
        .optional()
        .describe('Maximum wait time in milliseconds (default: 30000)'),
    },
    async ({ selector, timeout }) => {
      const page = await getPage();
      await page.waitForSelector(selector, { timeout: timeout ?? 30000 });
      return { content: [{ type: 'text', text: `Element appeared: ${selector}` }] };
    }
  );

  // ─── go_back ─────────────────────────────────────────────────────────────────
  server.tool('browser_go_back', 'Navigate back in the browser history.', {}, async () => {
    const page = await getPage();
    await page.goBack();
    return { content: [{ type: 'text', text: 'Navigated back' }] };
  });

  // ─── go_forward ──────────────────────────────────────────────────────────────
  server.tool('browser_go_forward', 'Navigate forward in the browser history.', {}, async () => {
    const page = await getPage();
    await page.goForward();
    return { content: [{ type: 'text', text: 'Navigated forward' }] };
  });

  // ─── close ───────────────────────────────────────────────────────────────────
  server.tool('browser_close', 'Close the browser and end the session.', {}, async () => {
    await closeBrowser();
    return { content: [{ type: 'text', text: 'Browser closed' }] };
  });
}
