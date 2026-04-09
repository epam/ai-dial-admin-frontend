## Context

The `PublicationView` component passes `AuthButtons` as a child to `PublicationsHeader`, which renders them in a flex container alongside `PublicationsButtonsWrapper` (containing Discard/Save buttons):

```tsx
// PublicationsHeader.tsx:34-41
<div className="flex items-center gap-x-2">
  {children}  {/* AuthButtons component */}
  <PublicationsButtonsWrapper />
</div>
```

Currently, `PublicationView` always renders `AuthButtons`:

```tsx
// PublicationView.tsx:201-210 (current)
{view === ApplicationRoute.ToolsetPublications && toolset && (
  <AuthButtons
    selectedToolset={toolset}
    oAuthCode={oAuthCode}
    publicationName={publication.requestName}
    view={ApplicationRoute.ToolsetPublications}
    signInToolset={signInToolset}
    signOutToolset={signOutToolset}
  />
)}
```

Inside `AuthButtons`, the component checks if authentication type is NONE and returns `null`:

```tsx
// AuthButtons.tsx:154-169
{selectedToolset.authSettings?.authenticationType &&
selectedToolset.authSettings?.authenticationType !== ToolsetAuthType.NONE ? (
  isToolsetSignedIn ? (
    <DialNeutralButton label="Log Out" ... />
  ) : (
    <DialNeutralButton label="Log In" ... />
  )
) : null}
```

**The problem**: When switching from API Key auth → "Without authentication", the component transitions from rendering a button DOM node → `null`. The parent flex container recalculates with one fewer child, causing horizontal positioning to shift.

## Goals / Non-Goals

**Goals:**
- Fix horizontal misalignment when authentication type changes to NONE
- Ensure clean component mounting/unmounting behavior

**Non-Goals:**
- Changing button styling or layout structure
- Modifying AuthButtons component internals
- Adding new features to authentication flow

## Decisions

### Move conditional check to parent component

**Rationale**: Prevent `AuthButtons` from mounting at all when authentication type is NONE, rather than mounting and returning `null`. This ensures the parent flex container consistently has the correct number of children, avoiding layout recalculation issues.

**Implementation**: Add the same `authenticationType !== NONE` check used inside `AuthButtons` to the parent conditional in `PublicationView.tsx`:

```tsx
// PublicationView.tsx:201-210 (proposed)
{view === ApplicationRoute.ToolsetPublications &&
 toolset &&
 toolset.authSettings?.authenticationType &&
 toolset.authSettings?.authenticationType !== ToolsetAuthType.NONE && (
  <AuthButtons
    selectedToolset={toolset}
    oAuthCode={oAuthCode}
    publicationName={publication.requestName}
    view={ApplicationRoute.ToolsetPublications}
    signInToolset={signInToolset}
    signOutToolset={signOutToolset}
  />
)}
```

**Alternative considered**:
1. Wrap `AuthButtons` in a container div that always exists — adds unnecessary DOM node and doesn't fully solve the issue
2. Change `AuthButtons` to return an empty fragment instead of `null` — still renders the component unnecessarily and may not fix flex layout
3. Adjust spacing classes in `PublicationsHeader` conditionally — adds complexity and doesn't address root cause

**Why this approach is best**:
- Clean component lifecycle (unmount when not needed, mount when needed)
- Matches existing pattern used inside `AuthButtons` itself
- Minimal code change (1 file, 2 additional lines)
- No duplicate logic risk — both checks serve the same purpose
- Consistent with React best practices for conditional rendering

## Component Flow

**Before (buggy):**
```
1. API Key auth selected
   └─> AuthButtons mounts → renders button

2. Switch to "Without authentication"
   └─> AuthButtons stays mounted → returns null
       └─> Flex container recalculates (2 children → 1 child)
           └─> Horizontal misalignment ❌
```

**After (fixed):**
```
1. API Key auth selected
   └─> AuthButtons mounts → renders button

2. Switch to "Without authentication"
   └─> AuthButtons unmounts completely
       └─> Flex container has consistent child count
           └─> Buttons stay aligned ✅
```

## Risks / Trade-offs

- **[Low] Code duplication**: The `!== NONE` check exists in both parent and child. However, they serve different purposes:
  - Parent check: Controls component mounting
  - Child check: Provides defensive fallback for direct component usage
- **[None] Performance**: No performance impact — preventing mounting is more efficient than mounting and returning null
- **[None] Other views**: This change only affects Toolset Publications. Other potential uses of `AuthButtons` (if any) are unaffected
