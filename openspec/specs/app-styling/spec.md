# app-styling Specification

## Purpose
TBD - created by archiving change tailwind-v4-migration. Update Purpose after archive.
## Requirements
### Requirement: Tailwind v4 CSS-first configuration

The app SHALL be built with Tailwind CSS v4 configured in CSS (`@theme`, `@source`, `@utility`, `@custom-variant`) and SHALL NOT keep a `tailwind.config.js`. PostCSS SHALL use `@tailwindcss/postcss`.

#### Scenario: Build uses v4 only

- **WHEN** the app is built
- **THEN** no Tailwind 3 package is installed, no `tailwind.config.js` exists under `apps/ai-dial-admin/`, and the build succeeds

#### Scenario: Responsive variants preserved

- **WHEN** a component uses `mobile:`, `small_tablet:`, `large_tablet:`, `desktop:` or `large_desktop:`
- **THEN** it applies at the viewport ranges 360–767, 768–1023, 1024–1279, 1280–2559 and ≥2560 px

### Requirement: Design tokens keep resolving through theme variables

The app's color, shadow, radius, gradient and font tokens SHALL be declared in `src/scss/app-theme.css`, each color as `var(--name, fallback)`.

#### Scenario: Theme variables still apply

- **WHEN** the themes service sets a CSS variable such as `--bg-layer-base`
- **THEN** every utility built from that token (`bg-layer-base`, …) renders the served value, and renders the fallback when the variable is absent

#### Scenario: Score cells keep their palette

- **WHEN** a score cell is rendered for any `abs-00`…`abs-11` or `delta-n4`…`delta-p4` bucket
- **THEN** `bg-score-*`, `text-score-*` and `border-score-*` exist in the built stylesheet and resolve to the same colors as before

### Requirement: Typography comes from the kit

The app SHALL use the kit's `dial-*-text` classes as its type scale and SHALL NOT define its own typography classes. The former local classes (`body`, `body-semi`, `small`, `small-text-semi`, `small-medium`, `small-150`, `tiny`, `tiny-semi`, `tiny-150`, `caption`) SHALL NOT remain, and `h1`, `h2` and `h3` SHALL take the kit's styling.

#### Scenario: Old classes gone

- **WHEN** the source tree is searched for the former local typography class names
- **THEN** no component or stylesheet uses them and `src/scss/fonts.scss` does not exist

#### Scenario: Kit scale applied

- **WHEN** an element uses `dial-small-text`
- **THEN** it renders with the kit's 14px / 20px normal-weight style

### Requirement: App rules can override kit typography

A rule in the app's own SCSS for a kit typography class SHALL take effect wherever that class is used, because the kit's stylesheet loads before the app's.

#### Scenario: Override wins

- **WHEN** the app's SCSS redefines `.dial-small-text` with a different line height
- **THEN** every element using `dial-small-text` renders that line height

### Requirement: App SCSS compiles under Tailwind v4

App SCSS SHALL NOT `@apply` anything that is not a Tailwind utility, and SHALL NOT use utilities removed or re-valued in v4 without the v4 replacement.

#### Scenario: Stylesheet build is clean

- **WHEN** the stylesheet is compiled by `nx build`
- **THEN** no `@apply` error or unknown-utility error is reported

