## Context

The shared credential controls register fixed field keys in `SaveValidationContext`, but do not unregister them when hidden. Resource toolsets can hide their OAuth configuration, and external service editors can unmount on Back. The registration selector currently offers only Existing client.

## Goals / Non-Goals

**Goals:** Remove only obsolete credential validation; revalidate on remount; preserve all unrelated validation.

**Non-Goals:** Add dynamic registration, change backend payloads, or change login-state transitions.

## Decisions

Each credential control dispatches `RemoveField` on unmount using a separate effect. A global `Reset` would incorrectly clear unrelated field and JSON validation. Keeping cleanup separate from the value-validation effect avoids removing a live field on value changes.

## Risks / Trade-offs

- Fixed field keys do not support concurrent credential editors under one provider → current routes mount one editor per provider; concurrent ownership requires a separate design.
- Strict Mode replays effects → test that remounted controls register their validation again.
