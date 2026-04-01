# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Project context, tech stack, architecture, commands, and conventions are in `openspec/config.yaml` — read that first.

## Claude-specific notes

- When searching for code patterns, check existing implementations of the same entity type before creating new ones (e.g., look at how adapters/models work before building a new entity view).
- The `@/` path alias resolves from `apps/ai-dial-admin/` — vitest and imports use this. Run vitest from that directory.
- Test mocks are centralized in `apps/ai-dial-admin/test-setup.tsx` — check what's already mocked before adding new mocks.
- Pre-commit runs lint, pre-push runs tests. Don't skip hooks.
