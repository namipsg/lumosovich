import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { Lumosovich as EsmLumosovich } from 'lumosovich';

const require = createRequire(import.meta.url);

test('both ESM and CommonJS consumers can load the public API', () => {
  const { Lumosovich: CjsLumosovich } = require('lumosovich');
  const esmClient = new EsmLumosovich({ apiKey: 'test' });
  const cjsClient = new CjsLumosovich({ apiKey: 'test' });

  assert.equal(typeof esmClient.tv.seasons.get, 'function');
  assert.equal(typeof cjsClient.tv.episodes.get, 'function');
  for (const client of [esmClient, cjsClient]) {
    for (const method of ['collections', 'companies', 'keywords', 'movies', 'multi', 'people', 'tv']) {
      assert.equal(typeof client.search[method], 'function');
    }
    for (const method of ['get', 'countries', 'jobs', 'languages', 'primaryTranslations', 'timezones']) {
      assert.equal(typeof client.configuration[method], 'function');
    }
    assert.equal(typeof client.certifications.movies, 'function');
    assert.equal(typeof client.certifications.tv, 'function');
    assert.equal(typeof client.genres.movies, 'function');
    assert.equal(typeof client.genres.tv, 'function');
  }
});

test('the packed artifact ships MIT metadata and usable ESM/CommonJS APIs', () => {
  const directory = mkdtempSync(join(tmpdir(), 'lumosovich-package-'));
  const root = fileURLToPath(new URL('../', import.meta.url));
  try {
    const [pack] = JSON.parse(execFileSync('npm', [
      'pack', '--ignore-scripts', '--json', '--pack-destination', directory,
    ], { cwd: root, encoding: 'utf8' }));
    assert.ok(pack.files.some((file) => file.path === 'LICENSE'));
    assert.ok(pack.files.some((file) => file.path === 'dist/reference-types.d.ts'));
    assert.ok(pack.files.some((file) => file.path === 'dist/catalog-types.d.ts'));
    assert.ok(pack.files.every((file) => file.path.startsWith('dist/') ||
      ['LICENSE', 'README.md', 'package.json'].includes(file.path)));
    execFileSync('npm', [
      'install', '--prefix', directory, join(directory, pack.filename),
      '--ignore-scripts', '--offline', '--no-audit', '--no-fund', '--package-lock=false',
    ], { encoding: 'utf8' });
    const consumer = `
      import assert from 'node:assert/strict';
      import { createRequire } from 'node:module';
      import { readFileSync } from 'node:fs';
      import { join, dirname } from 'node:path';
      import { Lumosovich as EsmClient } from 'lumosovich';
      const require = createRequire(import.meta.url);
      const { Lumosovich: CjsClient } = require('lumosovich');
      const root = join(dirname(require.resolve('lumosovich')), '..');
      const manifest = JSON.parse(readFileSync(join(root, 'package.json')));
      assert.equal(manifest.license, 'MIT');
      assert.equal(manifest.engines.node, '>=22');
      assert.match(readFileSync(join(root, 'LICENSE'), 'utf8'), /^MIT License/);
      for (const Client of [EsmClient, CjsClient]) {
        const client = new Client({ accessToken: 'test-token', fetch: async (url) =>
          new Response(JSON.stringify(new URL(url).pathname.includes('/genre/')
            ? { genres: [] } : { page: 1, results: [], total_pages: 0, total_results: 0 })) });
        assert.deepEqual((await client.search.people('query')).results, []);
        assert.deepEqual((await client.discover.movies()).results, []);
        assert.deepEqual((await client.trending.movies('day')).results, []);
        assert.deepEqual((await client.genres.tv()).genres, []);
        assert.equal(typeof client.configuration.primaryTranslations, 'function');
      }
    `;
    execFileSync(process.execPath, ['--input-type=module', '-e', consumer], {
      cwd: directory, encoding: 'utf8',
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
