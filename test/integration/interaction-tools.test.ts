/**
 * Integration tests for interaction tools — interaction-tools.test.ts
 *
 * Covers six browser interaction tools end-to-end:
 *   browser_click, browser_fill,
 *   browser_select_option, browser_hover, browser_wait_for_selector
 *
 * The MCP server is started with NO mask arguments so that all elements on the
 * test page are fully accessible, letting us verify the happy-path success
 * message returned by each tool without any masking side-effects.
 *
 * Test IDs I8–I13 map 1-to-1 to the acceptance criteria table:
 *
 *   I8  – browser_click           → isError falsy, text contains "Clicked element"
 *   I10 – browser_fill            → isError falsy, text contains "Filled"
 *   I11 – browser_select_option   → isError falsy, text contains "Selected option"
 *   I12 – browser_hover           → isError falsy, text contains "Hovered"
 *   I13 – browser_wait_for_selector → isError falsy, text is "Element appeared: #login-btn"
 *
 * A `beforeEach` hook navigates back to test-page.html before every test so
 * that each test begins from an identical, clean page state.
 */

import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { startServer, type TestServer } from "../helpers/http-server";
import { startMcpClient, type McpTestClient } from "../helpers/mcp-client";

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
});

beforeEach(async () => {
  // Reset to a fresh page state before every test so that mutations made by
  // one test (e.g. text typed into an input) never bleed into the next.
  await client.callTool({
    name: "browser_navigate",
    arguments: { url: testPageUrl },
  });
});

afterAll(async () => {
  // Optional chaining guards against a partial beforeAll failure.
  await mcpHandle?.disconnect();
  await httpServer?.stop();
});

// ---------------------------------------------------------------------------
// I8 – browser_click on an unmasked button succeeds
// ---------------------------------------------------------------------------

describe("I8: browser_click on an unmasked button", () => {
  /**
   * I8: Clicking `#login-btn` (not masked) must succeed.
   * isError must be falsy and the response text must contain the string
   * "Clicked element" as produced by the tool's success path:
   *   `"Clicked element: ${selector}"`
   */
  test('I8: isError is falsy and text contains "Clicked element" when clicking #login-btn', async () => {
    // Arrange
    const selector = "#login-btn";

    // Act
    const result = await client.callTool({
      name: "browser_click",
      arguments: { selector },
    });

    // Assert
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(result.isError).toBeFalsy();
    expect(text).toContain("Clicked element");
  });
});

// ---------------------------------------------------------------------------
// I10 – browser_fill into an unmasked input succeeds
// ---------------------------------------------------------------------------

describe("I10: browser_fill into an unmasked input", () => {
  /**
   * I10: Filling the value "world" into `#username` (not masked) must succeed.
   * isError must be falsy and the response text must contain "Filled".
   */
  test('I10: isError is falsy and text contains "Filled" when filling #username', async () => {
    // Arrange
    const selector = "#username";
    const value = "world";

    // Act
    const result = await client.callTool({
      name: "browser_fill",
      arguments: { selector, value },
    });

    // Assert
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(result.isError).toBeFalsy();
    expect(text).toContain("Filled");
  });
});

// ---------------------------------------------------------------------------
// I11 – browser_select_option on an unmasked select succeeds
// ---------------------------------------------------------------------------

describe("I11: browser_select_option on an unmasked select element", () => {
  /**
   * I11: Selecting the value "blue" in `#color-select` (outside the admin
   * panel, not masked) must succeed.
   * isError must be falsy and the response text must contain "Selected option"
   * as produced by the tool's success path:
   *   `"Selected option "${value}" in element: ${selector}"`
   */
  test('I11: isError is falsy and text contains "Selected option" when selecting "blue" in #color-select', async () => {
    // Arrange
    const selector = "#color-select";
    const value = "blue";

    // Act
    const result = await client.callTool({
      name: "browser_select_option",
      arguments: { selector, value },
    });

    // Assert
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(result.isError).toBeFalsy();
    expect(text).toContain("Selected option");
  });
});

// ---------------------------------------------------------------------------
// I12 – browser_hover over an unmasked element succeeds
// ---------------------------------------------------------------------------

describe("I12: browser_hover over an unmasked element", () => {
  /**
   * I12: Hovering over `#hover-target` (not masked) must succeed.
   * isError must be falsy and the response text must contain "Hovered" as
   * produced by the tool's success path:
   *   `"Hovered over element: ${selector}"`
   */
  test('I12: isError is falsy and text contains "Hovered" when hovering over #hover-target', async () => {
    // Arrange
    const selector = "#hover-target";

    // Act
    const result = await client.callTool({
      name: "browser_hover",
      arguments: { selector },
    });

    // Assert
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(result.isError).toBeFalsy();
    expect(text).toContain("Hovered");
  });
});

// ---------------------------------------------------------------------------
// I13 – browser_wait_for_selector on an immediately present element succeeds
// ---------------------------------------------------------------------------

describe("I13: browser_wait_for_selector on an element already present in the DOM", () => {
  /**
   * I13: Waiting for `#login-btn` (present in the DOM immediately after page
   * load, not masked) must succeed without any delay.
   * isError must be falsy and the response text must be exactly
   * "Element appeared: #login-btn" as produced by the tool's success path:
   *   `"Element appeared: ${selector}"`
   */
  test('I13: isError is falsy and text is "Element appeared: #login-btn"', async () => {
    // Arrange
    const selector = "#login-btn";

    // Act
    const result = await client.callTool({
      name: "browser_wait_for_selector",
      arguments: { selector },
    });

    // Assert
    const text = (result.content as Array<{ type: string; text: string }>)[0]
      .text;
    expect(result.isError).toBeFalsy();
    expect(text).toBe("Element appeared: #login-btn");
  });
});
