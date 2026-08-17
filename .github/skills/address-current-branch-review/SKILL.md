---
name: address-current-branch-review
description: Read unresolved GitHub code review threads for the pull request associated with the current branch, classify each comment, and implement and verify required code fixes. Post inline replies only when the user explicitly asks to reply after the changes have been pushed and are visible in the PR.
---

# Address Current Branch Review

Process current-branch review feedback: inspect thread state, decide whether code must change, and
verify any fix. Posting review replies is a **separate, explicitly authorized action** that happens
only after the fix is pushed.

## Reply Authorization Gate

- A request to fix, handle, address, or process review comments authorizes **code changes only**. It
  does not authorize posting GitHub comments.
- Post replies only when the user separately and explicitly asks to reply or answer the review
  comments.
- Before posting a fix reply, verify the relevant commit is pushed and included in the PR head. Local
  working-tree changes or unpushed commits are never sufficient.
- If the fix is not visible in the PR, do not post. Tell the user to push first.
- Replies must describe the PR as already updated. Never post "prepared locally", "will appear after
  push", or any other future-tense visibility disclaimer.

## Workflow

1. **Read repository instructions before editing.**
   - Read root `AGENTS.md` and `openspec/config.yaml`.
   - The path-scoped rules in `.claude/rules/` auto-load for the files you touch — `components.md`,
     `testing.md`, `utils.md`, plus always-on `code-standards.md` and `a11y.md`.
   - If the change is tied to an OpenSpec change, read its artifacts under
     `openspec/changes/<change>/` before editing.

2. **Resolve the current pull request.**
   - Read the current branch and `origin` repository from local git.
   - Prefer the GitHub MCP tools to find the open PR whose head matches the branch.
   - Use `gh pr view` only when those cannot resolve it.
   - Stop if there is no unique open PR for the branch.

3. **Load thread-aware review data.**
   - Use the GitHub review-thread action to get `is_resolved`, `is_outdated`, path, line, and replies.
   - Fetch flat PR comments for numeric comment IDs **only** when the user asked to post replies.
   - Ignore resolved, outdated, approval-only, informational, bot-only, and duplicate threads.
   - Do not assume flat comments represent thread resolution state.

4. **Prevent duplicate work.**
   - Read every reply already present in each thread.
   - Skip a thread if the requested change is already in the current code and an adequate answer was
     already posted.
   - If code is fixed but unanswered, report that status. Post the missing reply only after explicit
     authorization and the push check.

5. **Classify each active thread.**

   | Classification | Action                                                                        |
   | -------------- | ----------------------------------------------------------------------------- |
   | `fix-required` | Change code, add or update tests, and verify. Do not reply unless authorized. |
   | `reply-only`   | Draft a technical explanation. Post it only when explicitly authorized.       |
   | `ambiguous`    | Do not guess or post; ask the user for the missing decision.                  |
   | `conflicting`  | Explain the conflict and ask before changing behavior.                        |

6. **Implement `fix-required` threads.**
   - Inspect the full affected file and its `tests/` sibling, not only the diff hunk. This codebase is
     highly patterned — check how the same entity type solves the problem before inventing a fix.
   - For multi-file work, build in thin vertical slices and verify each (see the task rules in
     `openspec/config.yaml`).
   - Keep every change traceable to a specific review thread. Do not fold in drive-by cleanup; that
     turns a review fix into an unreviewable diff.
   - Preserve unrelated user changes and staged files.
   - Do not commit, push, or force-update branches unless explicitly requested.

7. **Verify each fix.**
   - Run the narrowest test that proves the change, from `apps/ai-dial-admin/` so the `@/` alias
     resolves: `npx vitest run src/path/to/file.spec.ts -t "pattern"`.
   - Then `npm run lint`. Add `npm run build` only when routing, layout, or the provider tree changed.
   - If agent configuration changed (`.claude/`, `.cursor/`, `.github/instructions`, `AGENTS.md`),
     run `npm run validate:agent-docs` if that script exists.
   - Never claim a fix passed if the required command failed or was not run. Report actual output.
   - If verification fails, keep fixing and do not draft a success reply.

8. **Draft a reply without posting it.**
   - Match the reviewer's language when practical.
   - Keep it concise and technical.
   - For a verified fix, state what changed and which check confirmed it.
   - For `reply-only`, explain why no code change is needed and cite the existing behavior, rule, or
     contract.
   - Do not be defensive, over-apologetic, or vague. Do not use local-only or future-tense wording.

9. **Stop after implementation unless replies were explicitly requested.**
   - Summarize local changes and verification.
   - Do not call any GitHub reply/comment mutation.

10. **Only if replies were explicitly requested, check visibility and post.**
    - Fetch the current PR head SHA immediately before posting.
    - Verify the pushed PR head contains the fix commit and that the fix appears in the PR diff.
    - If the fix is uncommitted, unpushed, or absent from the diff, stop without posting.
    - Prefer the GitHub inline-reply action using the thread's top-level numeric review comment ID.
    - Map GraphQL thread comments to numeric IDs through the flat comment list when necessary; use
      `gh api graphql` only as a fallback.
    - Post at most one new reply per processed thread.
    - Do not resolve threads, submit a review, approve, request changes, commit, or push unless
      explicitly requested.

11. **Summarize.**
    - Fixed threads, and whether each fix is visible in the PR.
    - Replies posted (only when posting was requested).
    - `reply-only` threads.
    - Skipped or ambiguous threads.
    - Verification commands run, with their actual results, and any remaining warnings.

## Reply Patterns

Verified and visible:

```text
Updated: the error path now returns `{ success: false, errorMessage }` and the view surfaces it through NotificationContext. Verified with `npx vitest run src/app/actions.spec.ts` and `npm run lint`.
```

No code change needed:

```text
No code change is needed here: `BaseEntityList` already applies the column state from `storageKey`, so the ordering persists without an explicit effect in this component.
```

## Safety Rules

- Never treat a request to fix review feedback as permission to post a GitHub reply.
- Never post a fix reply until the user explicitly asks for it after pushing.
- Never post a fix reply when the change is only local or unpushed.
- Never use "prepared locally", "will appear after push", or equivalent wording in a reply.
- Never reply before understanding the full thread and the current code.
- Never post a success reply for an unverified fix.
- Never fabricate test results, commit SHAs, or PR visibility.
- Never silently resolve a conversation.
- Never answer an ambiguous behavioral request on the reviewer's behalf.
- Never overwrite, unstage, or revert unrelated changes.
