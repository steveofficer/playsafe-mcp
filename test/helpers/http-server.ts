/**
 * HTTP test helper — starts a static file server rooted at test/fixtures/
 * and returns the bound port plus a stop function.
 *
 * Uses only Node's built-in `http`, `fs`, and `path` modules.
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as net from 'net';

export interface TestServer {
  port: number;
  stop: () => Promise<void>;
}

const FIXTURES_DIR = path.resolve(__dirname, '..', 'fixtures');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.htm':  'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.txt':  'text/plain',
};

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] ?? 'application/octet-stream';
}

export function startServer(): Promise<TestServer> {
  return new Promise((resolve, reject) => {
    // Track open sockets so we can drain them when stop() is called.
    const openSockets = new Set<net.Socket>();

    const server = http.createServer((req, res) => {
      // Strip query-string and decode URI components, then sanitise to prevent
      // path-traversal attacks (not strictly required for tests, but good practice).
      const urlPath = (req.url ?? '/').split('?')[0];
      let decoded: string;
      try {
        decoded = decodeURIComponent(urlPath);
      } catch {
        decoded = urlPath;
      }

      // Resolve to an absolute path and ensure it stays inside FIXTURES_DIR.
      const absPath = path.resolve(FIXTURES_DIR, '.' + decoded);
      if (absPath !== FIXTURES_DIR && !absPath.startsWith(FIXTURES_DIR + path.sep)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      fs.readFile(absPath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': getMimeType(absPath) });
        res.end(data);
      });
    });

    // Track / untrack sockets for clean shutdown.
    server.on('connection', (socket: net.Socket) => {
      openSockets.add(socket);
      socket.once('close', () => openSockets.delete(socket));
    });

    // Bind to port 0 — the OS will assign a free ephemeral port.
    server.listen(0, '127.0.0.1', () => {
      // Replace the startup error handler with a no-op so Node never treats
      // a late 'error' event as unhandled (which would crash the process).
      server.removeListener('error', reject);
      server.on('error', () => { /* post-bind errors are non-fatal in tests */ });
      const addr = server.address() as net.AddressInfo;

      const stop = (): Promise<void> =>
        new Promise((res, rej) => {
          // Use closeAllConnections() if available (Node ≥ 18.2), otherwise
          // manually destroy every tracked socket.
          if (typeof (server as any).closeAllConnections === 'function') {
            (server as any).closeAllConnections();
          } else {
            for (const socket of openSockets) {
              socket.destroy();
            }
          }

          server.close((err) => {
            if (err) rej(err);
            else res();
          });
        });

      resolve({ port: addr.port, stop });
    });

    server.once('error', reject);
  });
}
