## Context

`sqlEdited` is true whenever the SQL buffer holds text that differs from the SQL last generated from the
builder — which is exactly "the builder does not reflect this SQL". The guard additionally required the
SQL view to be active, which held while the SQL view was the only way text reached the buffer. The AI
view's raw-SQL fallback added a second way.

## Decisions

### Drop the view condition, keep the buffer one

`leaveSqlBuffer` translates `sqlText` and switches to the requested view; nothing in it depends on the
view being left. Removing `isSqlView` routes every structured-view switch with a pending buffer through it.
The JSON view never holds a pending buffer (leaving SQL for JSON clears it on success, and confirming
clears it otherwise), so its own diverged-JSON guard is unaffected — provided an AI message cannot finish
loading after the user has already left the AI view.

### Disable the switcher while a message loads

Loading a message awaits the translation, and the schema read when hydrating. A switch made meanwhile
would let the raw-SQL fallback fill the buffer under JSON or Form, and the next Form ↔ JSON switch would
translate that SQL instead of what the user just edited. Disabling the switcher for the round trip is
simpler than making the fallback check which view it lands in, and the wait is one request.

A representable AI run clears the buffer, so switching after it stays silent — covered by a test so the
guard does not start prompting where nothing would be lost.
