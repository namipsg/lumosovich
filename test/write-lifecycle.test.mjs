import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { Lumosovich } from '../dist/index.js';

const readJson = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const ledger = readJson('spec/coverage.json');
const cleanup = readJson('spec/write-cleanup.json');

test('every pinned write has a concrete cleanup or terminal disposition', () => {
  const writes = ledger.operations.filter((entry) => entry.httpMethod !== 'GET');
  assert.equal(writes.length, 17);
  assert.deepEqual(Object.keys(cleanup).sort(), writes.map((entry) => entry.operationId).sort());
  const writeIds = new Set(writes.map((entry) => entry.operationId));
  for (const [id, plan] of Object.entries(cleanup)) {
    assert.ok(['restore-previous', 'delete-created', 'temporary-token', 'disposable-only', 'terminal'].includes(plan.kind), id);
    assert.ok(typeof plan.guidance === 'string' && plan.guidance.length > 20, id);
    assert.ok(Array.isArray(plan.cleanupOperationIds), id);
    for (const target of plan.cleanupOperationIds) assert.ok(writeIds.has(target), `${id}: unknown cleanup operation ${target}`);
    if (!['temporary-token', 'terminal'].includes(plan.kind)) {
      assert.ok(plan.cleanupOperationIds.length > 0, `${id}: no cleanup path`);
    }
  }
});

test('a failed write workflow restores prior account state and removes disposable resources', async () => {
  const initial = { sessionId: null, list: null, favorite: false, watchlist: true, movieRating: 7, tvRating: null };
  const state = structuredClone(initial);
  const calls = [];
  const tmdb = new Lumosovich({ apiKey: 'offline-key', fetch: async (input, init) => {
    const url = new URL(input);
    const method = init.method ?? 'GET';
    const body = init.body === undefined ? undefined : JSON.parse(init.body);
    calls.push(`${method} ${url.pathname}`);
    const sessionId = url.searchParams.get('session_id');
    let response;
    if (method === 'POST' && url.pathname === '/3/authentication/session/new') {
      assert.deepEqual(body, { request_token: 'approved-token' });
      state.sessionId = 'disposable-session';
      response = { success: true, session_id: state.sessionId };
    } else if (method === 'DELETE' && url.pathname === '/3/authentication/session') {
      assert.deepEqual(body, { session_id: state.sessionId });
      state.sessionId = null;
      response = { success: true };
    } else {
      assert.equal(sessionId, state.sessionId, 'writes must use the disposable user session');
      response = { status_code: 1, status_message: 'Success.' };
      if (method === 'POST' && url.pathname === '/3/list') {
        state.list = { id: 1, items: [] };
        response = { ...response, success: true, list_id: 1 };
      } else if (method === 'POST' && url.pathname === '/3/list/1/add_item') {
        state.list.items.push(body.media_id);
      } else if (method === 'POST' && url.pathname === '/3/list/1/remove_item') {
        state.list.items = state.list.items.filter((item) => item !== body.media_id);
      } else if (method === 'POST' && url.pathname === '/3/list/1/clear') {
        assert.equal(url.searchParams.get('confirm'), 'true');
        state.list.items = [];
      } else if (method === 'DELETE' && url.pathname === '/3/list/1') {
        state.list = null;
      } else if (method === 'POST' && url.pathname === '/3/account/548/favorite') {
        state.favorite = body.favorite;
      } else if (method === 'POST' && url.pathname === '/3/account/548/watchlist') {
        state.watchlist = body.watchlist;
      } else if (url.pathname === '/3/movie/550/rating') {
        state.movieRating = method === 'DELETE' ? null : body.value;
      } else if (url.pathname === '/3/tv/1399/rating') {
        state.tvRating = method === 'DELETE' ? null : body.value;
      } else {
        throw new Error(`Unexpected test request: ${method} ${url.pathname}`);
      }
    }
    return new Response(JSON.stringify(response));
  } });

  let disposableSession;
  let listId;
  await assert.rejects(async () => {
    try {
      disposableSession = (await tmdb.authentication.createSession('approved-token')).session_id;
      const session = { sessionId: disposableSession };
      listId = (await tmdb.lists.create({ name: 'Disposable test list', sessionId: disposableSession })).list_id;
      await tmdb.lists.addMovie(listId, 550, session);
      await tmdb.lists.removeMovie(listId, 550, session);
      await tmdb.lists.addMovie(listId, 550, session);
      await tmdb.lists.clear(listId, { ...session, confirm: true });
      await tmdb.accounts.setFavorite(548, 'movie', 550, true, session);
      await tmdb.accounts.setWatchlist(548, 'tv', 1399, false, session);
      await tmdb.movies.rate(550, 8.5, session);
      await tmdb.tv.rate(1399, 8.5, session);
      throw new Error('simulated failure after writes');
    } finally {
      if (disposableSession) {
        const session = { sessionId: disposableSession };
        if (listId) await tmdb.lists.delete(listId, session);
        await tmdb.accounts.setFavorite(548, 'movie', 550, initial.favorite, session);
        await tmdb.accounts.setWatchlist(548, 'tv', 1399, initial.watchlist, session);
        await tmdb.movies.rate(550, initial.movieRating, session);
        await tmdb.tv.deleteRating(1399, session);
        await tmdb.authentication.deleteSession(disposableSession);
      }
    }
  }, /simulated failure after writes/);

  assert.deepEqual(state, initial);
  assert.ok(calls.includes('POST /3/list/1/clear'));
  assert.ok(calls.includes('DELETE /3/list/1'));
  assert.equal(calls.at(-1), 'DELETE /3/authentication/session');
});
