# Migrating to 1.0.0

`tmdb-lumosovich` 1.0.0 keeps the public `Lumosovich` class and method names from 0.11.0. It completes and audits all 152 operations in the pinned TMDB v3 OpenAPI snapshot. Existing 0.11.0 callers do not need to change their method calls.

Update the dependency with `npm install tmdb-lumosovich@^1.0.0`. The package supports Node.js 22 or newer and provides ESM and CommonJS entry points with TypeScript declarations. Responses continue to expose TMDB's raw `snake_case` fields.

If you still depend on the older `lumosovich` package, replace it with `tmdb-lumosovich` and change import or `require()` specifiers. The exported class remains `Lumosovich`:

```js
import { Lumosovich } from 'tmdb-lumosovich';
const tmdb = new Lumosovich({ apiKey: process.env.TMDB_API_KEY });
```

Provide exactly one v3 API key or API Read Access Token to the constructor. Account, list, rating and user-session operations need an explicit TMDB user `sessionId`; guest rating methods use `guestSessionId`. The client now includes the [request-token approval flow](https://developer.themoviedb.org/reference/authentication-how-do-i-generate-a-session-id) through `tmdb.authentication`. Keep credentials and session IDs in private runtime settings.

The release changes no endpoint method signatures from 0.11.0. If upgrading from an earlier 0.x version, use the [changelog](https://github.com/namipsg/lumosovich/blob/main/CHANGELOG.md) to find the group that introduced each method. The [parity audit](https://github.com/namipsg/lumosovich/blob/main/docs/parity-audit.md) describes what full coverage verifies and the limits of live write testing.
