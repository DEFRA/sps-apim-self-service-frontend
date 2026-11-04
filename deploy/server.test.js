'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { createServer, parseBackendUrl } = require('./server');

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  return server.address().port;
}

test('backend URL must be an origin without credentials or a path', () => {
  assert.equal(
    parseBackendUrl('https://api.example.test').origin,
    'https://api.example.test'
  );
  assert.throws(() => parseBackendUrl('https://user@api.example.test'));
  assert.throws(() => parseBackendUrl('https://api.example.test/base'));
  assert.throws(() => parseBackendUrl('ftp://api.example.test'));
});

test('proxy preserves API requests and host-only auth cookies', async t => {
  let receivedRequest;
  const backend = http.createServer((request, response) => {
    const chunks = [];
    request.on('data', chunk => chunks.push(chunk));
    request.on('end', () => {
      receivedRequest = {
        method: request.method,
        path: request.url,
        host: request.headers.host,
        forwardedProto: request.headers['x-forwarded-proto'],
        csrfToken: request.headers['x-xsrf-token'],
        cookie: request.headers.cookie,
        body: Buffer.concat(chunks).toString()
      };
      response.writeHead(204, {
        'set-cookie': [
          '__Host-sps-apim-selfserve-auth=auth-value; Path=/; Secure; HttpOnly; SameSite=None',
          'ARRAffinity=backend-affinity; Path=/; Domain=api.example.test'
        ]
      });
      response.end();
    });
  });
  const backendPort = await listen(backend);
  const webRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'frontend-proxy-'));
  const frontend = createServer(
    webRoot,
    new URL(`http://127.0.0.1:${backendPort}`)
  );
  const frontendPort = await listen(frontend);

  t.after(async () => {
    await Promise.all([
      new Promise(resolve => frontend.close(resolve)),
      new Promise(resolve => backend.close(resolve))
    ]);
    await fs.rm(webRoot, { recursive: true, force: true });
  });

  const response = await fetch(
    `http://127.0.0.1:${frontendPort}/api/auth/sign-in?source=test`,
    {
      method: 'POST',
      headers: {
        cookie: '__Host-sps-apim-selfserve-xsrf=csrf-cookie',
        'content-type': 'application/json',
        'x-xsrf-token': 'csrf-request-token'
      },
      body: JSON.stringify({ email: 'user@example.test' })
    }
  );

  assert.equal(response.status, 204);
  assert.equal(receivedRequest.method, 'POST');
  assert.equal(receivedRequest.path, '/api/auth/sign-in?source=test');
  assert.equal(receivedRequest.host, `127.0.0.1:${backendPort}`);
  assert.equal(receivedRequest.forwardedProto, 'https');
  assert.equal(
    receivedRequest.cookie,
    '__Host-sps-apim-selfserve-xsrf=csrf-cookie'
  );
  assert.equal(receivedRequest.csrfToken, 'csrf-request-token');
  assert.deepEqual(
    response.headers.getSetCookie(),
    [
      '__Host-sps-apim-selfserve-auth=auth-value; Path=/; Secure; HttpOnly; SameSite=None'
    ]
  );
});

test('serves runtime config without exposing the backend origin and falls back to the SPA', async t => {
  const webRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'frontend-static-'));
  await fs.writeFile(
    path.join(webRoot, 'index.html'),
    '<!doctype html><title>portal</title>'
  );
  await fs.writeFile(path.join(webRoot, 'server.js'), 'private server code');
  await fs.writeFile(path.join(webRoot, '.startup.sh'), 'private startup code');
  const frontend = createServer(
    webRoot,
    new URL('https://api.example.test')
  );
  const frontendPort = await listen(frontend);

  t.after(async () => {
    await new Promise(resolve => frontend.close(resolve));
    await fs.rm(webRoot, { recursive: true, force: true });
  });

  const configResponse = await fetch(
    `http://127.0.0.1:${frontendPort}/runtime-config.json`
  );
  assert.deepEqual(await configResponse.json(), { apiBaseUrl: '' });

  const pageResponse = await fetch(
    `http://127.0.0.1:${frontendPort}/dashboard`,
    { headers: { accept: 'text/html' } }
  );
  assert.equal(pageResponse.status, 200);
  assert.match(await pageResponse.text(), /<title>portal<\/title>/);

  const serverResponse = await fetch(
    `http://127.0.0.1:${frontendPort}/server.js`
  );
  assert.equal(serverResponse.status, 404);

  const startupResponse = await fetch(
    `http://127.0.0.1:${frontendPort}/.startup.sh`
  );
  assert.equal(startupResponse.status, 404);
});
