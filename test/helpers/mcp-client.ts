/**
 * MCP Client Test Helper
 *
 * Spawns the built MCP server process (`node dist/index.js`) with optional
 * `--mask` arguments, connects to it via the MCP SDK Client + StdioClientTransport,
 * and returns the connected client together with a cleanup function.
 */

import * as path from 'path';
import * as fs from 'fs';
import * as childProcess from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

/** Absolute path to the built server entry-point. */
const DIST_INDEX = path.resolve(__dirname, '../../dist/index.js');

/** Hard timeout (ms) before escalating to SIGKILL. */
const SIGKILL_TIMEOUT_MS = 5_000;

export interface McpTestClient {
  client: Client;
  disconnect: () => Promise<void>;
}

/**
 * Waits for a child process to exit, returning a promise that resolves when
 * the 'close' event fires. If the process has already exited the promise
 * resolves immediately.
 */
function waitForExit(proc: childProcess.ChildProcess): Promise<void> {
  return new Promise<void>((resolve) => {
    const onClose = () => resolve();
    proc.once('close', onClose);

    // Re-check after attaching the listener to avoid a race where the
    // process exits between an initial check and the listener registration.
    if (proc.exitCode !== null || proc.signalCode !== null) {
      proc.removeListener('close', onClose);
      resolve();
    }
  });
}

/**
 * Kills a process and waits for it to exit, escalating from SIGTERM to SIGKILL
 * after `timeoutMs` milliseconds.
 */
async function killAndWait(
  proc: childProcess.ChildProcess,
  timeoutMs: number
): Promise<void> {
  if (proc.exitCode !== null || proc.signalCode !== null) {
    return; // Already dead
  }

  const exitPromise = waitForExit(proc);

  // Send SIGTERM first; the server has a handler that flushes and exits cleanly.
  try {
    proc.kill('SIGTERM');
  } catch {
    // Process may have already exited; ignore
  }

  // Race: either the process exits gracefully or we escalate to SIGKILL.
  const timedOut = await Promise.race([
    exitPromise.then(() => false as const),
    new Promise<true>((resolve) => setTimeout(() => resolve(true), timeoutMs)),
  ]);

  if (timedOut) {
    try {
      proc.kill('SIGKILL');
    } catch {
      // Already dead
    }
    // Wait for the OS to reap the process after SIGKILL.
    await exitPromise;
  }
}

export async function startMcpClient(maskSelectors?: string[]): Promise<McpTestClient> {
  // Fast-fail if the build artefact is missing – produces a clear error
  // regardless of which test file calls this helper first.
  if (!fs.existsSync(DIST_INDEX)) {
    throw new Error(
      `dist/index.js not found at ${DIST_INDEX}. ` +
        'Run "npm run build" before executing the integration suite.'
    );
  }

  // Convert mask selectors to ['--mask', selector] pairs
  const maskArgs: string[] = (maskSelectors ?? []).flatMap((selector) => ['--mask', selector]);

  // StdioClientTransport spawns the process internally and manages stdio piping.
  const transport = new StdioClientTransport({
    command: 'node',
    args: [DIST_INDEX, ...maskArgs],
    stderr: 'inherit',
  });

  const client = new Client(
    { name: 'playsafe-mcp-test-client', version: '1.0.0' },
    { capabilities: {} }
  );

  // Connect – StdioClientTransport starts the child process during this call
  // and performs the MCP initialisation handshake.
  await client.connect(transport);

  // Capture the internal ChildProcess reference immediately after connect so we
  // retain it even after transport.close() clears its own reference. The
  // `_process` field is private in TypeScript but accessible at runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serverProc: childProcess.ChildProcess | undefined = (transport as any)._process;

  if (!serverProc) {
    throw new Error(
      'StdioClientTransport._process is no longer accessible. ' +
      'Update mcp-client.ts to match the current SDK API.'
    );
  }

  // Emergency cleanup: if a test throws before disconnect() is called, kill
  // the server when the host process exits to prevent orphan processes.
  const emergencyCleanup = () => {
    if (serverProc) {
      try { serverProc.kill('SIGKILL'); } catch { /* ignore */ }
    }
  };
  process.once('exit', emergencyCleanup);

  const disconnect = async (): Promise<void> => {
    process.removeListener('exit', emergencyCleanup);

    // Step 1: Close the MCP client connection. This calls transport.close()
    // which ends stdin, sends SIGTERM, and – if necessary – SIGKILL. However,
    // the SDK's close() does NOT await the final SIGKILL, so the process may
    // still be running when close() returns in the worst case.
    await client.close();

    // Step 2: Guarantee the child process has actually exited before returning.
    if (serverProc) {
      await killAndWait(serverProc, SIGKILL_TIMEOUT_MS);
    }
  };

  return { client, disconnect };
}
