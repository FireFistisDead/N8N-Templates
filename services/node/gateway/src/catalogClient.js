'use strict';

/** Minimal HTTP client for the catalog service built on the global fetch. */
class CatalogClient {
  constructor(baseUrl, timeoutMs = 60000) {
    this.baseUrl = String(baseUrl).replace(/\/+$/, '');
    this.timeoutMs = timeoutMs;
  }

  /**
   * Forward one request. Returns `{ status, headers, body }` where body is a
   * Buffer, so the gateway can pass responses through untouched.
   */
  async forward({ method, path, query = '', body = null, headers = {} }) {
    const url = `${this.baseUrl}${path}${query ? `?${query}` : ''}`;
    const init = {
      method: method.toUpperCase(),
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(this.timeoutMs),
    };

    if (headers['content-type']) init.headers['content-type'] = headers['content-type'];
    if (body && body.length) init.body = body;

    try {
      const response = await fetch(url, init);
      const buffer = Buffer.from(await response.arrayBuffer());
      const responseHeaders = {};
      for (const key of ['content-type', 'content-disposition', 'cache-control', 'etag']) {
        const value = response.headers.get(key);
        if (value) responseHeaders[key] = value;
      }
      return { status: response.status, headers: responseHeaders, body: buffer };
    } catch (error) {
      return {
        status: 502,
        headers: { 'content-type': 'application/json' },
        body: Buffer.from(JSON.stringify({ detail: `Catalog unavailable: ${error.message}` })),
      };
    }
  }

  async health() {
    return this.forward({ method: 'GET', path: '/health' });
  }
}

module.exports = { CatalogClient };
