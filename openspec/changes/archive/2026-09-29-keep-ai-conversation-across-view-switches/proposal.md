## Why

Leaving the Query Builder's AI view — to SQL, JSON or Form, or by collapsing the rail — unmounts the AI
panel, and the conversation lived in that panel's local state. Coming back showed an empty transcript,
while the page still remembered the *index* of the message whose Run was last clicked. The first new
reply at that index then rendered with its Run disabled, as if it were the loaded query, although it had
never run. Reported as "Run is disabled after AI → SQL → AI".

A second path to the same symptom: running a message awaited the SQL translation and the builder
hydration with no guard, so a rejection in transit left `aiLoading` set and every Run in the transcript
disabled until the page reloaded.

## What Changes

- The conversation (messages, the in-flight send) moves out of `AiPanel` into a `useAiConversation` hook
  held by `QueryBuilder`, so it outlives the panel's mount. The panel keeps only the prompt draft.
- Selecting a different entity still clears the conversation and the loaded marker, and now also drops a
  reply still in flight from the cleared conversation.
- Running a message treats a translation that fails in transit like a refused one (fall back to raw SQL,
  as leaving the SQL view already does), and always clears the in-flight flag.

## Non-goals

- Re-enabling a loaded message's Run after the user edits the builder. The marker means "last loaded",
  not "equal to the current builder query"; that distinction is unchanged.
- Persisting the conversation across page loads.

## Impact

- Affected specs: `analytics/query-builder`
- Affected code: `components/Analytics/QueryBuilder/QueryBuilder.tsx`,
  `components/Analytics/QueryBuilder/Ai/AiPanel.tsx`, new `components/Analytics/QueryBuilder/Ai/use-ai-conversation.ts`
