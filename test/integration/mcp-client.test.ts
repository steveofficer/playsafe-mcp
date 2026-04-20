/**
 * Integration tests for test/helpers/mcp-client.ts
 *
 * Written TDD-style: these tests describe the behaviour the implementation
 * must satisfy and will FAIL until the helper module is created (Task 005).
 *
 * Each test is labelled M1–M4 and maps 1-to-1 to the acceptance criteria:
 *
 *  M1 – startMcpClient() connects and listTools() returns exactly 11 tools
 *  M2 – startMcpClient([...mask args]) forwards args and starts without error
 *  M3 – disconnect() resolves cleanly within 5 seconds
 *  M4 – no orphan child processes remain after disconnect() completes
 */

import * as path from "node:path";
import * as fs from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { startMcpClient, type McpTestClient } from "../helpers/mcp-client";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** How many tools are expected to be registered by the server. */
const EXPECTED_TOOL_COUNT = 11;

// ---------------------------------------------------------------------------
// M1 – listTools() returns exactly 11 tools
// ---------------------------------------------------------------------------

describe("M1: startMcpClient() – no mask selectors", () => {
  let handle: McpTestClient;

  beforeAll(async () => {
    handle = await startMcpClient();
  });

  afterAll(async () => {
    await handle.disconnect();
  });

  test("M1: returned object exposes a Client instance", () => {
    // Arrange + Act (done in beforeAll)
    // Assert
    expect(handle.client).toBeInstanceOf(Client);
  });

  test("M1: listTools() resolves without throwing", async () => {
    // Act + Assert
    await expect(handle.client.listTools()).resolves.toBeDefined();
  });

  test("M1: listTools() result contains exactly 11 tools", async () => {
    // Act
    const result = await handle.client.listTools();

    // Assert
    expect(result.tools).toHaveLength(EXPECTED_TOOL_COUNT);
  });

  test("M1: each tool in the list has a name and description", async () => {
    // Act
    const result = await handle.client.listTools();

    // Assert – every tool must have non-empty name and description fields
    for (const tool of result.tools) {
      expect(typeof tool.name).toBe("string");
      expect(tool.name.length).toBeGreaterThan(0);
      expect(typeof tool.description).toBe("string");
      expect((tool.description as string).length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// M2 – mask selectors are forwarded without error
// ---------------------------------------------------------------------------

describe("M2: startMcpClient([...selectors]) – with mask selectors", () => {
  let handle: McpTestClient;

  beforeAll(async () => {
    handle = await startMcpClient([".dangerous-btn", "#admin-panel"]);
  });

  afterAll(async () => {
    await handle.disconnect();
  });

  test("M2: server starts successfully when mask selectors are supplied", () => {
    // If startMcpClient() threw, beforeAll would have failed; reaching here
    // confirms the server accepted the --mask arguments without error.
    expect(handle).toBeDefined();
    expect(handle.client).toBeInstanceOf(Client);
  });

  test("M2: listTools() still returns the same 11 tools when mask args are present", async () => {
    // The mask args only affect runtime behaviour (blocking interactions);
    // the tool list itself must remain unchanged.
    const result = await handle.client.listTools();

    expect(result.tools).toHaveLength(EXPECTED_TOOL_COUNT);
  });
});

// ---------------------------------------------------------------------------
// M3 – disconnect() resolves within 5 seconds
// ---------------------------------------------------------------------------

describe("M3: disconnect() – clean shutdown", () => {
  test("M3: disconnect() resolves within 5 seconds", async () => {
    // Arrange – spin up a fresh client for this test so we can measure shutdown
    const handle = await startMcpClient();

    // Act + Assert – Jest will fail the test if the promise does not settle
    // within the timeout enforced by jest.config.ts (30 s global + this local 5 s).
    await expect(
      Promise.race([
        handle.disconnect(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("disconnect() timed out after 5 seconds")),
            5_000,
          ),
        ),
      ]),
    ).resolves.toBeUndefined();
  });

  test("M3: disconnect() can be awaited without throwing", async () => {
    // Arrange
    const handle = await startMcpClient();

    // Act + Assert – should not throw
    await expect(handle.disconnect()).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// M4 – no orphan child processes after disconnect()
// ---------------------------------------------------------------------------

describe("M4: no orphan processes after disconnect()", () => {
  /**
   * Returns true if the process with the given PID is still alive.
   * Uses `process.kill(pid, 0)` – signal 0 tests existence without
   * delivering a signal, making it precise and concurrency-safe.
   */
  function isProcessAlive(pid: number): boolean {
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      // ESRCH = no such process
      return false;
    }
  }

  test("M4: no node dist/index.js processes remain after disconnect()", async () => {
    // Arrange — start one client and capture its PID
    const handle = await startMcpClient();
    const { pid } = handle;

    expect(isProcessAlive(pid)).toBe(true);

    // Act
    await handle.disconnect();

    // Assert – give the OS a short moment to reap the process, then check
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(isProcessAlive(pid)).toBe(false);
  });

  test("M4: starting and stopping multiple clients leaves no orphan processes", async () => {
    // Arrange – start three independent clients and capture their PIDs
    const [a, b, c] = await Promise.all([
      startMcpClient(),
      startMcpClient(),
      startMcpClient(),
    ]);

    const pids = [a.pid, b.pid, c.pid];
    for (const pid of pids) {
      expect(isProcessAlive(pid)).toBe(true);
    }

    // Act – disconnect all three
    await Promise.all([a.disconnect(), b.disconnect(), c.disconnect()]);

    // Assert – allow OS process reaping
    await new Promise((resolve) => setTimeout(resolve, 300));
    for (const pid of pids) {
      expect(isProcessAlive(pid)).toBe(false);
    }
  });
});
