/**
 * Integration tests for navigation tools — navigation.test.ts
 *
 * Covers four navigation tools end-to-end:
 *   browser_navigate, browser_go_back, browser_go_forward, browser_close
 *
 * The MCP server is started with NO mask arguments so that navigation
 * behaviour is tested in isolation, without any element-blocking side-effects.
 *
 * Test IDs I1–I4 map 1-to-1 to the acceptance criteria table:
 *
 *   I1 – browser_navigate   → response text contains the URL and page title
 *   I2 – browser_go_back    → response text is "Navigated back", isError falsy
 *   I3 – browser_go_forward → response text is "Navigated forward", isError falsy
 *   I4 – browser_close      → response text contains "Browser closed", isError falsy
 *
 * Tests I1–I4 are intentionally sequential: each test builds on the browser
 * state left by the previous one.  Jest executes tests within a describe block
 * in declaration order, which gives us the required sequencing guarantee.
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
let secondPageUrl: string;

// ---------------------------------------------------------------------------
// Lifecycle hooks
// ---------------------------------------------------------------------------

beforeAll(async () => {
  // Start the static file server and the MCP client (with NO mask args).
  [httpServer, mcpHandle] = await Promise.all([
    startServer(),
    startMcpClient(), // no mask selectors
  ]);

  client = mcpHandle.client;
  testPageUrl = `http://127.0.0.1:${httpServer.port}/test-page.html`;
  secondPageUrl = `http://127.0.0.1:${httpServer.port}/second-page.html`;
});

afterAll(async () => {
  // The browser may already be closed after I4, but disconnect() is designed
  // to handle that case gracefully (kills the server process regardless).
  // Optional chaining guards against a partial beforeAll failure.
  await mcpHandle?.disconnect();
  await httpServer?.stop();
});

// ---------------------------------------------------------------------------
// Navigation tool tests – I1 through I4 (sequential, shared browser state)
// ---------------------------------------------------------------------------

describe('Navigation tools: browser_navigate, browser_go_back, browser_go_forward, browser_close', () => {
  // -------------------------------------------------------------------------
  // I1 – browser_navigate to test-page.html
  // -------------------------------------------------------------------------

  /**
   * I1: Navigating to test-page.html must succeed and return a message that
   * includes both the full URL that was navigated to and the page's <title>
   * text ("Test Page").
   *
   * Expected format (from src/tools.ts):
   *   "Navigated to <url>\nPage title: <title>"
   */
  test('I1: browser_navigate returns text containing the URL and "Test Page" title', async () => {
    // Arrange
    const url = testPageUrl;

    // Act
    const result = await client.callTool({ name: 'browser_navigate', arguments: { url } });

    // Assert
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(result.isError).toBeFalsy();
    expect(text).toContain(url);
    expect(text).toContain('Test Page');
  });

  // -------------------------------------------------------------------------
  // I2 – browser_go_back after navigating to a second page
  // -------------------------------------------------------------------------

  /**
   * I2: Navigate to test-page.html, then to second-page.html, then call
   * browser_go_back.  The response text must be "Navigated back" and isError
   * must be falsy.
   *
   * This test relies on the browser being open from I1.
   */
  test('I2: browser_go_back returns "Navigated back" after navigating to a second page', async () => {
    // Arrange – build up a two-entry history: test-page → second-page
    await client.callTool({ name: 'browser_navigate', arguments: { url: testPageUrl } });
    await client.callTool({ name: 'browser_navigate', arguments: { url: secondPageUrl } });

    // Act
    const result = await client.callTool({ name: 'browser_go_back', arguments: {} });

    // Assert
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(result.isError).toBeFalsy();
    expect(text).toContain('Navigated back');
  });

  // -------------------------------------------------------------------------
  // I3 – browser_go_forward after going back (continues from I2)
  // -------------------------------------------------------------------------

  /**
   * I3: After I2 the browser is on test-page.html with second-page.html one
   * step forward in history.  Calling browser_go_forward must return
   * "Navigated forward" and isError must be falsy.
   */
  test('I3: browser_go_forward returns "Navigated forward" after going back', async () => {
    // Arrange – establish a complete two-entry history so I3 is independent of I2.
    // Navigate test-page → second-page → go_back, leaving second-page one step forward.
    await client.callTool({ name: 'browser_navigate', arguments: { url: testPageUrl } });
    await client.callTool({ name: 'browser_navigate', arguments: { url: secondPageUrl } });
    await client.callTool({ name: 'browser_go_back', arguments: {} });

    // Act
    const result = await client.callTool({ name: 'browser_go_forward', arguments: {} });

    // Assert
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(result.isError).toBeFalsy();
    expect(text).toContain('Navigated forward');
  });

  // -------------------------------------------------------------------------
  // I4 – browser_close ends the session
  // -------------------------------------------------------------------------

  /**
   * I4: Calling browser_close must return a message containing "Browser closed"
   * and isError must be falsy.  After this test the browser is no longer
   * running; afterAll is written to tolerate that condition.
   */
  test('I4: browser_close returns "Browser closed" and isError is falsy', async () => {
    // Act
    const result = await client.callTool({ name: 'browser_close', arguments: {} });

    // Assert
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(result.isError).toBeFalsy();
    expect(text).toContain('Browser closed');
  });
});
