'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2']
]);

function parseBackendUrl(value) {
  let url;

  try {
    url = new URL(value);
  } catch {
    throw new Error('API_BASE_URL must be an absolute HTTP or HTTPS URL.');
  }

  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      'API_BASE_URL must be an HTTP or HTTPS origin without credentials, a path, query parameters, or a fragment.'
    );
  }

  return url;
}

function isProxyPath(urlPath) {
  return (
    urlPath === '/api' ||
    urlPath.startsWith('/api/') ||
    urlPath === '/health' ||
    urlPath.startsWith('/health/')
  );
}

function isHopByHopHeader(name, connectionTokens) {
  return (
    name === 'connection' ||
    name === 'keep-alive' ||
    name === 'proxy-authenticate' ||
    name === 'proxy-authorization' ||
    name === 'te' ||
    name === 'trailer' ||
    name === 'transfer-encoding' ||
    name === 'upgrade' ||
    connectionTokens.has(name)
  );
}

function removeBackendAffinityCookies(headers) {
  if (!headers['set-cookie']) {
    return;
  }

  const cookies = Array.isArray(headers['set-cookie'])
    ? headers['set-cookie']
    : [headers['set-cookie']];
  const forwardedCookies = cookies.filter(
    cookie => !/^ARRAffinity(?:SameSite)?=/i.test(cookie)
  );

  if (forwardedCookies.length === 0) {
    delete headers['set-cookie'];
  } else {
    headers['set-cookie'] = forwardedCookies;
  }
}

function createServer(
  rootDirectory,
  backendUrl = parseBackendUrl(process.env.API_BASE_URL)
) {
  const webRoot = path.resolve(rootDirectory);

  return http.createServer(async (request, response) => {
    let requestUrl;

    try {
      requestUrl = new URL(request.url, 'http://localhost');
    } catch {
      response.writeHead(400).end();
      return;
    }

    if (requestUrl.pathname === '/health/frontend') {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405, { allow: 'GET, HEAD' }).end();
        return;
      }

      response.writeHead(200, {
        'cache-control': 'no-store',
        'content-type': 'application/json; charset=utf-8'
      });
      response.end(
        request.method === 'HEAD'
          ? undefined
          : JSON.stringify({ status: 'Healthy' })
      );
      return;
    }

    if (isProxyPath(requestUrl.pathname)) {
      const connectionTokens = new Set(
        (request.headers.connection ?? '')
          .split(',')
          .map(header => header.trim().toLowerCase())
          .filter(Boolean)
      );
      const headers = {};

      for (const [name, value] of Object.entries(request.headers)) {
        if (!isHopByHopHeader(name, connectionTokens)) {
          headers[name] = value;
        }
      }

      delete headers.host;
      headers['accept-encoding'] = 'identity';
      headers['x-forwarded-host'] = request.headers.host ?? '';
      headers['x-forwarded-proto'] = 'https';

      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(new Error('Backend request timed out.')),
        120_000
      );
      const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
      response.once('close', () => {
        if (!response.writableEnded) {
          controller.abort(new Error('Client disconnected.'));
        }
      });

      try {
        const upstreamResponse = await fetch(
          new URL(
            `${requestUrl.pathname}${requestUrl.search}`,
            backendUrl
          ),
          {
            method: request.method,
            headers,
            body: hasBody ? Readable.toWeb(request) : undefined,
            duplex: hasBody ? 'half' : undefined,
            redirect: 'manual',
            signal: controller.signal
          }
        );
        const responseHeaders = {};
        upstreamResponse.headers.forEach((value, name) => {
          responseHeaders[name] = value;
        });
        const setCookies = upstreamResponse.headers.getSetCookie();

        if (setCookies.length > 0) {
          responseHeaders['set-cookie'] = setCookies;
        }

        const responseConnectionTokens = new Set(
          (responseHeaders.connection ?? '')
            .split(',')
            .map(header => header.trim().toLowerCase())
            .filter(Boolean)
        );

        for (const name of Object.keys(responseHeaders)) {
          if (isHopByHopHeader(name, responseConnectionTokens)) {
            delete responseHeaders[name];
          }
        }

        removeBackendAffinityCookies(responseHeaders);
        response.writeHead(upstreamResponse.status, responseHeaders);

        if (upstreamResponse.body) {
          await pipeline(Readable.fromWeb(upstreamResponse.body), response);
        } else {
          response.end();
        }
      } catch (error) {
        console.error('Backend proxy request failed:', error.message);

        if (!response.headersSent && !response.destroyed) {
          response.writeHead(502, {
            'content-type': 'application/json; charset=utf-8'
          });
          response.end(JSON.stringify({ error: 'Backend unavailable.' }));
        } else if (!response.destroyed) {
          response.destroy(error);
        }
      } finally {
        clearTimeout(timeout);
      }

      return;
    }

    if (requestUrl.pathname === '/runtime-config.json') {
      response.writeHead(200, {
        'cache-control': 'no-store',
        'content-type': 'application/json; charset=utf-8'
      });
      response.end(JSON.stringify({ apiBaseUrl: '' }));
      return;
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { allow: 'GET, HEAD' }).end();
      return;
    }

    let decodedPath;

    try {
      decodedPath = decodeURIComponent(requestUrl.pathname);
    } catch {
      response.writeHead(400).end();
      return;
    }

    if (
      decodedPath === '/.startup.sh' ||
      decodedPath === '/server.js' ||
      decodedPath === '/server.test.js'
    ) {
      response.writeHead(404).end();
      return;
    }

    const filePath = path.resolve(
      webRoot,
      `.${decodedPath}`
    );

    if (
      filePath !== webRoot &&
      !filePath.startsWith(`${webRoot}${path.sep}`)
    ) {
      response.writeHead(404).end();
      return;
    }

    let requestedFile = filePath;

    try {
      const stats = await fs.promises.stat(requestedFile);

      if (stats.isDirectory()) {
        requestedFile = path.join(requestedFile, 'index.html');
      }

      await fs.promises.access(requestedFile, fs.constants.R_OK);
    } catch {
      if (!request.headers.accept?.includes('text/html')) {
        response.writeHead(404).end();
        return;
      }

      requestedFile = path.join(webRoot, 'index.html');
    }

    try {
      const stats = await fs.promises.stat(requestedFile);

      if (!stats.isFile()) {
        response.writeHead(404).end();
        return;
      }

      response.writeHead(200, {
        'content-length': stats.size,
        'content-type':
          contentTypes.get(path.extname(requestedFile)) ??
          'application/octet-stream'
      });

      if (request.method === 'HEAD') {
        response.end();
        return;
      }

      fs.createReadStream(requestedFile)
        .on('error', error => {
          console.error('Static file read failed:', error.message);
          if (!response.headersSent) {
            response.writeHead(500).end();
          } else {
            response.destroy(error);
          }
        })
        .pipe(response);
    } catch (error) {
      console.error('Static file lookup failed:', error.message);
      response.writeHead(500).end();
    }
  });
}

module.exports = { createServer, parseBackendUrl };

if (require.main === module) {
  const backendUrl = parseBackendUrl(process.env.API_BASE_URL ?? '');
  const port = Number.parseInt(process.env.PORT ?? '8080', 10);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT must be a valid TCP port.');
  }

  createServer(__dirname, backendUrl).listen(port, '0.0.0.0', () => {
    console.log(`Frontend listening on port ${port}.`);
  });
}
