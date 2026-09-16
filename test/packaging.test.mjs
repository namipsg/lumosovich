import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import { Lumosovich as EsmLumosovich } from 'lumosovich';

const require = createRequire(import.meta.url);

test('both ESM and CommonJS consumers can load the public API', () => {
  const { Lumosovich: CjsLumosovich } = require('lumosovich');
  const esmClient = new EsmLumosovich({ apiKey: 'test' });
  const cjsClient = new CjsLumosovich({ apiKey: 'test' });

  assert.equal(typeof esmClient.tv.seasons.get, 'function');
  assert.equal(typeof cjsClient.tv.episodes.get, 'function');
});
