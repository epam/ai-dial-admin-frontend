# Issue body formats

Loaded on demand by the `create-ticket` skill at Step 8. These must match the
repository's GitHub issue templates exactly — the rendered issue looks wrong if a
heading is renamed or dropped.

**Bug body format:**
```markdown
### EPAM AI DIAL Admin version
<version>

### How to reproduce
<steps>

### Actual result
<actual>

### Expected result
<expected>

### Additional information
<info or "_No response_">

### Details
<details-section>

### Confidential information
- [X] I confirm that do not share any confidential information
```

**Feature body format:**
```markdown
### Description
<description>

### Related issues
<issues or "_No response_">

### Details
<details-section>

### Confidential information
- [X] I confirm that do not share any confidential information
```

**Task body format (general):**
```markdown
### Description
<description>

### Acceptance criteria
<checklist items or "_No response_">

### Related issues
<issues or "_No response_">

### Details
<details-section>

### Confidential information
- [X] I confirm that do not share any confidential information
```

**Task body format (infra variant — used when `ops-request` label is applied):**
```markdown
### Type of change
<change type>

### Target environment
<environment>

### Task list
<checklist items>

### Context / reason
<context or "_No response_">

### Details
<details-section>

```
