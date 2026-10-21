# Pipeline review mode

Loaded on demand by the `code-review-and-quality` skill. Read this only when the
review is running non-interactively (CI, a scheduled bot, the `code-review`
agent) and must emit a machine-readable result.

Use this mode when the review is executed by CI, a scheduled bot, or any non-interactive automation.
Keep the normal review axes, but make the result deterministic and machine-readable.

## Scope

- Review only the PR/diff scope. Do not fail the pipeline for pre-existing issues unless the PR
  worsens them or makes them newly reachable.
- Read full changed files and related artifacts for context, but findings must point to changed lines
  or changed artifacts whenever possible.
- Do not run `npm run build` from this review pipeline. Treat build as a separate CI concern and only
  record its status when an existing CI check already provides it.
- Separate review from publishing: the review step produces the structured artifact; a
  comment-publishing step may post inline comments and one top-level summary, but only from that
  artifact.

## Output artifact

Emit a JSON object with this shape:

```json
{
  "verdict": "pass | warn | fail",
  "summary": "Short human-readable summary.",
  "findings": [
    {
      "severity": "critical | required | warning | nit | optional | fyi",
      "category": "correctness | readability | architecture | security | performance | patterns | a11y | openspec | verification",
      "file": "path/from/repo/root",
      "line": 123,
      "side": "RIGHT | LEFT",
      "startLine": null,
      "startSide": null,
      "anchorable": true,
      "message": "Review comment body.",
      "blocking": true
    }
  ],
  "verification": [
    {
      "command": "npx vitest run src/components/Foo/tests/Foo.spec.tsx",
      "status": "passed | failed | skipped",
      "reason": "Only for failed/skipped or notable context."
    }
  ],
  "topLevelComment": "Markdown summary suitable for a PR conversation comment."
}
```

Use `verdict: "fail"` when any finding is blocking or a required verification command failed. Use
`"warn"` only for non-blocking risks or skipped verification. Use `"pass"` when there are no blocking
findings and required verification is green or explicitly covered by trusted CI.

`file`, `line`, `side`, `startLine`, and `startSide` are intended to be compatible with GitHub pull
request review comments. Use `side: "RIGHT"` for new/head lines and `"LEFT"` only when the finding
must anchor to a removed/base line. Use `startLine`/`startSide` only for multi-line comments;
otherwise set them to `null`.

Set `anchorable: true` only when the finding points to a line present in the PR diff. If the issue is
real but cannot be anchored to a changed line, set `anchorable: false`, keep `file`/`line` as
best-effort context, and include the finding in `topLevelComment` instead.

Every finding must include a non-empty `message` with the full review comment body. Do not put the
explanation only in the summary or top-level comment — publishers use `message` for both the inline
comment and the summary table.

## Pipeline fail rules

Fail the pipeline for:

- Any `critical` or `required` finding.
- A relevant non-build check run by this review pipeline that failed: `vitest`, `lint`, `format`, or
  `validate:agent-docs`.
- OpenSpec drift: implementation materially diverges from proposal/design/tasks/specs.
- Server-action or backend contract mismatch against the documented API shape.
- Security, authz, secret exposure, data loss, or broken public contract risks.

Do not fail for `nit`, `optional`, or `fyi`. Use `warning` for non-blocking risk, missing
non-critical evidence, or human-follow-up items.

Simplification and extraction findings are usually `nit` or `optional`. Use `warning` only when
duplication creates meaningful maintenance risk or repeated bug-prone logic. Use `required` only when
the structure causes a concrete defect or breaks a documented rule in `.claude/rules/`.

## Comment publishing

- Post inline comments only for `critical`, `required`, and high-signal `warning` findings with
  `anchorable: true`.
- Do not post inline comments for `nit` by default.
- Summarize `anchorable: false` findings in the top-level comment instead.
- Always post one top-level PR comment. If everything is clean, post a concise positive summary
  rather than staying silent.
- Add the PR head SHA as `commit_id` at publish time; the review agent must not hardcode it.
- If the API rejects an inline comment because the line is not in the diff, retry once as a
  top-level comment entry and mark the finding as not anchored in the publishing log.

