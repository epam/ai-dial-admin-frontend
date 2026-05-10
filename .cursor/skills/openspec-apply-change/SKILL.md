---
name: openspec-apply-change
description: "Execute implementation tasks from an OpenSpec change definition — reads context artifacts (proposal, design, specs, tasks), applies code changes task-by-task, marks progress via checkbox updates, and reports completion status. Use when the user wants to implement a change, apply specs, start or continue implementation, work through tasks, resume coding, or build from a proposal."
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.0"
  generatedBy: "1.2.0"
---

Execute implementation tasks from an OpenSpec change by reading context artifacts, applying code changes sequentially, and tracking progress.

**Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Infer from conversation context if the user mentioned a change
   - Auto-select if only one active change exists
   - If ambiguous, run `openspec list --json` to get available changes and use the **AskUserQuestion tool** to let the user select

   Always announce: "Using change: <name>" and how to override (e.g., `/opsx:apply <other>`).

2. **Check status**
   ```bash
   openspec status --change "<name>" --json
   ```
   Key fields: `schemaName` (workflow type, e.g. "spec-driven"), artifact containing tasks (typically "tasks" for spec-driven).

3. **Get apply instructions**

   ```bash
   openspec instructions apply --change "<name>" --json
   ```

   Returns: `contextFiles` (paths to read), progress counts, task list with status, and dynamic instruction.

   **Handle states:**
   - `state: "blocked"` (missing artifacts): show message, suggest openspec-continue-change
   - `state: "all_done"`: congratulate, suggest archive
   - Otherwise: proceed to implementation

4. **Read context files**

   Read all files listed in `contextFiles` from the apply instructions output. Do not assume specific file names — use what the CLI returns.

5. **Show current progress**

   Display: schema name, "N/M tasks complete", remaining tasks overview, dynamic instruction from CLI.

6. **Implement tasks (loop until done or blocked)**

   For each pending task:
   - Show which task is being worked on
   - Make the code changes required — keep changes minimal and focused
   - Mark task complete: `- [ ]` → `- [x]`
   - Continue to next task

   **Pause if:**
   - Task is unclear → ask for clarification
   - Implementation reveals a design issue → suggest updating artifacts
   - Error or blocker encountered → report and wait for guidance
   - User interrupts

7. **On completion or pause, show status**

   Display: tasks completed this session, overall "N/M tasks complete" progress.
   - If all done: suggest archive
   - If paused: explain why and wait for guidance

**Output During Implementation**

```
## Implementing: <change-name> (schema: <schema-name>)

Working on task 3/7: <task description>
[...implementation happening...]
✓ Task complete

Working on task 4/7: <task description>
[...implementation happening...]
✓ Task complete
```

**Output On Completion**

```
## Implementation Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Progress:** 7/7 tasks complete ✓

### Completed This Session
- [x] Task 1
- [x] Task 2
...

All tasks complete! Ready to archive this change.
```

**Output On Pause (Issue Encountered)**

```
## Implementation Paused

**Change:** <change-name>
**Schema:** <schema-name>
**Progress:** 4/7 tasks complete

### Issue Encountered
<description of the issue>

**Options:**
1. <option 1>
2. <option 2>
3. Other approach

What would you like to do?
```

**Guardrails**
- Read context files before starting implementation
- Keep code changes scoped to each task
- Update task checkbox immediately after completing each task
- Use contextFiles from CLI output, don't assume specific file names

**Fluid Workflow Integration**

- **Can be invoked anytime**: Before all artifacts are done (if tasks exist), after partial implementation, interleaved with other actions
- **Allows artifact updates**: If implementation reveals design issues, suggest updating artifacts — not phase-locked, work fluidly
