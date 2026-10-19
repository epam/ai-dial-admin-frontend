## 1. Read a skill from its own metadata path

- [x] 1.1 In `apps/ai-dial-admin/src/server/core/skills-core-api.ts`, replace `findSkillListingEntry` with a read of the skill's own path (`GET ${CORE_SKILLS_METADATA_URL}/${encodeCorePath(path)}`, no query params), run in parallel with `getSkillFiles`; return `null` when the response is `null` or is not an `ITEM` node (D2), otherwise take `etag`, `author`, `createdAt`, `updatedAt` from it
- [x] 1.2 Rewrite the `getSkillMetadata` doc comment to describe the own-path read (Core ≥ 0.48.0) and drop the "first page only" / "always calls `listChildren`" rationale; remove the debug `console.log` in `findSkillListingEntry`'s replacement path
- [x] 1.3 Remove the debug `console.log(response, path)` from `getSkill` in `apps/ai-dial-admin/src/app/[lang]/skills/actions.ts`

## 2. Tests

- [x] 2.1 Update `getSkillMetadata` specs in `apps/ai-dial-admin/src/server/core/tests/skills-core-api.spec.ts`: asserts the skill's own path (not the parent listing) is requested and `etag`/`_metadata` come from the returned `ITEM`; a `null` response and a non-`ITEM` (`FOLDER`) response both return `null`; the parent listing is never requested
- [x] 2.2 Check `apps/ai-dial-admin/src/app/[lang]/skills/actions.spec.ts`, `src/server/entities/tests/core-publications-api.spec.ts` and `src/server/publications/resolver/tests/skill-resource.spec.ts` for mocks of the listing-based lookup and update any that break

## 3. Specs and docs

- [x] 3.1 Search `docs/` and `README.md` for a stated minimum Core version or a description of the skill read, and record the Core ≥ 0.48.0 requirement where one exists

## 4. Quality checks

- [x] 4.1 Run lint, format, `npm run typecheck`, `npm run typecheck:specs`, and the affected specs (`npx vitest run` from `apps/ai-dial-admin/`), then the full `npm run test` gate

<!-- No browser-verification task: every scenario's THEN clause is a server-side contract (which Core
     path is read, which fields are populated, null on not-found); none describes UI state. -->
