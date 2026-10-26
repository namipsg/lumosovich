# Testing operations that change TMDB data

The pinned TMDB v3 specification contains 17 POST or DELETE operations. Their reviewed cleanup and restoration paths are recorded in [`spec/write-cleanup.json`](../spec/write-cleanup.json). `test/write-lifecycle.test.mjs` exercises a failed workflow against an in-memory TMDB substitute and verifies that a temporary session, list, account flags, and ratings return to their starting state.

The supplied API key can test public reads and temporary token creation, but it is not a disposable TMDB user session. The project does not run account, list, rating, login, or session-deletion requests against a real account in CI or the default live smoke test.

For an opt-in live write test, use an account and list created only for testing. Before a mutation, record the existing favorite, watchlist, list-membership, and rating values. Restore those exact values in a `finally` block: setting a flag to `false` or deleting a rating is wrong when it was already present. Create a fresh list and user session, and delete them after the test, even when an assertion fails. Use `lists.clear()` only on that disposable list because clearing an existing list cannot reconstruct its previous order or contents.

| Write group | Restoration path |
| --- | --- |
| Account favorites and watchlist | Call the same method with each item's recorded prior boolean. |
| User sessions | Delete a newly created or converted session ID. Login validation alone only validates a temporary request token. |
| Lists | Delete lists created for the test. Remove an added movie or re-add a removed movie only if prior membership requires it. Clearing and deleting existing lists cannot be undone. |
| Movie, TV and episode ratings | Restore the prior numeric rating; delete a new rating only when no prior rating existed. |

After a live test, re-read affected account state and list contents. If cleanup fails, keep the disposable account out of subsequent tests until its state is reconciled. The offline tests prove request serialization and the demonstrated cleanup sequence; they cannot prove TMDB accepted a real account mutation or restored it.
