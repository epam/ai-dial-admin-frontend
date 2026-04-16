# Add Auth Fields to Asset Toolset Duplicate

## Problem

PR #2895 added auth field handling when duplicating regular toolsets (`/toolsets`), requiring users to re-enter sensitive auth credentials (OAuth clientId/clientSecret/authorizationEndpoint, or API Key apiKeyHeader) instead of silently copying them.

However, **asset toolsets** (`/assets-toolsets`) use a different duplicate modal (`DuplicateAsset.tsx`) that doesn't have this auth field handling. When duplicating an asset toolset with OAuth or API Key authentication:

- Auth credentials are silently copied from the original toolset
- No prompt to enter new credentials

This creates **feature parity gap** between regular toolsets and asset toolsets, and a **security concern** for users expecting to configure auth separately for cloned entities.

## Solution

Add auth field detection and validation to `DuplicateAsset.tsx` to match the behavior implemented in `DuplicateToolset.tsx`:

1. **Detect auth type** - Check if the asset being duplicated is an `AssetToolset` with `authSettings`
2. **Show auth fields conditionally**:
   - OAuth toolsets: require `clientId`, `clientSecret`, `authorizationEndpoint`
   - API Key toolsets: require `apiKeyHeader`
   - Non-auth or non-toolset assets: no changes
3. **Validate** - Disable submit button until all required auth fields are filled
4. **Use existing validation context** - Leverage `SaveValidationContext` like `DuplicateToolset.tsx` does

## Scope

**In scope:**
- Add auth field inputs to `DuplicateAsset.tsx` when duplicating asset toolsets
- Add validation for required auth fields
- Match UI/UX from `DuplicateToolset.tsx` (same field layout, labels, placeholders)

**Out of scope:**
- Changing auth field handling for regular toolsets
- Modifying how prompts or apps are duplicated
- Token endpoint, scopes, or other optional OAuth fields (not required in DuplicateToolset either)
- Refactoring to share code between `DuplicateAsset` and `DuplicateToolset` (can be future enhancement)

## Files to change

- `src/components/Assets/Deployments/DuplicateAsset.tsx` - add auth type detection, render auth fields, add validation
- May reference `src/components/Toolsets/Modals/DuplicateToolset.tsx` as implementation guide
- May need to import from `src/models/dial/toolset.ts` for `ToolsetAuthType` enum

## Non-goals

- Refactoring existing duplicate modals
- Handling edge cases beyond OAuth and API Key (these are the only two types implemented in regular toolsets)
- Adding tests (unless explicitly requested) - though tests should be considered for validation logic
