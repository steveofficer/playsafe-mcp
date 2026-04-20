import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { closeBrowser, getPage } from "./browser.js";
import {
  assertNotMasked,
  getFilteredContent,
  hideMaskedElements,
} from "./masking.js";

export function registerTools(
  server: McpServer,
  maskedSelectors: string[],
): void {
  // ─── navigate ───────────────────────────────────────────────────────────────
  server.registerTool(
    "browser_navigate",
    {
      description: "Navigate the browser to the given URL.",
      inputSchema: {
        url: z
          .url()
          .refine((u) => /^https?:\/\//i.test(u), {
            message: "Only http and https URLs are allowed",
          })
          .describe("The URL to navigate to"),
      },
    },
    async ({ url }) => {
      try {
        const page = await getPage();
        await page.goto(url, { waitUntil: "domcontentloaded" });
        const title = await page.title();
        return {
          content: [
            { type: "text", text: `Navigated to ${url}\nPage title: ${title}` },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: String(err instanceof Error ? err.message : err),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ─── screenshot ──────────────────────────────────────────────────────────────
  server.registerTool(
    "browser_screenshot",
    {
      description:
        "Take a graphical screenshot of the current page. Masked elements are hidden.",
      inputSchema: {},
    },
    async () => {
      try {
        const page = await getPage();
        const cleanup = await hideMaskedElements(page, maskedSelectors);
        let screenshot: Buffer;
        try {
          screenshot = await page.screenshot({ type: "png", fullPage: false });
        } finally {
          await cleanup();
        }
        return {
          content: [
            {
              type: "image",
              data: screenshot.toString("base64"),
              mimeType: "image/png",
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: String(err instanceof Error ? err.message : err),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ─── snapshot ────────────────────────────────────────────────────────────────
  server.registerTool(
    "browser_snapshot",
    {
      description:
        "Get a structured text snapshot of the current page (visible DOM elements with role/tag, name, text, and nested children). Masked elements are excluded.",
      inputSchema: {},
    },
    async () => {
      try {
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
              if (style.visibility === "hidden" || style.display === "none")
                return null;

              const role = el.getAttribute("role") ?? el.tagName.toLowerCase();
              const name =
                el.getAttribute("aria-label") ??
                el.getAttribute("alt") ??
                el.getAttribute("placeholder") ??
                "";
              const text = (el as HTMLElement).innerText?.trim() ?? "";

              const childNodes: NodeInfo[] = [];
              for (const child of Array.from(el.children)) {
                const n = extractNode(child);
                if (n) childNodes.push(n);
              }

              return {
                role,
                name,
                text,
                ...(childNodes.length ? { children: childNodes } : {}),
              };
            }

            return JSON.stringify(extractNode(document.body), null, 2);
          });
        } finally {
          await cleanup();
        }
        return { content: [{ type: "text", text: snapshot }] };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: String(err instanceof Error ? err.message : err),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ─── get_page_content ────────────────────────────────────────────────────────
  server.registerTool(
    "browser_get_page_content",
    {
      description:
        "Get the HTML source of the current page. Masked elements are removed from the returned HTML.",
      inputSchema: {},
    },
    async () => {
      try {
        const page = await getPage();
        const html = await getFilteredContent(page, maskedSelectors);
        return { content: [{ type: "text", text: html }] };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: String(err instanceof Error ? err.message : err),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ─── click ───────────────────────────────────────────────────────────────────
  server.registerTool(
    "browser_click",
    {
      description:
        "Click an element on the page identified by a CSS selector. Blocked for masked elements.",
      inputSchema: {
        selector: z.string().describe("CSS selector of the element to click"),
      },
    },
    async ({ selector }) => {
      const page = await getPage();
      try {
        await assertNotMasked(page, selector, maskedSelectors);
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: String(err instanceof Error ? err.message : err),
            },
          ],
          isError: true,
        };
      }
      await page.click(selector);
      return {
        content: [{ type: "text", text: `Clicked element: ${selector}` }],
      };
    },
  );

  // ─── fill ────────────────────────────────────────────────────────────────────
  server.registerTool(
    "browser_fill",
    {
      description:
        "Fill a form field with a value (replaces existing content). Blocked for masked elements.",
      inputSchema: {
        selector: z.string().describe("CSS selector of the form field"),
        value: z.string().describe("Value to fill"),
      },
    },
    async ({ selector, value }) => {
      const page = await getPage();
      try {
        await assertNotMasked(page, selector, maskedSelectors);
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: String(err instanceof Error ? err.message : err),
            },
          ],
          isError: true,
        };
      }
      await page.fill(selector, value);
      return {
        content: [{ type: "text", text: `Filled element: ${selector}` }],
      };
    },
  );

  // ─── select_option ───────────────────────────────────────────────────────────
  server.registerTool(
    "browser_select_option",
    {
      description:
        "Select an option in a <select> element. Blocked for masked elements.",
      inputSchema: {
        selector: z.string().describe("CSS selector of the <select> element"),
        value: z.string().describe("Value of the option to select"),
      },
    },
    async ({ selector, value }) => {
      const page = await getPage();
      try {
        await assertNotMasked(page, selector, maskedSelectors);
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: String(err instanceof Error ? err.message : err),
            },
          ],
          isError: true,
        };
      }
      await page.selectOption(selector, value);
      return {
        content: [
          {
            type: "text",
            text: `Selected option "${value}" in element: ${selector}`,
          },
        ],
      };
    },
  );

  // ─── hover ───────────────────────────────────────────────────────────────────
  server.registerTool(
    "browser_hover",
    {
      description:
        "Hover over an element identified by a CSS selector. Blocked for masked elements.",
      inputSchema: {
        selector: z
          .string()
          .describe("CSS selector of the element to hover over"),
      },
    },
    async ({ selector }) => {
      const page = await getPage();
      try {
        await assertNotMasked(page, selector, maskedSelectors);
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: String(err instanceof Error ? err.message : err),
            },
          ],
          isError: true,
        };
      }
      await page.hover(selector);
      return {
        content: [{ type: "text", text: `Hovered over element: ${selector}` }],
      };
    },
  );

  // ─── wait_for_selector ───────────────────────────────────────────────────────
  server.registerTool(
    "browser_wait_for_selector",
    {
      description:
        "Wait for an element matching a CSS selector to appear in the DOM. Returns an error if the selector targets a masked element.",
      inputSchema: {
        selector: z.string().describe("CSS selector to wait for"),
        timeout: z
          .number()
          .optional()
          .describe("Maximum wait time in milliseconds (default: 30000)"),
      },
    },
    async ({ selector, timeout }) => {
      try {
        const page = await getPage();
        await page.waitForSelector(selector, { timeout: timeout ?? 30000 });
        await assertNotMasked(page, selector, maskedSelectors);
        return {
          content: [{ type: "text", text: `Element appeared: ${selector}` }],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: String(err instanceof Error ? err.message : err),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ─── go_back ─────────────────────────────────────────────────────────────────
  server.registerTool(
    "browser_navigate_history",
    {
      description: "Navigate back in the browser history.",
      inputSchema: {
        direction: z
          .enum(["back", "forward"])
          .describe("Direction to navigate in history (back or forward)"),
      },
    },
    async ({ direction }) => {
      try {
        const page = await getPage();
        if (direction === "back") {
          await page.goBack();
          return { content: [{ type: "text", text: "Navigated back" }] };
        } else {
          await page.goForward();
          return { content: [{ type: "text", text: "Navigated forward" }] };
        }
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: String(err instanceof Error ? err.message : err),
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ─── close ───────────────────────────────────────────────────────────────────
  server.registerTool(
    "browser_close",
    {
      description: "Close the browser and end the session.",
      inputSchema: {},
    },
    async () => {
      try {
        await closeBrowser();
        return { content: [{ type: "text", text: "Browser closed" }] };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: String(err instanceof Error ? err.message : err),
            },
          ],
          isError: true,
        };
      }
    },
  );
}
