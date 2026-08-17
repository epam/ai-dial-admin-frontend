# Review checklist template

Loaded on demand by the `code-review-and-quality` skill. Copy this verbatim when
writing up a review, then fill it in.

```markdown
## Review: [title]

### Context

- [ ] I understand intent and expected behavior
- [ ] I read related OpenSpec artifacts, or confirmed none apply

### Correctness

- [ ] Matches spec/task
- [ ] Edge and error paths, including the server-action failure shape
- [ ] Tests adequate and meaningful

### Readability

- [ ] Clear names and flow; no nested ternaries
- [ ] No comments restating code or types

### Architecture

- [ ] Code sits at the right level (Common vs feature, utils, server, context)
- [ ] `@/` imports; enums for finite value sets; types in models, constants in constants
- [ ] No new state-management dependency

### Security

- [ ] No secrets; boundaries validated; token never reaches the client
- [ ] New deps justified

### Performance

- [ ] No obvious N+1 / unbounded work; stable AG Grid column defs

### Repo patterns

- [ ] Entity view follows View → TabsContent → List
- [ ] ui-kit / Common reused before new markup; AG Grid for tabular data
- [ ] Theme tokens, not hardcoded colors
- [ ] i18n keys added in the right group, shared keys reused
- [ ] Breakpoint prefixes exist in tailwind.config.js; JS branching via the hooks

### Accessibility

- [ ] Interactive elements are real controls; ARIA state exposed
- [ ] New grid columns named; icon-only actions labeled
- [ ] Specs query by real roles

### Verification

- [ ] Relevant vitest specs and lint green, with actual output reported
- [ ] `validate:agent-docs` run if agent config changed
- [ ] Browser verification named, or explicitly not needed

### Verdict

- [ ] Approve | [ ] Request changes (list blocking items)
```

