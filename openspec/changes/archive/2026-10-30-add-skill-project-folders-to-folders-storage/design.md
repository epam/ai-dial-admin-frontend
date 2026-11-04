## Context

`getFoldersCore` fans out over `ALL_TYPES` (five types), turns each response into a `FolderNode` tree with `toFolderTree`, and combines them with `mergeFolderTrees`. That merge throws when two types disagree on a folder's name, parent path, bucket or path, and the throw is not caught in `getFoldersCore`. Skills and Projects use dedicated v2 clients (`skillsCoreApi.listSkillMetadata`, `projectsCoreApi.listProjectMetadata`) and are already mapped to rows by `toSkillList` and `toProjectList`.

DIAL Core (`PublicationService.ALLOWED_RESOURCES`, `RuleService`, `AccessService`) keys rules by public folder path and includes `SKILL` and `PROJECT`, so the rules calls need no change.

## Goals / Non-Goals

**Goals:** show Skill and Project grouping folders in Folders Storage with working permission rules; never let the new sources break the existing tree.

**Non-Goals:** rename/move, tree-view actions, listing skills or projects themselves.

## Decisions

1. **Re-root onto another type's root.** The Skill and Project listings go through `toFolderTree` with their `skills/` / `projects/` prefix, like the other types, and `withRootOf` then replaces their root with the first available root, keeping only their children. Alternative: merge the v2 roots as they come. Rejected: a root mismatch would make `mergeFolderTrees` throw for the entire listing. If only Skill or Project trees exist, the first of them is the root. The v2 metadata nodes share the shape and URL prefixes of the other types, so `toFolderTree` applies unchanged.
2. **Folder rows only.** `toFolderTree` already keeps only FOLDER children, so skills and projects never appear as tree entries.
3. **Failure isolation.** Each new listing keeps the `fetchAllPages(...).catch(() => null)` pattern, so an unavailable endpoint contributes nothing.
4. **Fan-out kept explicit.** Skill and Project are added beside `ALL_TYPES` as a separate list, not appended to it: `ALL_TYPES` also drives delete and move, which stay out of scope. A comment notes the extra calls go away once Core syncs folders across types.
5. **Child folders still merge by name.** A folder present in several types is merged with the existing consistency check; skill and project rows carry the same `bucket` and `parentPath`, so they agree.

## Risks / Trade-offs

- Two more Core calls per expansion, accepted as temporary.
- A v2 row whose `parentPath` or `bucket` differs from the other types would still throw at the child level; verified during implementation against real listings and covered by a test.
- A folder visible in the tree but not renamed or moved with the other types until the follow-up change.
