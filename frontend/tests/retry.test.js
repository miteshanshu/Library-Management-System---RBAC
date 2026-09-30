import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldRetryRequest, retryDelay } from '../src/api/retry.js';

const networkError = (config) => ({ config, request: {}, code: 'ERR_NETWORK' });
test('reads and opted-in login retry transient failures', () => {
    assert.equal(shouldRetryRequest(networkError({ method: 'get' })), true);
    assert.equal(shouldRetryRequest(networkError({ method: 'post', retryOnTransientError: true })), true);
    for (const status of [502, 503, 504]) {
        assert.equal(shouldRetryRequest({ config: { method: 'get' }, response: { status } }), true);
    }
});
test('writes, authentication errors, cancellation and exhausted retries do not retry', () => {
    for (const method of ['post', 'put', 'patch', 'delete']) {
        assert.equal(shouldRetryRequest(networkError({ method })), false);
    }
    for (const status of [400, 401, 403, 404, 429, 500]) {
        assert.equal(shouldRetryRequest({ config: { method: 'post', retryOnTransientError: true }, response: { status } }), false);
    }
    assert.equal(shouldRetryRequest({ ...networkError({ method: 'get' }), code: 'ERR_CANCELED' }), false);
    assert.equal(shouldRetryRequest(networkError({ method: 'get', signal: { aborted: true } })), false);
    assert.equal(shouldRetryRequest(networkError({ method: 'get', retryCount: 2 })), false);
    assert.equal(shouldRetryRequest({}), false);
});
test('retry delays are bounded', () => {
    assert.equal(retryDelay(1), 3000);
    assert.equal(retryDelay(2), 6000);
});
