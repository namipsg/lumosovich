import assert from 'node:assert/strict';
import test from 'node:test';
import { Lumosovich } from '../dist/index.js';

test('constructs trusted TMDB image URLs and preserves absent paths', () => {
  const client = new Lumosovich({ apiKey: 'test' });
  assert.equal(
    client.images.url('/poster.jpg', 'w500'),
    'https://image.tmdb.org/t/p/w500/poster.jpg',
  );
  assert.equal(
    client.images.url('/portrait.webp'),
    'https://image.tmdb.org/t/p/original/portrait.webp',
  );
  assert.equal(client.images.url(null), undefined);
});

test('rejects paths and sizes that could escape the TMDB image host', () => {
  const client = new Lumosovich({ apiKey: 'test' });
  assert.throws(() => client.images.url('//example.com/x.jpg'), TypeError);
  assert.throws(() => client.images.url('/../secret.jpg'), TypeError);
  assert.throws(() => client.images.url('https://example.com/x.jpg'), TypeError);
  assert.throws(() => client.images.url('/poster.jpg', 'evil'), TypeError);
});
