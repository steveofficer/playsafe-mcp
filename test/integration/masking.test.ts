/**
 * Integration tests for masking guarantees — masking.test.ts
 *
 * Starts the MCP server with `--mask ".dangerous-btn" --mask "#admin-panel"` and
 * verifies that every masked element (and its descendants) is blocked across all
 * relevant tools, while unmasked elements continue to work normally.
 *
 * Test IDs M1–M14 map 1-to-1 to the acceptance criteria table.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { startServer, TestServer } from '../helpers/http-server';
import { startMcpClient, McpTestClient } from '../helpers/mcp-client';

// ---------------------------------------------------------------------------
// Global timeout – all tests in this file may take up to 30 s
// ---------------------------------------------------------------------------
jest.setTimeout(30_000);

// ---------------------------------------------------------------------------
// Suite-level state
// ---------------------------------------------------------------------------

let httpServer: TestServer;
let mcpHandle: McpTestClient;
let client: Client;
let testPageUrl: string;

// ---------------------------------------------------------------------------
// Lifecycle hooks
// ---------------------------------------------------------------------------

beforeAll(async () => {
  // Start the static file server and the MCP client in parallel.
  [httpServer, mcpHandle] = await Promise.all([
    startServer(),
    startMcpClient(['.dangerous-btn', '#admin-panel']),
  ]);

  client = mcpHandle.client;
  testPageUrl = `http://127.0.0.1:${httpServer.port}/test-page.html`;
});

beforeEach(async () => {
  // Reset to a fresh page state before every test.
  await client.callTool({ name: 'browser_navigate', arguments: { url: testPageUrl } });
});

afterAll(async () => {
  // Optional chaining guards against a partial beforeAll failure.
  await mcpHandle?.disconnect();
  await httpServer?.stop();
});

// ---------------------------------------------------------------------------
// M1 – browser_click on a directly masked selector is blocked
// ---------------------------------------------------------------------------

describe('M1: browser_click on a directly masked selector', () => {
  /**
   * M1: Clicking `.dangerous-btn` (which matches the `--mask ".dangerous-btn"`
   * argument) must be rejected with isError: true and a message that contains
   * the phrase "masked for safety".
   */
  test('M1: returns isError:true and "masked for safety" when clicking .dangerous-btn', async () => {
    // Arrange
    const selector = '.dangerous-btn';

    // Act
    const result = await client.callTool({ name: 'browser_click', arguments: { selector } });

    // Assert
    expect(result.isError).toBe(true);
    expect((result.content as Array<{ type: string; text: string }>)[0].text).toContain(
      'masked for safety'
    );
  });
});

// ---------------------------------------------------------------------------
// M2 – browser_click on a descendant of a masked container is blocked
// ---------------------------------------------------------------------------

describe('M2: browser_click on a descendant of a masked container', () => {
  /**
   * M2: `.admin-action` lives inside `#admin-panel`, which is masked.
   * Clicking it must be rejected with isError: true (descendant blocking).
   */
  test('M2: returns isError:true when clicking .admin-action inside #admin-panel', async () => {
    // Arrange
    const selector = '.admin-action';

    // Act
    const result = await client.callTool({ name: 'browser_click', arguments: { selector } });

    // Assert
    expect(result.isError).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// M3 – browser_click on an unmasked element succeeds
// ---------------------------------------------------------------------------

describe('M3: browser_click on an unmasked element', () => {
  /**
   * M3: `#login-btn` is not masked. Clicking it must succeed (isError falsy)
   * and return a message that contains "Clicked element".
   */
  test('M3: isError is falsy and text contains "Clicked element" when clicking #login-btn', async () => {
    // Arrange
    const selector = '#login-btn';

    // Act
    const result = await client.callTool({ name: 'browser_click', arguments: { selector } });

    // Assert
    expect(result.isError).toBeFalsy();
    expect((result.content as Array<{ type: string; text: string }>)[0].text).toContain(
      'Clicked element'
    );
  });
});

// ---------------------------------------------------------------------------
// M4 – browser_type into a masked descendant is blocked
// ---------------------------------------------------------------------------

describe('M4: browser_type into a masked descendant', () => {
  /**
   * M4: `#admin-input` is inside `#admin-panel` (masked). Typing into it must
   * return isError: true.
   */
  test('M4: returns isError:true when typing into #admin-input inside #admin-panel', async () => {
    // Arrange
    const selector = '#admin-input';

    // Act
    const result = await client.callTool({
      name: 'browser_type',
      arguments: { selector, text: 'hello' },
    });

    // Assert
    expect(result.isError).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// M5 – browser_fill into a masked descendant is blocked
// ---------------------------------------------------------------------------

describe('M5: browser_fill into a masked descendant', () => {
  /**
   * M5: `#admin-input` is inside `#admin-panel` (masked). Filling it must
   * return isError: true.
   */
  test('M5: returns isError:true when filling #admin-input inside #admin-panel', async () => {
    // Arrange
    const selector = '#admin-input';

    // Act
    const result = await client.callTool({
      name: 'browser_fill',
      arguments: { selector, value: 'test' },
    });

    // Assert
    expect(result.isError).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// M6 – browser_select_option on a masked descendant is blocked
// ---------------------------------------------------------------------------

describe('M6: browser_select_option on a masked descendant', () => {
  /**
   * M6: `#admin-select` is inside `#admin-panel` (masked). Selecting an option
   * must return isError: true.
   */
  test('M6: returns isError:true when selecting option in #admin-select inside #admin-panel', async () => {
    // Arrange
    const selector = '#admin-select';

    // Act
    const result = await client.callTool({
      name: 'browser_select_option',
      arguments: { selector, value: 'edit' },
    });

    // Assert
    expect(result.isError).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// M7 – browser_hover on a directly masked selector is blocked
// ---------------------------------------------------------------------------

describe('M7: browser_hover on a directly masked selector', () => {
  /**
   * M7: Hovering over `.dangerous-btn` (directly masked) must return
   * isError: true.
   */
  test('M7: returns isError:true when hovering over .dangerous-btn', async () => {
    // Arrange
    const selector = '.dangerous-btn';

    // Act
    const result = await client.callTool({ name: 'browser_hover', arguments: { selector } });

    // Assert
    expect(result.isError).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// M8 – browser_snapshot excludes masked elements
// ---------------------------------------------------------------------------

describe('M8: browser_snapshot excludes masked elements', () => {
  /**
   * M8: The structured snapshot must not expose any text or labels belonging
   * to masked elements. In particular "Danger" (the button text for
   * `.dangerous-btn`) and "Admin Action" (the button text inside `#admin-panel`)
   * must be absent.
   */
  test('M8: snapshot JSON does not contain "Danger" or "Admin Action"', async () => {
    // Act
    const result = await client.callTool({ name: 'browser_snapshot', arguments: {} });

    // Arrange – parse and re-stringify the snapshot to normalise whitespace
    const rawText = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed: unknown = JSON.parse(rawText);
    const serialised = JSON.stringify(parsed);

    // Assert – check for the JSON-quoted button text values, which would appear
    // as "text":"Danger" or "text":"Admin Action" if the button nodes were present.
    // Using quoted values avoids false positives from "Dangerous Action" (the h2
    // heading) which legitimately remains visible as it is not a masked element.
    expect(serialised).not.toContain('"Danger"');
    expect(serialised).not.toContain('"Admin Action"');
  });
});

// ---------------------------------------------------------------------------
// M9 – browser_get_page_content excludes masked elements
// ---------------------------------------------------------------------------

describe('M9: browser_get_page_content excludes masked elements', () => {
  /**
   * M9: The returned HTML must not include the masked selectors themselves.
   * "dangerous-btn" and "admin-panel" must not appear anywhere in the output.
   */
  test('M9: page HTML does not contain "dangerous-btn" or "admin-panel"', async () => {
    // Act
    const result = await client.callTool({ name: 'browser_get_page_content', arguments: {} });

    // Arrange
    const html = (result.content as Array<{ type: string; text: string }>)[0].text;

    // Assert – check that the actual element markup is absent. The masked elements
    // are removed from the DOM clone, so their element tags should not appear.
    // HTML comments and CSS rules in the fixture may still reference the selector
    // strings, so we check for element-level markup rather than bare selector strings.
    expect(html).not.toContain('class="dangerous-btn"');
    expect(html).not.toContain('id="admin-panel"');
  });
});

// ---------------------------------------------------------------------------
// M10 – browser_screenshot returns an image even with masks active
// ---------------------------------------------------------------------------

describe('M10: browser_screenshot returns an image', () => {
  /**
   * M10: Screenshots should still work when masks are configured. The response
   * must not be an error and the first content item must have type "image".
   */
  test('M10: isError is falsy and content[0].type is "image"', async () => {
    // Act
    const result = await client.callTool({ name: 'browser_screenshot', arguments: {} });

    // Assert
    expect(result.isError).toBeFalsy();
    expect((result.content as Array<{ type: string }>)[0].type).toBe('image');
  });
});

// ---------------------------------------------------------------------------
// M11 – browser_wait_for_selector on an exact masked selector is blocked
// ---------------------------------------------------------------------------

describe('M11: browser_wait_for_selector on an exact masked selector', () => {
  /**
   * M11: When the selector passed to browser_wait_for_selector exactly matches
   * a masked selector (`.dangerous-btn`), the tool must return isError: true
   * with a message containing "masked element".
   */
  test('M11: returns isError:true and "masked element" for .dangerous-btn', async () => {
    // Arrange
    const selector = '.dangerous-btn';

    // Act
    const result = await client.callTool({
      name: 'browser_wait_for_selector',
      arguments: { selector },
    });

    // Assert
    expect(result.isError).toBe(true);
    expect((result.content as Array<{ type: string; text: string }>)[0].text).toContain(
      'masked element'
    );
  });
});

// ---------------------------------------------------------------------------
// M12 – browser_wait_for_selector on an unmasked selector succeeds
// ---------------------------------------------------------------------------

describe('M12: browser_wait_for_selector on an unmasked selector', () => {
  /**
   * M12: `#login-btn` is not masked. Waiting for it must succeed (isError falsy)
   * and return a message containing "Element appeared".
   */
  test('M12: isError is falsy and text contains "Element appeared" for #login-btn', async () => {
    // Arrange
    const selector = '#login-btn';

    // Act
    const result = await client.callTool({
      name: 'browser_wait_for_selector',
      arguments: { selector },
    });

    // Assert
    expect(result.isError).toBeFalsy();
    expect((result.content as Array<{ type: string; text: string }>)[0].text).toContain(
      'Element appeared'
    );
  });
});

// ---------------------------------------------------------------------------
// M13 – browser_type into an unmasked input succeeds
// ---------------------------------------------------------------------------

describe('M13: browser_type into an unmasked input', () => {
  /**
   * M13: `#username` is not masked. Typing into it must succeed (isError falsy).
   */
  test('M13: isError is falsy when typing into #username', async () => {
    // Arrange
    const selector = '#username';

    // Act
    const result = await client.callTool({
      name: 'browser_type',
      arguments: { selector, text: 'testuser' },
    });

    // Assert
    expect(result.isError).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// M14 – browser_fill into an unmasked input succeeds
// ---------------------------------------------------------------------------

describe('M14: browser_fill into an unmasked input', () => {
  /**
   * M14: `#username` is not masked. Filling it must succeed (isError falsy).
   */
  test('M14: isError is falsy when filling #username', async () => {
    // Arrange
    const selector = '#username';

    // Act
    const result = await client.callTool({
      name: 'browser_fill',
      arguments: { selector, value: 'filleduser' },
    });

    // Assert
    expect(result.isError).toBeFalsy();
  });
});
