/**
 * Integration tests for content/observation tools — content-tools.test.ts
 *
 * Covers three read-only observation tools end-to-end:
 *   browser_screenshot, browser_snapshot, browser_get_page_content
 *
 * The MCP server is started with NO mask arguments so that the full, unfiltered
 * page content is visible.  This lets us assert that selectors like
 * "dangerous-btn" and "admin-panel" appear verbatim in the output (I7) while
 * also confirming that the tools work correctly against a real browser session.
 *
 * Test IDs I5–I7 map 1-to-1 to the acceptance criteria table:
 *
 *   I5 – browser_screenshot      → content[0].type is "image", mimeType is "image/png",
 *                                   data is a non-empty base64 string
 *   I6 – browser_snapshot        → response text is valid JSON, result is non-null,
 *                                   and the string "Login" appears in the JSON text
 *   I7 – browser_get_page_content → response text contains "dangerous-btn" and
 *                                   "admin-panel" (masking is OFF)
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
  // Start the static file server and the MCP client (with NO mask args) in parallel.
  [httpServer, mcpHandle] = await Promise.all([
    startServer(),
    startMcpClient(), // no mask selectors
  ]);

  client = mcpHandle.client;
  testPageUrl = `http://127.0.0.1:${httpServer.port}/test-page.html`;

  // Navigate to the test page so the browser is ready for all content tests.
  await client.callTool({ name: 'browser_navigate', arguments: { url: testPageUrl } });
});

afterAll(async () => {
  // Optional chaining guards against a partial beforeAll failure.
  await mcpHandle?.disconnect();
  await httpServer?.stop();
});

// ---------------------------------------------------------------------------
// I5 – browser_screenshot returns a PNG image
// ---------------------------------------------------------------------------

describe('I5: browser_screenshot returns a PNG image', () => {
  /**
   * I5: Taking a screenshot must succeed and return a single content item
   * with type "image", mimeType "image/png", and a non-empty base64-encoded
   * data string.
   *
   * Expected shape (from src/tools.ts):
   *   { content: [{ type: 'image', data: <base64>, mimeType: 'image/png' }] }
   */
  test('I5: content[0].type is "image", mimeType is "image/png", and data is non-empty', async () => {
    // Act
    const result = await client.callTool({ name: 'browser_screenshot', arguments: {} });

    // Assert – cast to the image content shape
    const item = (result.content as Array<{ type: string; data?: string; mimeType?: string }>)[0];

    expect(result.isError).toBeFalsy();
    expect(item.type).toBe('image');
    expect(item.mimeType).toBe('image/png');
    expect(typeof item.data).toBe('string');
    expect((item.data as string).length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// I6 – browser_snapshot returns valid JSON containing "Login"
// ---------------------------------------------------------------------------

describe('I6: browser_snapshot returns valid JSON containing page content', () => {
  /**
   * I6: The snapshot must return a text content item whose value is valid JSON.
   * Parsing it must not throw and must yield a non-null value.  Because the
   * test page contains `<button id="login-btn">Login</button>`, the string
   * "Login" must appear somewhere in the serialised JSON.
   *
   * Expected shape (from src/tools.ts):
   *   { content: [{ type: 'text', text: <jsonString> }] }
   */
  test('I6: response text parses as non-null JSON and contains "Login"', async () => {
    // Act
    const result = await client.callTool({ name: 'browser_snapshot', arguments: {} });

    // Arrange – extract the raw text
    const rawText = (result.content as Array<{ type: string; text: string }>)[0].text;

    // Assert – must be valid, non-null JSON
    let parsed: unknown;
    expect(() => {
      parsed = JSON.parse(rawText);
    }).not.toThrow();
    expect(parsed).not.toBeNull();

    // Assert – the login button's label must be present in the snapshot
    expect(rawText).toContain('Login');
  });
});

// ---------------------------------------------------------------------------
// I7 – browser_get_page_content returns unmasked HTML
// ---------------------------------------------------------------------------

describe('I7: browser_get_page_content returns full HTML with no masking applied', () => {
  /**
   * I7: With no mask arguments the returned HTML must expose every element on
   * the page.  Specifically:
   *   • "dangerous-btn"  — the class on the danger button
   *   • "admin-panel"    — the id on the admin section
   *
   * Both strings must appear in the response because masking is disabled for
   * this test suite.
   *
   * Expected shape (from src/tools.ts):
   *   { content: [{ type: 'text', text: <htmlString> }] }
   */
  test('I7: page HTML contains "dangerous-btn" when masking is off', async () => {
    // Act
    const result = await client.callTool({ name: 'browser_get_page_content', arguments: {} });

    // Arrange
    const html = (result.content as Array<{ type: string; text: string }>)[0].text;

    // Assert
    expect(result.isError).toBeFalsy();
    expect(html).toContain('dangerous-btn');
  });

  test('I7: page HTML contains "admin-panel" when masking is off', async () => {
    // Act
    const result = await client.callTool({ name: 'browser_get_page_content', arguments: {} });

    // Arrange
    const html = (result.content as Array<{ type: string; text: string }>)[0].text;

    // Assert
    expect(result.isError).toBeFalsy();
    expect(html).toContain('admin-panel');
  });
});
