/* Click events in Vercel logs, with no user or request metadata in the payload. */
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/providers.js'), 'utf8'), context);
const providers = new Map(context.window.PROVIDERS.map(p => [p.id, p.directorySection]));
const categories = new Set(['recurring','signup','conditional','installed','roleplay','paid','bundles','gateways','marketplace','resources','review','disabled']);
const actions = new Set(['details','docs','signup','install','resource']);
const placements = new Set(['pinned','new','category','spotlight','modal']);
module.exports = function events(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  let origin;
  try { origin = new URL(req.headers.origin); } catch { return res.status(403).end(); }
  if (origin.host !== req.headers.host) return res.status(403).end();
  const { event, properties: p } = req.body || {};
  if (!p || typeof p !== 'object' || p.orderVersion !== '2026-11-16-v2') return res.status(400).end();
  const safe = { orderVersion: p.orderVersion };
  if (event === 'provider_click' && providers.has(p.providerId) && actions.has(p.action) && placements.has(p.placement)) {
    Object.assign(safe, { providerId: p.providerId, category: providers.get(p.providerId), action: p.action, placement: p.placement });
  } else if (['category_nav','category_expand'].includes(event) && categories.has(p.category)) {
    safe.category = p.category;
    if (event === 'category_expand') safe.expanded = p.expanded === true;
  } else if (event === 'filter_toggle' && ['noCard','install','credits','category','status','protocol'].includes(p.key)) {
    Object.assign(safe, { key: p.key, active: p.active === true });
  } else return res.status(400).end();
  console.info(JSON.stringify({ event, properties: safe }));
  return res.status(204).end();
};
