---
name: dial-admin-reference
description: Find the one authoritative source for a question about this repo — a capability spec, an archived change's rationale, or an ops doc. Use before answering "what is this supposed to do", "why was it built this way", or any question about env vars, theming, the navigation menu, or a version upgrade.
---

# Finding the authoritative source

A router. Pick the row, open **that** source, stop. Two questions decide where to look:

- **What is this supposed to do?** → a capability spec. 116 of them, ~15,500 lines. This is the
  behavioral source of truth.
- **Why is it like this?** → the archived change that introduced it. `proposal.md` carries the
  problem and the alternatives considered; `design.md` carries the tradeoff that was accepted.

Everything else is a much smaller tail. `docs/` is ~380 lines and covers only ops-facing concerns.

## Capability specs — what the system does

`openspec/specs/<capability>/spec.md`, each `## Purpose` then `### Requirement:` /
`#### Scenario:` blocks. The scenarios are the acceptance criteria, so a spec answers "is this
behavior intended?" without reading the implementation.

To find the right capability:

```bash
openspec list --specs                     # all capabilities with requirement counts
openspec show <capability>                # one spec
grep -rl "<term>" openspec/specs/         # when you don't know the capability name
```

`.claude/reference/areas.md` maps routes and component folders to areas, which is usually the
fastest way from a file you're editing to the capability that governs it.

**Analytics is one master spec** — `openspec/specs/analytics/spec.md`. Don't look for, or create,
per-feature analytics specs.

## Change history — why it is that way

| Question                                                   | Read                                                |
| ---------------------------------------------------------- | --------------------------------------------------- |
| What work is in flight right now?                          | `openspec/changes/<name>/` (4 active)               |
| Why was this built this way? What else was considered?      | `openspec/changes/archive/<date>-<name>/proposal.md` |
| What tradeoff was accepted, and what was explicitly ruled out? | `openspec/changes/archive/<date>-<name>/design.md`   |

163 archived changes. When a design decision looks arbitrary, it is usually recorded here — check
before re-litigating it.

## Ops and product docs

| Question                                                                          | Read                              |
| --------------------------------------------------------------------------------- | --------------------------------- |
| What changed for deployment in a version? Was an env var added, renamed, removed?  | `docs/INFRA-CHANGELOG.md`         |
| What is required to move to a released version, in priority order?                 | `docs/upgrade-plans/<version>.md` |
| What is the navigation menu's structure — groups, titles, icons, route links?       | `docs/MENU-DOCUMENTATION.md`      |
| What does the `Preview` tag mean and when is it applied?                            | `docs/PREVIEW_TAG.md`             |
| How are colors, fonts, and images customized without rebuilding the image?          | `docs/THEME-CUSTOMIZATION.md`     |

## Stack, commands, conventions

`openspec/config.yaml` — tech stack, path alias, commands, provider stack, entity pattern, grid and
i18n conventions. `AGENTS.md` for how agents work here. Coding rules live in `.claude/rules/` and
load themselves for matching files.

## Precedence when sources disagree

1. **The consolidated spec** (`openspec/specs/`) is current intended behavior.
2. **An archived change** is historical rationale — accurate about *why*, possibly superseded about
   *what*. A later change may have replaced it.
3. **`docs/upgrade-plans/`** is generated from `docs/INFRA-CHANGELOG.md`; the changelog wins.
4. **Code** wins over all of them for what actually happens today. A spec that disagrees with
   shipped behavior is a finding worth raising, not a fact to repeat.

Confirm env var names against the code that reads them, not prose — a changelog entry can lag a
rename.

## Writing back

When a change alters behavior one of these sources describes, update it in the same change:

- Behavior change → the capability's delta spec, folded into `openspec/specs/<capability>/spec.md`
- New or renamed env var → `docs/INFRA-CHANGELOG.md`
- Menu change → `docs/MENU-DOCUMENTATION.md` **and** `.claude/reference/areas.md`, which mirrors the
  menu and is what tooling reads
