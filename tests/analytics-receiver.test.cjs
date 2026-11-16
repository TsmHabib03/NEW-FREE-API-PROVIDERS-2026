const test = require('node:test');
const assert = require('node:assert/strict');
const events = require('../api/events.js');

test('receiver rejects foreign origins and unknown events; logs only allowed anonymous properties', () => {
  const logs = [];
  const original = console.info;
  console.info = value => logs.push(JSON.parse(value));
  const invoke = (body, headers = { origin: 'https://preview.example', host: 'preview.example' }, method = 'POST') => {
    const res = { code: 200, setHeader() {}, status(code) { this.code = code; return this; }, end() {} };
    events({ method, headers, body }, res);
    return res.code;
  };
  try {
    const payload = { event: 'provider_click', properties: { orderVersion: '2026-11-16-v2', providerId: 'pixrouter', category: 'fake', action: 'details', placement: 'pinned', query: 'private query', referral: 'secret', userId: 'private id' } };
    assert.equal(invoke(payload, { origin: 'https://foreign.example', host: 'preview.example' }), 403);
    assert.equal(invoke(payload, { host: 'preview.example' }), 403);
    assert.equal(invoke(payload, undefined, 'GET'), 405);
    assert.equal(invoke({ event: 'unknown', properties: payload.properties }), 400);
    assert.equal(invoke({ ...payload, properties: { ...payload.properties, providerId: 'unknown' } }), 400);
    assert.equal(logs.length, 0);
    assert.equal(invoke(payload), 204);
    assert.deepEqual(Object.keys(logs[0].properties).sort(), ['action','category','orderVersion','placement','providerId']);
    assert.notEqual(logs[0].properties.category, 'fake');
    assert.equal(JSON.stringify(logs).includes('secret'), false);
    assert.equal(invoke({ event: 'category_expand', properties: { orderVersion: '2026-11-16-v2', category: 'gateways', expanded: true } }), 204);
    assert.equal(invoke({ event: 'filter_toggle', properties: { orderVersion: '2026-11-16-v2', key: 'install', active: true } }), 204);
  } finally { console.info = original; }
});
