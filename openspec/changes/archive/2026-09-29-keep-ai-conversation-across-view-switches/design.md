## Context

`QueryBuilder` renders exactly one rail body at a time, and the whole rail unmounts when collapsed. The
loaded-message index lived in `QueryBuilder`, the transcript it indexes into lived in `AiPanel`, so the two
had different lifetimes and drifted apart on every remount.

## Decisions

### Lift the conversation, don't keep the panel mounted

Keeping `AiPanel` mounted and hidden while another view shows would fix view switching, but not the rail
collapse, which unmounts the rail as a whole. Lifting the transcript into a hook owned by the page gives it
the same lifetime as the loaded index it pairs with, whichever way the panel unmounts. The panel stays
remounted by `aiConversationKey` on an entity switch, which now only clears the prompt draft.

### A generation counter guards the reset

With the transcript in the page, a reply still in flight when the user switches entities would otherwise
land in the fresh conversation. `reset` bumps a ref, and `send` drops a reply whose generation no longer
matches — the same effect the old unmount gave for free.

### Transit failure falls back to SQL

`leaveSqlBuffer` already treats a rejected `translateSqlToQuery` like a refused one. Running a message
follows it: the raw SQL is shown and executed, and a `finally` clears `aiLoading` even when hydration
rejects.

## Risks / Trade-offs

- The prompt draft is still lost on a view switch, since it stays in the panel. Acceptable: nothing marks
  it as loaded, so it cannot drift into a wrong state.
