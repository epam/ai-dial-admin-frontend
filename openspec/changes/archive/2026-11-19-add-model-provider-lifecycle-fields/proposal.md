## Why

DIAL Core ([ai-dial-core#2276](https://github.com/epam/ai-dial-core/pull/2276)) added three optional, informational fields to a model: `provider`, `deprecationDate` and `endOfService`. Operators of a platform model cannot set them in the admin console today, so they stay in `description` or are edited as raw JSON.

## What Changes

- The platform model resource (`DialModelResource`) carries `provider`, `deprecationDate` and `endOfService`, camelCase as Core's Configuration API returns them. No case conversion.
- The platform model Properties tab shows a **Provider** text input after the intro control, and below it two date fields on one row, **Deprecation date** and **End of service**.
- The two date fields use the ui-kit `Calendar` in date mode. Two pure helpers convert between the `YYYY-MM-DD` string Core stores and the `Date` the `Calendar` works with.
- Read-only admins see all three fields disabled.

## Non-goals

- No new columns on the platform models list: Core does not return these fields in that listing.
- No alias support: the alias resource does not carry the fields (Core copies them only into its `/openai/models` view), so the alias Target tab is unchanged and no target model is fetched.
- Entity (admin-backend) models are unchanged; the backend does not take these fields.
- No warning, badge or enforcement for a past deprecation or end-of-service date; Core treats the fields as informational.
- No validation beyond what the date control accepts; Core does not validate either.
- No ui-kit change and no wrapper component around `Calendar`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform-models`: the Properties tab gains the three fields.
- `model-resources-core-api`: the model resource type carries the three fields and writes them back unchanged.

## Impact

- `src/models/dial/resource.ts`: `DialModelResource`.
- `src/components/Assets/Platform/Models/Properties.tsx`: the three controls.
- A new date helper module under `src/utils/` and its spec.
- `src/constants/i18n.ts` and `src/locales/en.ts`: labels and placeholders.
- Shared surface: none. `Calendar` is already used by `SystemProperties/RateLimitSchedule.tsx`; no shared component is edited.
