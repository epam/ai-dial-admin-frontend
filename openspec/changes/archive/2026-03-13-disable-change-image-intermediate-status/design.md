## Context

The container detail view (`TabsContent.tsx`) renders an OpenPopup icon next to the container image label that opens a modal to change the image. Unlike all other editable fields in the container view, this icon is not disabled during intermediate statuses (PENDING, STOPPING).

The codebase already has `isEditDisabled(container)` in `containers.ts` that returns `true` for PENDING and STOPPING. All form fields in `Properties.tsx` and `FirewallSettings.tsx` use this utility.

## Goals / Non-Goals

**Goals:**
- Disable the change image action during intermediate statuses, consistent with other controls
- Use proper button semantics for the change image action

**Non-Goals:**
- Changing the ContainerChangeImage modal itself
- Adding new status types or modifying existing status logic

## Decisions

**Replace raw OpenPopup SVG with `DialGhostButton`**

The current implementation uses an OpenPopup SVG as `postfix` on `DialLabelledText` with a direct `onClick`. Since SVGs don't support `disabled`, this required workarounds (callback guards, CSS hacks). Instead, restructure to use `DialGhostButton` which:
- Renders a native `<button>` with proper `disabled` support
- Accepts `label` (image name + version text) and `iconAfter` (OpenPopup icon)
- Ghost appearance keeps it visually lightweight inline with the label

Layout change:
- `DialLabelledText` keeps only the `label` prop (no `text` or `postfix`)
- `DialGhostButton` becomes a child, containing the image text and popup icon

Alternatives considered:
1. CSS `opacity-50 pointer-events-none` on SVG — no button semantics, poor accessibility
2. Guard in `handleModalOpen` callback — icon still looks clickable, poor UX
3. Conditionally hide the icon — causes layout jumping

**Use `isEditDisabled()` for disabled state**

Same utility that guards all other fields. Computed via `useMemo` from `selectedContainer`.

## Risks / Trade-offs

- **Low risk**: Small change in one component, reusing existing utility and ui-kit components
- **Visual change**: `DialGhostButton` may render slightly differently than raw text + SVG — needs visual verification
