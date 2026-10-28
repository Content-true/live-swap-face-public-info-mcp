import assert from 'node:assert/strict';
import test from 'node:test';
import { estimateCredits, pageUrl, parseCreditRates } from './product.js';

test('official URLs stay on the expected domain', () => {
  assert.equal(pageUrl('pricing'), 'https://liveswapface.com/pricing');
});

test('effect-specific rates take precedence over generic Pro rate', () => {
  const rates = parseCreditRates('Basic costs 1 credit per second. Pro costs 6 for Face Swap and Try-On, and 3 for Restyle. The Basic model uses 1 credit per second; the Pro model uses 6.');
  assert.deepEqual(rates, { basic: 1, proFaceSwap: 6, proTryOn: 6, proRestyle: 3 });
  assert.deepEqual(estimateCredits(61, 'restyle', 'pro', rates!), { seconds: 61, effect: 'restyle', model: 'pro', creditsPerSecond: 3, estimatedCredits: 183 });
});

test('unknown rate text fails closed', () => {
  assert.equal(parseCreditRates('Contact sales for pricing.'), null);
});
