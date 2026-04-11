/**
 * Integration tests for test/helpers/http-server.ts
 *
 * These tests are written TDD-style: they describe the behaviour the
 * implementation must satisfy and will FAIL until the helper module is
 * created (Task 004).
 *
 * Each test is labelled H1–H5 and maps 1-to-1 to the acceptance criteria.
 */

import * as http from 'http';
import * as net from 'net';
import { startServer, TestServer } from '../helpers/http-server';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Makes a GET request and resolves with { statusCode, contentType }.
 * Rejects if the TCP connection itself is refused/fails.
 */
function httpGet(url: string): Promise<{ statusCode: number; contentType: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      // Drain response body so the socket is released cleanly.
      res.resume();
      resolve({
        statusCode: res.statusCode ?? 0,
        contentType: res.headers['content-type'] ?? '',
      });
    });
    req.on('error', reject);
  });
}

/**
 * Attempts a raw TCP connection to host:port.
 * Resolves true  if the connection is established.
 * Resolves false if it is refused (ECONNREFUSED).
 * Rejects for any other unexpected error.
 */
function canConnect(port: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();

    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.once('error', (err: NodeJS.ErrnoException) => {
      socket.destroy();
      if (err.code === 'ECONNREFUSED') {
        resolve(false);
      } else {
        reject(err);
      }
    });

    socket.connect(port, '127.0.0.1');
  });
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('startServer() – HTTP test-helper', () => {
  // Keep a reference to the server under test so afterEach can always clean up,
  // even when a test itself forgets to call stop() or throws early.
  let server: TestServer | null = null;

  afterEach(async () => {
    if (server !== null) {
      await server.stop();
      server = null;
    }
  });

  // -------------------------------------------------------------------------
  // H1 – port is a valid unprivileged port number
  // -------------------------------------------------------------------------
  test('H1: resolves with a port that is a positive integer between 1024 and 65535', async () => {
    // Arrange + Act
    server = await startServer();

    // Assert
    expect(Number.isInteger(server.port)).toBe(true);
    expect(server.port).toBeGreaterThanOrEqual(1024);
    expect(server.port).toBeLessThanOrEqual(65535);
  });

  // -------------------------------------------------------------------------
  // H2 – serves test-page.html with the correct status and content-type
  // -------------------------------------------------------------------------
  test('H2: GET /test-page.html returns 200 with a text/html Content-Type', async () => {
    // Arrange
    server = await startServer();
    const url = `http://127.0.0.1:${server.port}/test-page.html`;

    // Act
    const { statusCode, contentType } = await httpGet(url);

    // Assert
    expect(statusCode).toBe(200);
    expect(contentType).toMatch(/text\/html/i);
  });

  // -------------------------------------------------------------------------
  // H3 – nonexistent path returns 404, server stays alive
  // -------------------------------------------------------------------------
  test('H3: GET for a nonexistent path returns 404 and the server does not crash', async () => {
    // Arrange
    server = await startServer();
    const url = `http://127.0.0.1:${server.port}/this-path-does-not-exist-xyz.html`;

    // Act
    const { statusCode } = await httpGet(url);

    // Assert
    expect(statusCode).toBe(404);

    // Confirm the server is still alive by successfully hitting a valid file.
    const followUp = await httpGet(`http://127.0.0.1:${server.port}/test-page.html`);
    expect(followUp.statusCode).toBe(200);
  });

  // -------------------------------------------------------------------------
  // H4 – stop() resolves and the port is released (connection refused after)
  // -------------------------------------------------------------------------
  test('H4: stop() resolves and subsequent connections to the same port are refused', async () => {
    // Arrange
    server = await startServer();
    const { port } = server;

    // Confirm it is reachable before stopping.
    const reachableBeforeStop = await canConnect(port);
    expect(reachableBeforeStop).toBe(true);

    // Act – stop the server; clear the afterEach reference so it isn't stopped twice.
    await server.stop();
    server = null;

    // Assert – the port is no longer accepting connections.
    const reachableAfterStop = await canConnect(port);
    expect(reachableAfterStop).toBe(false);
  });

  // -------------------------------------------------------------------------
  // H5 – two sequential startServer() calls do not produce EADDRINUSE
  // -------------------------------------------------------------------------
  test('H5: two sequential startServer() / stop() calls both bind to a valid port without EADDRINUSE', async () => {
    // --- First server ---
    const first = await startServer();
    expect(first.port).toBeGreaterThanOrEqual(1024);
    expect(first.port).toBeLessThanOrEqual(65535);
    await first.stop();

    // --- Second server (after the first has been fully stopped) ---
    // This must not throw "EADDRINUSE" or any other error.
    const second = await startServer();
    server = second; // hand off to afterEach for cleanup

    expect(second.port).toBeGreaterThanOrEqual(1024);
    expect(second.port).toBeLessThanOrEqual(65535);
  });
});
