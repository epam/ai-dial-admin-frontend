# Design — a read-only JSON view of an ACTIVE table's definition

Read this in slices. Every section names, in its first line, the files it governs; find yours by
grepping for its path.

**Revision note 1 (placement reworked).** The first version of this design put the document in a
collapsible section inside the Properties body (`§D1`, and `§D8` reasoned from it). The owner saw it
running and rejected it: one thin disclosure row among a full column grid, which he could not find.
His instruction was that it be *the same JSON editor as on the draft screen, the only difference
being that nothing inside it can be changed*. `§D1` and `§D8` were replaced; `§D2`, `§D10` and `§D11`
were revised to match; `§D3`, `§D4`, `§D5`, `§D6`, `§D7` and `§D9` survived unchanged in substance.

**Revision note 2 (the surface loses its toolbar; the toggle becomes the last control).** The owner
saw the reworked placement running and asked for three things, in his order:

1. drop the **"JSON definition" heading** — the surface is reached by a toggle that already names it;
2. put the **copy control in the header, beside the JSON-editor toggle**;
3. **swap the toggle and Connect** — the toggle becomes the header's rightmost control.

Two consequences are not cosmetic and are decided here rather than absorbed. Revision 3 destroys the
"primary action last" clause that `§D1` was written to preserve, so `§D6a` supersedes that clause,
states the successor rule and names what the divergence costs against the one sibling toolbar that
still follows it. Revisions 1 and 2 together empty `TableDefinitionJson.tsx` of everything but one
element, so `§D2` decides its fate: **it is deleted and the editor is rendered inline in
`TableDetailView.tsx`.**

Sections replaced by revision 2: `§D1` (points 2 and 6), `§D2`, `§D6`, plus the new `§D6a`. Revised
to match: `§D3`, `§D5`, `§D9`, `§D10`, `§D11` and the risk list. Unchanged: `§D4`, `§D7`, `§D8`.

**One decided question, recorded so it is not reopened:** the copy control is offered **only while
the JSON view is on**, not permanently. A permanent control in the header would copy a document that
is not on screen, and it would contradict the delta's own "offered with the document". The owner
settled this; a later change that wants a permanent copy has to argue against that sentence.

**One correction to a fact this design asserted, measured by the implementer of 3.1 and folded in
below (`§D1`, "What was verified in code"):** `hasJsonErrors` is **not** `!isActive`-gated.

## Context

Files: `apps/ai-dial-admin/src/components/Analytics/Tables/TableDetailView.tsx`,
`apps/ai-dial-admin/src/components/Analytics/Tables/draft-document.ts`, and
`apps/ai-dial-admin/src/components/Analytics/Tables/TableDefinitionJson.tsx` — which **this change
creates and then deletes again**: it exists in the working tree from item 2.1 and `§D2` removes it.

This change is built on top of PR #4492's branch (`feat/4488-table-draft-json-editor`), so everything
`add-table-draft-schema-json-editor` shipped is already in the tree. Four facts from it decide most of
this design:

- `storedDocument` (`TableDetailView.tsx:133`) is `buildDraftDocument(table, draft.baselineDto)`,
  memoized on `[table, draft.baselineDto]`, and is already computed for **every** table, `ACTIVE`
  included. Nothing new has to be derived.
- The draft arrangement this change now copies is three lines of `TableDetailView.tsx`: the header
  control at `:474` (`canModify && <JsonToggle isEditorEnabled={…} onToggleEditor={…} />`), the whole-body
  swap at `:408` (`const draftSurface = isEditorEnabled ? draftEditor : properties;`), and the editor
  itself at `:381-390`.
- `EntityJsonEditor` (`components/EntityTabs/JsonEditor/JsonEditor.tsx`) takes `readonly` and forces
  `options.readOnly` on its Monaco instance (`:138`), and `setSelectedEntity` is optional (`:21`). A
  read-only caller therefore needs no new prop on a shared component.
- `apps/ai-dial-admin/src/app/[lang]/tables/[id]/page.tsx:35-37` already wraps the view in
  `SaveValidationContextProvider`, which `EntityJsonEditor` requires unconditionally. **No provider
  work is in scope.**

## Goals / Non-Goals

**Goals**

- Give an `ACTIVE` table the draft screen's arrangement, read-only: a header toggle that swaps the body
  for the definition as one JSON document.
- Make that document copyable in one action, with the confirmation announced.
- Reach every caller who can open the detail page — no permission gate, and no feature-flag gate.
- Change no *authoring* behaviour of the `ACTIVE` branch and none of the draft branch.

**Non-Goals**

- Any write from this surface (the proposal's Non-goals are binding).
- Any change to `Common/CopyButton`, `EntityJsonEditor`, `EntityHeaderControls/JsonToggle` or
  `Common/Accordion`. They are shared; the house rule is to use them, not to grow them for one caller.
- Any change to `openspec/changes/add-table-draft-schema-json-editor/**` — that directory belongs to an
  open PR and stays byte-identical to HEAD.

## Decisions

### D1 — Placement: the draft's header toggle and whole-body swap, on an ACTIVE table, read-only

Files: `apps/ai-dial-admin/src/components/Analytics/Tables/TableDetailView.tsx`,
`apps/ai-dial-admin/src/components/Analytics/Tables/TableDefinitionJson.tsx`.

The `ACTIVE` header gains the **same** `JsonToggle` the draft header carries, and turning it on replaces
the **whole body** — the Properties/Audit tab strip included — with the read-only document. Turning it
off restores the body exactly as it was. Five concrete points, all in `TableDetailView.tsx`:

1. **The control is `EntityHeaderControls/JsonToggle`, used unchanged.** It is a ui-kit `DialSwitch`
   labelled `EntitiesI18nKey.JSONEditor` with `switchId="jsonEditor"`
   (`EntityHeaderControls/JsonToggle/JsonToggle.tsx:41-46`). The label reads "JSON editor" on both
   statuses, which is right: it names the surface being switched to, the surface is the same Monaco
   editor, and it is the owner's own word for it. The hardcoded `switchId` is safe because a table is
   either `ACTIVE` or a draft, so only one instance is ever mounted. Reusing it also inherits the
   component's tablet/mobile behaviour for free, so the two statuses stay visually identical.
2. **It renders in the `isActive` arm of the header ternary, last — after Connect's block, in source
   order, which is also the rendered order.** *(Revision 3.)* The row reads Manage access, Delete
   table, Add columns, Add rows, Connect, **copy JSON definition** (only while the view is on),
   **JSON-editor toggle**. No CSS `order-*` is involved: source order is rendered order, which is what
   item 3.1's implementer already established when it declined the first version's "before Connect in
   the rendered row" phrasing. `§D6a` supersedes the consolidated spec's "primary action last" clause
   and states what replaces it.
3. **It is not permission-gated**, per BA's ruling and the delta. That forces one more edit: the
   header's action container is currently gated on
   `(canDelete || canWrite || canModify || canManageRoles || (isActive && canConnect))` (`:430`). An
   `ACTIVE` enrichment with no source table, viewed by a caller with no permissions, would render no
   container and therefore no toggle. The guard becomes
   `(isActive || canDelete || canWrite || canModify || canManageRoles)`: on an `ACTIVE` table the
   container always has at least the toggle in it. **Verified by item 3.1, child by child: the
   widening reveals nothing** — every child keeps its own gate, the dropped `(isActive && canConnect)`
   term is subsumed by `isActive`, and for a non-`ACTIVE` table the guard is arithmetically identical
   to the old one. The only newly reachable render is the container itself, holding the toggle alone.
4. **The body swap is status-aware.** The current body is
   `featureFlags.analyticsEnabled && isActive ? <tabbed> : draftSurface`. It becomes: on an `ACTIVE`
   table, `isEditorEnabled ? definitionJson : (featureFlags.analyticsEnabled ? <tabbed> : properties)`;
   on a draft, `draftSurface` unchanged. With analytics off, the toggle swaps the un-tabbed Properties
   body for the document — the same control, the same meaning, one branch fewer on screen.
5. **`onToggleEditor` must not seed a draft document on an `ACTIVE` table.** It currently seeds
   `draftDocument` on first entry (`:251-254`). Guard it: `if (!isActive && !draftDocument) …`. The
   read-only surface reads `storedDocument`, never `draftDocument`, so nothing on the `ACTIVE` branch
   needs the seed, and a seeded `draftDocument` there would be dead state that `isDocumentChanged`
   (`:135`) compares for no reason.

6. **The copy control sits in the same arm, immediately before the toggle, gated on
   `isActive && isEditorEnabled`.** *(Revision 2.)* Its props are `§D6`'s, unchanged; what changes is
   the file it lives in. Two properties of this slot are worth stating because they are the reason it
   is not merely acceptable but better than the toolbar it replaces: the control is present exactly
   when the document is, without a second visibility rule to keep in sync; and because the **toggle**
   is the control that persists and the **copy** is the one that mounts and unmounts, keyboard focus
   after a toggle-off is still on a control that exists. Had the order been reversed — toggle then
   copy — turning the view off would unmount the element to the right of the focused one, which is
   harmless, but turning it *on* would insert a control between the focused toggle and its
   neighbours, which is the shuffle this order avoids. No live region is needed for the appearance:
   `JsonToggle` is a `DialSwitch`, so the state change that causes it is already announced as the
   switch's own checked state.

**What was verified in code by item 3.1's implementer, so it is fact rather than inference.** Readers
of `isEditorEnabled` in `TableDetailView.tsx` are exactly five — `hasJsonErrors`, `onTryToSave`,
`draftSurface`, `disableSave` and the toggle — with no sixth, and no other component reads it.
Two corrections to what this section claimed:

- **`hasJsonErrors` is NOT `!isActive`-gated.** It is `isEditorEnabled && Boolean(jsonErrors?.length)`,
  and the read-only editor **does** register markers: `readonly` only sets Monaco's `readOnly` option,
  while `onValidateJSON → setJsonErrors` runs regardless. What is gated is its **sole** consumer,
  `isChangeBarShown` (`!isActive && canModify && …`). So the safety comes from that consumer, not from
  the expression itself. The conclusion — one boolean can carry both meanings — stands; the reasoning
  behind it was wrong and is corrected here so a later change does not rely on a gate that is not there.
- **`draftSurface` was reachable on an `ACTIVE` table** before edit 4, on the analytics-off path.
  Without edit 4 an analytics-off install would have got the *editable* draft editor on a materialized
  table. That is why edit 4 is not cosmetic.

**The materialize interaction, which is a real defect if it is missed.** `reload()` calls `setTable`
without remounting, and nothing resets `isEditorEnabled`. Today that is invisible, because the `ACTIVE`
branch ignores `isEditorEnabled` entirely. Under this placement it stops being invisible: an author who
saves a `PENDING` table from its JSON editor would land, the moment the refreshed table reads `ACTIVE`,
on the read-only JSON view — while the consolidated spec says "On success the view SHALL refresh
showing the table `ACTIVE` with its live column surface"
(`openspec/specs/analytics/tables/spec.md:502`). So `onDefineSchema` (`:200-212`) sets
`setIsEditorEnabled(false)` on success. One line, and it also fixes the same latent oddity that exists
today on an analytics-off install.

**The reset sits before `await reload()`, deliberately** — established by item 3.1 and recorded so it
is not "tidied" later. An effect keyed on `table.status` could only run after the `setTable` commit,
so it would necessarily render one committed frame of ACTIVE-plus-open-editor: exactly the state the
spec forbids. Resetting first makes the intermediate state (still `PENDING`, editor off) a surface the
reader may legitimately see. The failure branch is untouched: a rejected schema request leaves the
author in the editor with their document.

**What happens to the Audit tab while the editor is on, and how the reader gets back.** The tab strip
is unmounted with the rest of the body, so Audit is not reachable until the toggle is switched off. The
toggle stays in the header in both states — `JsonToggle` renders its switch whether or not
`isEditorEnabled` — so the way back is always on screen, one click, in the place the reader just
clicked. `activeTab` is React state that the toggle never touches, so switching off returns the reader
to the tab they were on, Audit included. The cost is that `TableAudit` unmounts and remounts across a
visit to the JSON view, re-issuing its activity request; that is the same cost a tab switch already
has, and it is why the change bar and the tab state are the only things this surface must not disturb.

**Alternative rejected — make the JSON view the Properties tab's content and leave the tab strip
standing.** It keeps Audit reachable without toggling off, which is its one genuine advantage, and it
is small. Four costs outweigh it: (a) the same control would mean "swap the whole body" on a draft and
"swap one tab's content" on an `ACTIVE` table — two behaviours for one switch, which is the class of
thing the owner has just rejected once; (b) with `ANALYTICS_ENABLED` off there is no tab strip at all,
so the control would have to swap the whole body anyway — a third behaviour; (c) the reader would see a
tab strip whose selected tab reads "Properties" above a JSON document, which mislabels the surface;
(d) the editor would be squeezed under a strip it has nothing to do with, which is a smaller version of
the visibility complaint that caused this rework.

**Alternative rejected — a collapsible section inside the Properties body.** This is what shipped and
what the owner rejected on sight; it is recorded here so it is not re-proposed. Its arguments were
reachability with analytics off (which point 4 above satisfies just as well) and collision-freedom with
two unmerged deltas (which `§D8` now handles head-on). Neither survives contact with the fact that a
disclosure row below a keys summary and above a full-height grid is, in practice, invisible.

**Alternative rejected — a third tab beside Properties and Audit.** `analytics/spec.md`, the Analytics
root index shared by every Analytics detail page, specifies "exactly two tabs, `Properties` and
`Audit`". A tables-only third tab degrades a shared index, and it would also disappear with the strip
when `ANALYTICS_ENABLED` is off.

**What would change this decision.** If the Audit tab turns out to be something readers want *while*
comparing a definition, the tab-content variant becomes worth its costs — but that is a request for
two surfaces at once, and it should be designed as one (a split view), not by weakening this toggle.

### D2 — `TableDefinitionJson.tsx` is deleted; the read-only editor is rendered inline

Files: `apps/ai-dial-admin/src/components/Analytics/Tables/TableDefinitionJson.tsx` (**deleted**),
`apps/ai-dial-admin/src/components/Analytics/Tables/tests/TableDefinitionJson.spec.tsx` (**deleted**),
`apps/ai-dial-admin/src/components/Analytics/Tables/TableDetailView.tsx` (gains the inline surface).

*(Revised by revision 2. The previous version of this section specified a toolbar with an `<h3>`
heading and the copy control; revisions 1 and 2 remove both.)*

**The question the owner asked, answered plainly.** With the heading gone (revision 1) and the copy
control in the header (revision 2), the component's whole body would be:

```tsx
<div className="flex min-h-0 flex-1 flex-col overflow-auto">
  <EntityJsonEditor entity={document} readonly />
</div>
```

That does not earn a file. It is a `'use client'` module, six imports, a `Props` interface whose only
member is passed straight through, a default export and a spec file — around one element of a shared
component. Three things decide it:

1. **Its sibling is already inline.** The draft's editable editor is a plain const in
   `TableDetailView.tsx` (`draftEditor`, `:387-396`) with exactly this markup and one prop different
   (`setSelectedEntity` instead of `readonly`). Extracting one of two identically shaped surfaces and
   not the other is a worse arrangement than leaving both where they are, and it invites the next
   reader to wonder what the asymmetry means.
2. **`.claude/rules/components.md` §3 extracts for size or for unrelated concerns.** Neither applies
   to a pass-through. The rule that does apply is the same file's "keep the component simple; logic
   lives elsewhere" — and there is no logic here at all.
3. **`§D3`'s by-reference rule gets shorter.** `storedDocument` goes from its `useMemo` straight into
   `EntityJsonEditor` in the same file, with no prop hop in between where a clone could be introduced.

So `TableDetailView.tsx` gains, beside `draftEditor`:

```tsx
const definitionJson = (
  <div className="flex min-h-0 flex-1 flex-col overflow-auto">
    <EntityJsonEditor entity={storedDocument} readonly />
  </div>
);
```

Tailwind theme tokens only; no hex, no stock palette. The fixed `h-[320px]` box the collapsible
version used is long gone — this surface owns the body and takes its height.

**What the deletion costs, and why it is affordable.** `TableDetailView.tsx` grows by about five
lines, in a file two changes in flight both touch — a merge-conflict surface, but a five-line one in a
region (`:376-416`) that only this change edits. And `tests/TableDefinitionJson.spec.tsx` goes with
the component: of its cases, the copy ones move to the header's spec anyway (revision 2), the heading
one dies (revision 1), and the single remaining case — typing into the editor leaves it unchanged —
moves to `TableDetailView.spec.tsx` (`§D10`). One case does not keep a spec file alive for a component
that no longer exists.

**Alternative rejected — keep the component with `Props { document }` unchanged.** Cheapest in churn:
item 2.1 becomes a small deletion inside a file that already exists, and item 2.2 loses two cases
instead of the whole file. It also keeps `TableDetailView.tsx` from growing. Rejected because the
churn saved is one-off and the wrapper is permanent: every later reader pays the cost of opening a
file to find one element, and the asymmetry with `draftEditor` never resolves itself. If the read-only
surface ever grows something of its own — a diff against another environment, a download action — the
extraction is three lines away and can be made then, on evidence.

**Alternative rejected — keep the component and move the copy control back into it.** That is
revision 2 undone; it is the owner's call, not a design trade-off, and `§D6` records why the header
slot is also the better one.

**Alternative rejected — a "read-only" badge or a reworded heading.** Recorded from the previous
version because it is the obvious response to revision 1: Monaco's read-only mode is not visually
loud, so a label saying so is tempting. It is not free — the same i18n key is the copy control's
`valueLabel`, so "JSON definition (read-only)" would become the accessible name "copy JSON definition
(read-only)" and the toast "JSON definition (read-only) Copied successfully" — and revision 1 removed
the heading precisely because the toggle already names the surface. The absence of Save/Discard and
Monaco's own read-only behaviour are the signals. If readers turn out to try typing, a distinct key
is the cheap follow-up.

**Alternative rejected — `Common/Accordion`.** Moot twice over now, but recorded because the first
version examined it: it renders children while collapsed behind a `hidden` class
(`Accordion.tsx:89-98`), so Monaco would have mounted on every page load, and its toggle carries no
`aria-expanded`/`aria-controls` (`:69-79`).

### D3 — The document object is passed by reference; nothing re-derives it

File: `apps/ai-dial-admin/src/components/Analytics/Tables/TableDetailView.tsx`.

`TableDetailView` hands its existing memoized `storedDocument` (`:133`) straight to
`<EntityJsonEditor entity={storedDocument} readonly />` — since `§D2` deletes the wrapper component,
there is now no hop at all. It must not be rebuilt, cloned or spread on the
way. `EntityJsonEditor` re-creates its Monaco model whenever `entity` is not *identically* the object it
last saw (`JsonEditor.tsx:86-92`, and the note at `TableDetailView.tsx:376-380`): a fresh object per
render means a remount per render. Read-only makes that less visible than in the draft editor — there
is no cursor to throw away — but a remount per parent render is still wrong, and jsdom cannot catch it.
One derivation, one owner, passed by reference. A short call-site comment saying so is warranted;
nothing in the types protects it.

Under the reworked placement the hop through `TableProperties` is gone, and under `§D2` the hop
through `TableDefinitionJson` is gone too — the memo and the editor are now three lines apart in one
file, which removes every place this rule could have been broken by accident.

**Do not confuse the two representations.** `formatDraftDocument(storedDocument)` (`§D4`) is the copy
control's `value` — a string. `EntityJsonEditor` takes the **object**. Passing the formatted string to
the editor, or re-parsing the string back into an object for it, both break this rule.

### D4 — The copied text comes from a pure formatter in `draft-document.ts`

Files: `apps/ai-dial-admin/src/components/Analytics/Tables/draft-document.ts`,
`apps/ai-dial-admin/src/components/Analytics/Tables/TableDefinitionJson.tsx`. **Implemented already;
unaffected by the rework.**

The spec requires the clipboard to hold *the text the view displays*, character for character.
`EntityJsonEditor` serializes with `JSON.stringify(entity, null, 4)` (`JsonEditor.tsx:90`), so the copy
uses the same formatting:

```ts
export const formatDraftDocument = (document: DraftTableDocument): string => /* 4-space JSON */;
```

beside the two functions that already own this document's shape contract, with a comment naming
`JsonEditor.tsx:90` as the format it mirrors. Pure, deterministic and feature-local, which is where
`.claude/rules/utils.md` puts it.

**Alternative rejected — reading the text out of the Monaco model.** It would guarantee identity with
what is displayed, but it needs a ref into a shared component that exposes none. A pure formatter plus
a unit test asserting equality with `JSON.stringify(doc, null, 4)` is the cheaper guarantee.

### D5 — Read-only is `readonly` plus the absence of `setSelectedEntity`

File: `apps/ai-dial-admin/src/components/Analytics/Tables/TableDetailView.tsx` (the inline
`definitionJson` of `§D2`; this section governed `TableDefinitionJson.tsx` before revision 2).

`<EntityJsonEditor entity={storedDocument} readonly />` — no `setSelectedEntity`, no `setIsChanged`,
no `onChangeText`. Both halves matter: `readonly` makes Monaco reject input, and omitting
`setSelectedEntity` means that even if input somehow arrived, `onChangeJSON` (`JsonEditor.tsx:94-114`)
has nowhere to write it. Note that now the editor is inline in `TableDetailView`, "nowhere to write
it" is a statement about the props, not about the file: `setDraftDocument` is in scope at that call
site and must not be passed. That is the one thing the deleted wrapper made structurally impossible
and inlining makes merely a rule — it is called out in the task for that reason.

Two consequences to know rather than to handle:

- The editor registers with `SaveValidationContext` through `useJsonEditorValidation()` and deregisters
  on unmount (`JsonEditor.tsx:58-77`). On an `ACTIVE` table the change bar is gated on `!isActive`
  (`TableDetailView.tsx:140`), so nothing this editor reports can raise Save or Discard.
- The document is serialized from an object, so it is always valid JSON and the editor's validation can
  never produce a marker.

### D6 — The copy confirmation rides the existing notification container, which **is** announced

Files: `apps/ai-dial-admin/src/components/Analytics/Tables/TableDetailView.tsx` (**the control now
renders here, in the header** — revision 2; it was in `TableDefinitionJson.tsx`'s toolbar before),
`apps/ai-dial-admin/src/components/Common/CopyButton/CopyButton.tsx` (used unchanged),
`apps/ai-dial-admin/src/components/Notification/NotificationPortal.tsx` (read, not changed).

**The slot, and the gate.** `{isActive && isEditorEnabled && <CopyButton … />}`, rendered immediately
before the `JsonToggle` in the `isActive` arm of the header (`§D1` point 6). The `isActive` half of
the gate matters as much as the other: a draft's header carries the same toggle, and the copy control
must not follow it there — the draft's document is editable and unsaved, so a copy of it would be a
copy of something the table does not hold.

**`value` is memoized.** `formatDraftDocument(storedDocument)` is a full `JSON.stringify` of the
definition, and `TableDetailView` re-renders on every one of its many local state flags (popup open
flags, the tab, the access panel). Wrap it: `useMemo(() => formatDraftDocument(storedDocument),
[storedDocument])`. This is the case `.claude/rules/components.md` §8 means by "where render cost
matters" — a table with hundreds of columns re-serialized on every popup toggle — and it is not
indiscriminate memoization, because the input is itself a memo with a stable identity.

`.claude/rules/a11y.md` requires verifying that the notification container is itself announced when a
result is surfaced only through `NotificationContext`. **Verified, not assumed:**
`NotificationPortal.tsx:15` renders the list inside `<div role="status" aria-live="polite" …>` portalled
into `document.body`. That is a polite live region, distinct from `CopyButton`'s own accessible name
(`copy ${valueLabel}`, `CopyButton.tsx:26`), which the copy does not change. **So no local live region
is needed and none is added** — a second region here would double-announce every copy in the console.

`CopyButton` is used as it stands, in its **icon-only** variant: `valueLabel={t(AnalyticsTablesI18nKey.JsonDefinition)}`,
`value={copyText}` (the memo above), `size={ElementSize.Small}`, and it no-ops unless **both**
`value` and `valueLabel` are given (`CopyButton.tsx:29`). **`buttonLabel` is deliberately not passed**,
and the reason was **measured on this change**, by a real render plus an isolated probe of the two
variants at `CopyButton.tsx:35-51`: with `buttonLabel` the component renders a ui-kit
`DialNeutralButton` and hands it `aria-label={copyLabel}`, but **`DialNeutralButton` discards a
caller-supplied `aria-label`**, so the accessible name collapses to the visible label alone — "Copy".
Without `buttonLabel` it renders a ui-kit `DialIconButton`, which honours the attribute, and the name is
`copy <valueLabel>` exactly as `CopyButton.tsx:26` intends. The delta's scenario **The copy control is
offered with the document** requires a control "whose accessible name states that it copies the table's
JSON definition", and "Copy" does not state that. The trade-off is accepted rather than hidden: the
icon-only control carries **no visible text label**, so sighted discoverability rests on the copy glyph
and its position in the toolbar, and everything else rests on the accessible name.

Rejected alternatives: adding a prop to the shared `CopyButton` so the neutral variant could carry a
distinct name — a new prop on a `Common/*` component to fit one caller; patching the ui-kit component —
vendor internals are out of scope per `.claude/rules/a11y.md`; and relaxing the scenario to accept
"Copy", which drops the requirement instead of meeting it. Note that the discarded `aria-label` is a
**ui-kit gap affecting every call site in this repository that passes `buttonLabel` to `CopyButton`**.
Fixing it belongs upstream.

One honest limitation, recorded rather than fixed: the container mounts only while at least one
notification exists (`NotificationContext.tsx:57`). A live region inserted together with its content is
announced by current browser/AT combinations but is a weaker construction than a region that is always
present. Fixing it means changing a shared provider used by the whole console — out of scope here.

### D6a — Superseding "the primary action last", and what that costs

File: `openspec/changes/add-active-table-json-view/specs/analytics/tables/spec.md`, the `MODIFIED`
block on **`### Requirement: Table detail gates edits by per-table permissions`**. The target lives in
`openspec/specs/analytics/tables/spec.md:215`, its order bullet at `:225` and its scenario at `:271`.

*(New in revision 2. The previous `§D1` chose the slot **before** Connect precisely so this clause
would survive verbatim. Revision 3 removes that option, so the clause is superseded rather than
preserved.)*

**Superseded, verbatim as it stands in the consolidated spec (`:225`):**

> - Header actions SHALL be ordered **Manage access, Delete table, Add columns, Add rows, Connect** —
>   the primary action last, where the header's primary action already sits. A not-yet-`ACTIVE` table
>   shows neither Connect nor the two Add buttons, and shows **Save** in their place — see "Define and
>   materialize a table schema".

**And its scenario, verbatim (`:271-274`):**

> #### Scenario: Header actions follow the fixed order
>
> - **WHEN** the detail header renders for a user with every permission on an `ACTIVE` table
> - **THEN** the actions appear in the order Manage access, Delete table, Add columns, Add rows, Connect

**What replaces it.** The order becomes **Manage access, Delete table, Add columns, Add rows,
Connect, copy JSON definition, JSON-editor toggle** — the toggle last, after the primary Connect, the
copy control immediately before it and present only while the JSON view is on. Connect remains the
header's only primary action and remains the last **action**; it is no longer the last **control**.

**What the clause was protecting, taken seriously before rewriting it.** Two things, and they are not
the same:

1. *Exactly one primary action per header.* This is stated separately, in `### Requirement: Table
   detail Connect panel` (`:873`): "**Connect** SHALL be the header's primary action, so an `ACTIVE`
   table always presents exactly one primary action whatever the viewer's permissions are." That
   sentence makes **no positional claim**, so it is untouched by this change and stays true — worth
   saying because it is the requirement a reader would expect to have to modify and does not. The
   scenario "Add actions keep a fixed emphasis" (`:244-248`), whose second THEN is "**Connect** is the
   only primary action in the header", likewise survives verbatim.
2. *Positional consistency: the emphasized control terminates the row.* This is the part that dies,
   and it is a real convention, not a local accident. The only other place in the consolidated specs
   that fixes a control order for this console states the same shape:
   `openspec/specs/analytics/query-builder/spec.md:57` — "…then right-aligned the query's own
   actions — Edit, Discard, and Save — followed by **Copy and the Run primary action**." The query
   page therefore puts **Copy immediately before the primary**, and the primary last. This change
   inverts both: the primary is not last, and Copy comes **after** it.

**The cost, accepted and named.** A reader who learns the console's toolbar grammar on the query page
(`/queries/[id]`) does not carry it to a table detail header. Two surfaces, two orders, no rule
distinguishing them from the outside — the divergence is exactly one page wide today, and it will read
as an inconsistency in review. It is accepted because the owner asked for it after seeing both, and
because the toggle is genuinely a different kind of control from Run and Connect: it changes what the
page shows rather than doing something, and it is the control the reader must find again to get back.

**The successor rule, so the next addition is not a guess.** "Primary last" was doing work beyond
aesthetics: it told whoever added a header control where to put it. Deleting it without a replacement
would leave the next author with a precedent to imitate and no rule. The replacement, written into the
`MODIFIED` bullet: **actions on the table come before Connect; controls that act on the view come
after it, in the order they were added.** Under that rule the copy control is a view control (it
copies what the view shows) and sits after Connect, and a hypothetical future "Export definition"
that hits the service would sit before it.

**Alternative rejected — keep "primary last" and put the toggle before Connect.** This is what `§D1`
originally chose, for exactly this reason. Rejected because the owner instructed otherwise after
seeing it, and because "do not silently delete a rule" is satisfied by superseding it here rather than
by refusing the instruction.

**Alternative rejected — move Connect out of the primary style so nothing is "primary last" to
violate.** It would make the order question vanish, and it is worse on every other axis: it
contradicts `:873`'s "exactly one primary action", it demotes the page's actual primary task
(connecting a client to the table) for the sake of a layout rule, and it is scope this change was
not asked for.

**Alternative rejected — also reorder the query page so both match.** Consistency restored, at the
price of changing a page this change has no business in, on no request, with its own spec, tests and
review. If the inconsistency proves to matter, that is the follow-up — and it should be argued as a
console-wide toolbar convention, not smuggled in here.

### D7 — Confirmed: the baseline is faithful for a materialized table

Files read, not changed: `apps/ai-dial-admin/src/components/Analytics/Tables/use-draft-schema-form.ts`,
`apps/ai-dial-admin/src/components/Analytics/Tables/utils.ts`.

The proposal flagged this as unconfirmed. It is true, so it is a footnote rather than a task:

- `baselineDto` is `buildDraftSchemaDto(createDraftSchemaForm(table), table.type)`
  (`use-draft-schema-form.ts:110`), i.e. derived from `table` alone, not from the live form — so it is
  the *stored* definition at all times, on an `ACTIVE` table as much as on a draft.
- `createDraftSchemaForm` → `toColumnRows` (`utils.ts:100-113`) carries every per-column member the
  model declares: `source_name`, `name`, `type`, `element_type`, `enum_values`, `tag`, `display_name`,
  `description`, `nullable`, `sensitive`. `buildDraftSchemaDto` → `toTableColumns` (`utils.ts:211-232`)
  re-emits all of them, omitting the blank ones — matching the draft editor's "absent rather than
  present and empty" rule.
- **A post-materialization rename is carried correctly.** The rename changes the exposed `name` while
  `source_name` keeps the physical name, and the two travel separately through both functions.
- An enrichment's grain key is a hidden physical column and is never in `table.columns`
  (`TableDetailView.tsx:338`), but `grain_key` reaches the document from `table.grain.grain_key`
  (`utils.ts:122`), so nothing is lost.

The one member the document does not carry is an enrichment's `source_table`, which the proposal
already accepted as a create-time identity field.

### D8 — Sequencing: three MODIFIED requirements, and an archive order nothing enforces

File: `openspec/changes/add-active-table-json-view/specs/analytics/tables/spec.md`.

**This replaces the first version's `§D8`, which argued the delta was ADDED-only *by placement*. That
reasoning is void: a header control on an `ACTIVE` table is exactly what those requirements said would
not exist.** The delta now carries a `## MODIFIED Requirements` section with three entries.

1. **`### Requirement: Table detail gates edits by per-table permissions`** — lives in
   `openspec/specs/analytics/tables/spec.md:215`, so this one modifies a target that really exists. It
   gains a bullet for the toggle's permission rule and its order bullet gains an entry: *Manage access,
   Delete table, Add columns, Add rows, JSON-editor toggle, Connect*. Its scenario "Header actions
   follow the fixed order" (`:271`) and "A system table still offers Connect" (`:260`) are amended with
   it.
2. **`### Requirement: JSON editor for a table draft`** — lives **only** in PR #4492's unmerged delta
   (`openspec/changes/add-table-draft-schema-json-editor/specs/analytics/tables/spec.md:3`). Two
   statements in it become false under this placement, and both are superseded here. Verbatim, as they
   stand in that delta:
   - prose: *"The toggle SHALL NOT be offered on an `ACTIVE` table, whose schema is patched through the
     scoped add/drop/rename/update surface instead."*
   - scenario clause, under "The editor toggle takes over the draft surface": *"**AND** on an `ACTIVE`
     table no such toggle is offered"*

   The replacement distinguishes the authoring editor from the read-only view rather than forbidding
   both, which is what BA's Impact section asked for.
3. **`### Requirement: A changed table draft's header offers Discard and Save`** — same file, `:109`.
   Two more statements, verbatim:
   - prose: *"Nothing about an `ACTIVE` table SHALL change. The changed-entity header SHALL NOT be
     presented there, and that view's own actions — Add columns, Add rows, Connect — SHALL be presented
     exactly as today."*
   - `#### Scenario: An ACTIVE table's header is untouched` (`:177`), whose title asserts the
     untouched-ness the header no longer has. It is retitled "An ACTIVE table's header offers neither
     Discard nor Save" and its second THEN names the added toggle.

   Read strictly, that scenario's own THEN clauses stay true — the five named actions *are* presented
   exactly as before; a sixth control is added beside them. It is modified anyway, on EM's decision,
   because the title states something broader than its clauses do and a reader will believe the title.

**Each MODIFIED block carries its requirement whole — every paragraph and every scenario — not just the
sentences that changed.** An archive fold replaces the named requirement with the block's contents, so a
partial copy would silently delete the other nine or ten scenarios of a requirement this change barely
touches. That is the whole risk of entries 2 and 3, and it is why they are long.

**The ordering constraint, and the fact that nothing enforces it.** Entries 2 and 3 name requirements
that reach `openspec/specs/analytics/tables/spec.md` only when **#4492 merges and is archived**. So:

> **#4492 (`add-table-draft-schema-json-editor`) MUST merge and be archived before this change is
> archived.** Archiving this one first folds two MODIFIED blocks against requirements that do not exist,
> and then #4492's archive would fold its *original* wording back over them — restoring both false
> statements with no diff to show for it.

`openspec validate --strict` will **not** catch a violation. That was measured on this very change: a
delta whose `## MODIFIED Requirements` block targeted `### Requirement: JSON editor for a table draft`,
absent from every consolidated spec, validated clean — `Change 'add-active-table-json-view' is valid`,
exit 0. The CLI checks the delta's own structure, not the existence of the target. The ordering is a
**human** constraint; it is repeated at the top of `tasks.md` and in its archive note, which is where
someone archiving would actually read it.

Editing #4492's own delta instead was not available: a third push to that branch would dismiss its
approval for the third time, which is precisely why the owner asked for a separate change.

### D9 — i18n

Files: `apps/ai-dial-admin/src/constants/i18n.ts`, `apps/ai-dial-admin/src/locales/en.ts`.
**Implemented already; unaffected by the rework.**

One key, and **it survives revision 1**. `AnalyticsTablesI18nKey` (`i18n.ts:2528`) carries
`JsonDefinition = 'AnalyticsTables.JsonDefinition'`, and the `AnalyticsTables` block in `en.ts`
(`:2815`) carries `JsonDefinition: 'JSON definition'`. Revision 1 removed the `<h3>` heading that was
one of its two uses; **the other use is load-bearing and stays**: it is the copy control's
`valueLabel`, which is what produces the accessible name "copy JSON definition" (`§D6`) and the toast
"JSON definition Copied successfully" (`CopyButton.tsx:26,31`). Removing the key would leave the
control announcing a bare "copy" and the toast unnamed, which the delta's scenarios forbid. **Item 1.2
therefore stands as done and must not be reverted.** The English is not reworded (see `§D2`'s rejected
"read-only" wording). The toggle needs no key of its own: `JsonToggle` supplies
`EntitiesI18nKey.JSONEditor`.

### D10 — Where each scenario is proved

Files: `apps/ai-dial-admin/src/components/Analytics/Tables/tests/draft-document.spec.ts`,
`.../tests/TableDetailView.spec.tsx`. Note what is **not** here, and why: `TableProperties.spec.tsx`
reverts with `TableProperties.tsx`, and `TableDefinitionJson.spec.tsx` is **deleted** with the
component (`§D2`), so `TableDetailView.spec.tsx` is now the only file that proves the surface.

- **`draft-document.spec.ts`** — the document's shape and the copy text: the source members, the
  enrichment members, the per-column metadata and the rename (`§D7`), and
  `formatDraftDocument(doc) === JSON.stringify(doc, null, 4)`. **Already written and green (13 cases);
  neither the placement rework nor revisions 1-3 reach it.**
- **`TableDetailView.spec.tsx`** — everything else. Grouped by what it proves:
  - *The header.* The toggle is present on an `ACTIVE` table for a caller with no permissions
    (`setPerms({})`, the pattern at `:867`); present with `featureFlags.analyticsEnabled` false (the
    flag is flipped at `:877`); the five existing header actions are unaffected; and **the rendered
    order puts the toggle last, after Connect** — assert on the DOM order of the accessible names
    within the header container, not on presence alone, because presence would pass under the old
    order too.
  - *The copy control.* Absent while the view is off; present once it is on, queryable by the
    accessible name `CopyButton` derives from `valueLabel` (`copy AnalyticsTables.JsonDefinition`, the
    mocked `t()` returning the key); positioned between Connect and the toggle; and activating it
    writes the whole formatted document to `navigator.clipboard.writeText`. Absent again after the
    view is toggled off, and absent on a `PENDING` table whose own editor is open. Use
    `fireEvent.click`, not `userEvent.click`: QA established empirically
    (`qa/review-batch-4-round-1.md` §1) that `userEvent` does not reach `CopyButton`'s icon-only
    variant in jsdom, and that `CopyButton.spec.tsx` has always used `fireEvent` for the same reason.
  - *The body.* Turning the toggle on removes the tab strip and the columns grid and shows the
    document; turning it off restores the strip on the tab that was selected, Audit included; no Save,
    no Discard and no changed-entity header appear while the view is on, and `updateTable`,
    `defineTableSchema` and `updateTableSchema` are never called from it (the file mocks the actions
    module wholesale at `:48`).
  - *Read-only observed as behaviour* — the one case inherited from the deleted
    `TableDefinitionJson.spec.tsx`: type into the editor and assert the value is unchanged.
  - *The materialize transition.* A successful save from a *draft's* JSON editor leaves the
    now-`ACTIVE` table on its live column surface with the toggle off.

**The `JsonEditorBase` mock has to change, and this is the one trap in the file.** It currently reads
(`:42-46`):

```tsx
vi.mock('@/src/components/Common/JsonEditorBase/JsonEditorBase', () => ({
  default: ({ value, onChange }: { value?: string; onChange: (v?: string) => void }) => (
    <textarea aria-label="rows-json" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));
```

It does **not** forward `options.readOnly`, and it hardcodes one label — so with the read-only editor
mounted in the body the Add-rows popup's textarea and the definition's textarea would be
indistinguishable, and the read-only assertion could not be written at all. The mock must accept
`options` and derive both from it: `readOnly={options?.readOnly}`, and an `aria-label` that differs
between the two mounts (`options?.readOnly` is the discriminator — `EntityJsonEditor` sets it only
under `readonly`). Existing assertions on `rows-json` must keep working, so the editable mount keeps
that label.

**The awkward assertion, called out so it is not quietly dropped.** The materialize case needs
`defineTableSchema` to resolve successfully and the subsequent `getTable` to answer with an `ACTIVE`
table, both from the same already-mocked module. If the existing harness cannot express that, the
honest fallback is to assert the toggle's own state after the save rather than the surface behind
it — but say so; do not drop the case.

### D11 — Browser verification: required by the criterion, waived by the owner on this run

Applying the house criterion honestly, most scenarios in this delta are browser-observable: their THEN
clauses describe an element present or absent, or text shown. The verification task is therefore
required and stays in `tasks.md` as item 4.1. What goes into the browser is a separate, much smaller
question, and the owner's instruction is critical paths only. This change crosses **no** backend
boundary and **no** route — the document is derived client-side from data the page already has. Two
scenarios still cross a boundary every unit test mocks away:

- **"The view cannot be edited"** — every unit test replaces Monaco with a textarea. Whether the real
  Monaco instance honours `options.readOnly`, and whether it renders at all inside a body-height flex
  container (the classic zero-height blank editor), is unprovable in jsdom. The rework raises this one's
  value: the container changed from a fixed 320px box to a flex-filled body.
- **"Copying places the whole displayed document on the clipboard"** — jsdom has no clipboard;
  `navigator.clipboard.writeText` is asserted as a spy. The real write, and the notification container
  actually appearing, exist only in a browser. Revision 2 moves the control into the header, which
  does not change what the browser is for here, but a pass should now also glance at whether an
  icon-only copy button reads as an affordance beside a switch and a primary button — that is a
  judgement no unit test makes.

Everything else — the document's shape, the permission independence, the flag independence, the body
swap, the absence of write requests — is unit-test territory and is not sent.

**On this run the owner waived the browser pass**: his local backend is down and he chose to ship
without it rather than bring it up. The task is kept, not dropped, and the waiver is recorded in
`plan.json` under `browser_verification.waiver` so a later run can pick the two scenarios up unchanged.

## Risks / Trade-offs

- **Audit is unreachable while the JSON view is on** (`§D1`). One click gets it back and the selected
  tab survives, but a reader who wants both at once cannot have them. This is the trade this placement
  makes, and it is the first thing to revisit if it bites.
- **`isEditorEnabled` now means two different things depending on `status`.** One boolean, two
  meanings — the authoring surface on a draft, the read-only surface on an `ACTIVE` table. The
  materialize reset (`§D1`) exists precisely because those two meanings meet at the moment a draft
  becomes active. A later change that introduces another status transition in place, or that lets an
  `ACTIVE` table revert, has to think about this flag again. Splitting it into two states would remove
  the hazard and duplicate the toggle wiring; it is not worth it for one transition, but that is the
  assumption most likely to be invalidated.
- **The header-order requirement is now modified by two changes in flight.** #4492 does not touch it, so
  today there is no conflict — but a third change that adds a header action on this page would collide
  with this delta, and openspec would not say so.
- **The copy text and the displayed text are kept identical by convention, not by construction**
  (`§D4`). `formatDraftDocument` mirrors `JsonEditor.tsx:90`. If a future change to the shared editor
  alters its indentation, the copy silently diverges; the unit test pins our side, nothing pins theirs.
- **The notification container mounts with its first notification** (`§D6`). If an AT combination is
  ever found not to announce it, every copy control in the console is affected, not just this one.
- **A second editor instance on the page.** `EntityJsonEditor` registers with `SaveValidationContext`.
  On an `ACTIVE` table nothing consumes those errors (`§D5`), but if a later change makes the `ACTIVE`
  branch reach for `jsonErrors`, this editor becomes one of its sources.
- **The archive order is unenforced** (`§D8`). The only protection is that it is written where an
  archiver reads.
- **Inlining the read-only editor puts `setDraftDocument` in scope at its call site** (`§D2`, `§D5`).
  The deleted wrapper made "the editor has nowhere to write" structurally true; inline it is a rule a
  future edit can break in one line, and `readonly` would keep the surface looking correct while the
  draft document silently changed underneath. The task states it explicitly and the spec's "no save
  path" case is the net that would catch it.
- **The header order diverges from the query page** (`§D6a`). One page wide today. If a third surface
  is added, the console needs a stated toolbar convention rather than two precedents.
- **The copy control is icon-only and now sits among labelled buttons** (`§D6`). In the deleted
  toolbar it was the only control in its row; in the header it competes with Manage access, Delete
  table, Add columns, Add rows and Connect, all of which carry visible text. Its accessible name is
  correct (that is why `buttonLabel` is omitted), but sighted discoverability now rests entirely on
  the copy glyph. This is the first thing to look at if readers report not finding the copy.
- **The copy text is serialized on render unless the memo of `§D6` is kept.** Easy to lose in a later
  refactor, invisible when it happens, and proportional to the table's column count.
