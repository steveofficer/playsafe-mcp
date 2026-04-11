/**
 * Integration tests for test/helpers/mcp-client.ts
 *
 * Written TDD-style: these tests describe the behaviour the implementation
 * must satisfy and will FAIL until the helper module is created (Task 005).
 *
 * Each test is labelled M1–M4 and maps 1-to-1 to the acceptance criteria:
 *
 *  M1 – startMcpClient() connects and listTools() returns exactly 13 tools
 *  M2 – startMcpClient([...mask args]) forwards args and starts without error
 *  M3 – disconnect() resolves cleanly within 5 seconds
 *  M4 – no orphan child processes remain after disconnect() completes
 */

import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { startMcpClient, McpTestClient } from '../helpers/mcp-client';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Absolute path to the built server entry-point. */
const DIST_INDEX = path.resolve(__dirname, '../../dist/index.js');

/** How many tools are expected to be registered by the server. */
const EXPECTED_TOOL_COUNT = 13;

// ---------------------------------------------------------------------------
// Suite-level pre-condition guard
// ---------------------------------------------------------------------------

beforeAll(() => {
  // If the build artefact is missing the whole integration suite is pointless.
  if (!fs.existsSync(DIST_INDEX)) {
    throw new Error(
      `[mcp-client tests] dist/index.js not found at ${DIST_INDEX}. ` +
        'Run "npm run build" before executing the integration suite.'
    );
  }
});

// ---------------------------------------------------------------------------
// M1 – listTools() returns exactly 13 tools
// ---------------------------------------------------------------------------

describe('M1: startMcpClient() – no mask selectors', () => {
  let handle: McpTestClient;

  beforeAll(async () => {
    handle = await startMcpClient();
  });

  afterAll(async () => {
    await handle.disconnect();
  });

  test('M1: returned object exposes a Client instance', () => {
    // Arrange + Act (done in beforeAll)
    // Assert
    expect(handle.client).toBeInstanceOf(Client);
  });

  test('M1: listTools() resolves without throwing', async () => {
    // Act + Assert
    await expect(handle.client.listTools()).resolves.toBeDefined();
  });

  test('M1: listTools() result contains exactly 13 tools', async () => {
    // Act
    const result = await handle.client.listTools();

    // Assert
    expect(result.tools).toHaveLength(EXPECTED_TOOL_COUNT);
  });

  test('M1: each tool in the list has a name and description', async () => {
    // Act
    const result = await handle.client.listTools();

    // Assert – every tool must have non-empty name and description fields
    for (const tool of result.tools) {
      expect(typeof tool.name).toBe('string');
      expect(tool.name.length).toBeGreaterThan(0);
      expect(typeof tool.description).toBe('string');
      expect((tool.description as string).length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// M2 – mask selectors are forwarded without error
// ---------------------------------------------------------------------------

describe('M2: startMcpClient([...selectors]) – with mask selectors', () => {
  let handle: McpTestClient;

  beforeAll(async () => {
    handle = await startMcpClient(['.dangerous-btn', '#admin-panel']);
  });

  afterAll(async () => {
    await handle.disconnect();
  });

  test('M2: server starts successfully when mask selectors are supplied', () => {
    // If startMcpClient() threw, beforeAll would have failed; reaching here
    // confirms the server accepted the --mask arguments without error.
    expect(handle).toBeDefined();
    expect(handle.client).toBeInstanceOf(Client);
  });

  test('M2: listTools() still returns the same 13 tools when mask args are present', async () => {
    // The mask args only affect runtime behaviour (blocking interactions);
    // the tool list itself must remain unchanged.
    const result = await handle.client.listTools();

    expect(result.tools).toHaveLength(EXPECTED_TOOL_COUNT);
  });
});

// ---------------------------------------------------------------------------
// M3 – disconnect() resolves within 5 seconds
// ---------------------------------------------------------------------------

describe('M3: disconnect() – clean shutdown', () => {
  test('M3: disconnect() resolves within 5 seconds', async () => {
    // Arrange – spin up a fresh client for this test so we can measure shutdown
    const handle = await startMcpClient();

    // Act + Assert – Jest will fail the test if the promise does not settle
    // within the timeout enforced by jest.config.ts (30 s global + this local 5 s).
    await expect(
      Promise.race([
        handle.disconnect(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('disconnect() timed out after 5 seconds')), 5_000)
        ),
      ])
    ).resolves.toBeUndefined();
  });

  test('M3: disconnect() can be awaited without throwing', async () => {
    // Arrange
    const handle = await startMcpClient();

    // Act + Assert – should not throw
    await expect(handle.disconnect()).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// M4 – no orphan child processes after disconnect()
// ---------------------------------------------------------------------------

describe('M4: no orphan processes after disconnect()', () => {
  /**
   * Counts the number of `node dist/index.js` processes visible via `ps`.
   * Returns -1 (sentinel) if the `ps` command itself is unavailable.
   */
  function countOrphanServerProcesses(): number {
    try {
      const output = execSync('ps aux', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      // Use a precise regex: must be "node" followed by a path ending in "dist/index.js"
      const matches = output
        .split('\n')
        .filter((line) => /\bnode\b.*dist\/index\.js(\s|$)/.test(line));
      return matches.length;
    } catch {
      // ps unavailable — return sentinel so callers can skip the assertion
      console.warn('[M4] ps command unavailable; orphan process check skipped');
      return -1;
    }
  }

  test('M4: no node dist/index.js processes remain after disconnect()', async () => {
    // Establish baseline — there may be pre-existing unrelated processes
    const baseline = countOrphanServerProcesses();
    if (baseline === -1) return; // ps unavailable; skip

    // Arrange — start one client (adds 1 server process above baseline)
    const handle = await startMcpClient();

    const countDuring = countOrphanServerProcesses();
    expect(countDuring).toBeGreaterThanOrEqual(baseline + 1);

    // Act
    await handle.disconnect();

    // Assert – give the OS a short moment to reap the process, then check
    await new Promise((resolve) => setTimeout(resolve, 200));
    const countAfter = countOrphanServerProcesses();
    // Count must be back to baseline (our servers were cleaned up)
    expect(countAfter).toBe(baseline);
  });

  test('M4: starting and stopping multiple clients leaves no orphan processes', async () => {
    // Establish baseline before starting any clients
    const baseline = countOrphanServerProcesses();
    if (baseline === -1) return; // ps unavailable; skip

    // Arrange – start three independent clients
    const [a, b, c] = await Promise.all([
      startMcpClient(),
      startMcpClient(),
      startMcpClient(),
    ]);

    const countDuring = countOrphanServerProcesses();
    expect(countDuring).toBeGreaterThanOrEqual(baseline + 3);

    // Act – disconnect all three
    await Promise.all([a.disconnect(), b.disconnect(), c.disconnect()]);

    // Assert – allow OS process reaping
    await new Promise((resolve) => setTimeout(resolve, 300));
    const countAfter = countOrphanServerProcesses();
    // All our servers must be gone; count returns to baseline
    expect(countAfter).toBe(baseline);
  });
});
