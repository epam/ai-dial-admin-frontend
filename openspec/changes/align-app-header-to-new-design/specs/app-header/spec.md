## Purpose

Defines the application header shown above every Admin page: its layout on desktop and mobile, and the
controls it carries — sidebar toggle, theme logo, breadcrumbs, read-only indicator, help button and user
avatar — with their interactive states.

## ADDED Requirements

### Requirement: Header bar
The header SHALL be a full-width bar 48px high on the base layer background with a tertiary-stroke bottom
border, on every viewport from the application's 360px minimum width upward. All header colours SHALL come
from theme tokens; no hex value SHALL be hard-coded, so a theme served by the themes service restyles the
header, light and dark alike.

#### Scenario: Header height and surface
- **WHEN** any Admin page renders
- **THEN** the header is 48px high, uses the base layer background and has a tertiary-stroke bottom border

#### Scenario: Dark theme
- **WHEN** the user switches to a dark theme
- **THEN** the header background, border, icons and text change with the theme tokens and no element keeps
  a light-theme colour

### Requirement: Desktop layout
On desktop (the `lg` breakpoint and wider) the header SHALL lay out, left to right: the sidebar toggle's 24px icon at a
20px inset from the left edge, the theme logo, the breadcrumbs 52px after the logo (after the toggle when
the theme has no logo), and a right-aligned group — read-only badge (when applicable), help button (when a documentation
link is available), user avatar — ending 24px from the right edge. Items SHALL be vertically centred.
Breadcrumbs that do not fit SHALL truncate with the full label reachable, and SHALL NOT overlap the
right-aligned group. Spacing SHALL be measured between the 24px icons, not between their hit areas: 24px
from the toggle icon to the logo, 20px from the read-only badge to the help icon, and 24px from the help
icon to the avatar.

#### Scenario: Element order and insets
- **WHEN** the header renders at 1440px width for a read-write admin with a documentation link configured
- **THEN** it shows, in order, the sidebar toggle icon 20px from the left edge, the logo, the breadcrumbs 52px
  after the logo, and the help button and avatar with the avatar 24px from the right edge

#### Scenario: Long breadcrumb trail
- **WHEN** the breadcrumb trail is wider than the space between its start and the right group
- **THEN** breadcrumb labels truncate, each keeps its full label in a tooltip, and nothing overlaps the help
  button or avatar

### Requirement: Mobile layout
Below the `lg` breakpoint the header SHALL show, left to right: the sidebar toggle's 24px icon 16px from the left edge,
the theme logo 16px after it, and a right-aligned row — read-only indicator (when applicable), help button,
user avatar — 20px apart, with the avatar 16px from the right edge. The logo SHALL sit
left-aligned next to the toggle, not centred. The header SHALL NOT render breadcrumbs on mobile. No divider
SHALL separate the avatar from the rest of the header. The layout SHALL fit 360px width without horizontal
scrolling.

#### Scenario: Mobile order at minimum width
- **WHEN** the header renders at 360px width for a read-only admin with a documentation link configured
- **THEN** it shows the toggle, the logo, the compact read-only indicator, the help button and the avatar
  on one row with no horizontal scroll and no divider before the avatar

#### Scenario: No breadcrumbs in the mobile header
- **WHEN** the header renders below the `lg` breakpoint
- **THEN** the header contains no breadcrumbs

### Requirement: Sidebar toggle
The header SHALL show a sidebar toggle button with a 24px layout-sidebar icon, as the kit's ghost icon button
shared with help and the avatar, and the accessible name
"Toggle sidebar". The button SHALL expose the sidebar state through `aria-expanded`, point `aria-controls` at
the main menu, and SHALL toggle the sidebar on activation. Its hover background
SHALL also apply on keyboard focus.

#### Scenario: Toggle the sidebar
- **WHEN** the user activates the sidebar toggle while the sidebar is open
- **THEN** the sidebar closes and the toggle reports `aria-expanded="false"`

#### Scenario: Keyboard focus feedback
- **WHEN** the toggle receives keyboard focus
- **THEN** it shows the same background change as on hover

### Requirement: Theme logo
The header SHALL show the logo provided by the current theme as an image linking to the home page, with the
product name (`APP_NAME`, defaulting to the app's built-in name) as its text alternative. The image SHALL be
24px high at its own width, capped at 200px and shrinking on narrow viewports, scaled without distortion. When
the theme provides no logo, the header SHALL render no logo and keep the remaining layout in place.

#### Scenario: Logo links home
- **WHEN** the user activates the logo
- **THEN** the application navigates to the home page, and a screen reader announces the link by the product
  name

#### Scenario: Wide theme logo
- **WHEN** the theme's logo is wider than 200px at 24px height
- **THEN** it renders at most 200px wide, scaled down proportionally and left-aligned

#### Scenario: Theme without a logo
- **WHEN** the current theme provides no logo
- **THEN** no logo renders and the breadcrumbs follow the sidebar toggle

### Requirement: Read-only indicator
For a read-only administrator the header SHALL show a read-only indicator; for any other administrator it
SHALL show none. The indicator is a status, not a control: it SHALL NOT be focusable or exposed as a button.
On desktop it SHALL be a pill labelled "Read only" using the inverted control colours, so it reads dark on a
light theme and light on a dark theme. On mobile it SHALL be a compact pill with an eye icon and no visible
label, still read as "Read only". Screen readers SHALL read the explanation "No changes can be made. Access is
managed by administrator." together with the label. Hovering the indicator SHALL show the same explanation in
a tooltip below it, aligned to its right edge so it extends to the left.

#### Scenario: Desktop badge for a read-only admin
- **WHEN** a read-only admin views any page on desktop
- **THEN** the header shows the "Read only" pill before the help button

#### Scenario: Tooltip explains the restriction
- **WHEN** the user hovers the read-only indicator
- **THEN** a tooltip opens 14px below it, extending to the left and staying inside the viewport at 360px,
  and reads "No changes can be made. Access is managed by administrator."

#### Scenario: Compact indicator on mobile
- **WHEN** a read-only admin views any page below the `lg` breakpoint
- **THEN** an eye-icon pill shows in the right-aligned row before the help button, and a screen reader
  announces it as "Read only"

#### Scenario: Explanation without the tooltip
- **WHEN** a screen reader reads the header for a read-only admin
- **THEN** it reads "Read only" followed by the explanation, and the indicator is not announced as a button

#### Scenario: No indicator for a read-write admin
- **WHEN** an admin with write access views any page
- **THEN** the header shows no read-only indicator

### Requirement: Help button
When a documentation link is configured and the current page has a documentation topic, the header SHALL
show a help button with a 24px help icon and the accessible name "Help", opening that page's
documentation as today. While its menu is open the button SHALL keep its hover look (accent-alpha
background, accent icon), report `aria-expanded="true"`, and the menu SHALL open below it, aligned to its
right edge. Hovering or focusing it SHALL show a "Help" tooltip: below the button, aligned to its
right edge, while the menu is closed, and to its left while the menu is open, so the tooltip never covers the
menu. Otherwise the header SHALL show no help button.

#### Scenario: Help for the current page
- **WHEN** the user opens the help button on the Models page with a documentation link configured
- **THEN** it offers the Models documentation link in a menu below the button, aligned to its right edge,
  and the button stays highlighted until the menu closes

#### Scenario: No documentation link
- **WHEN** no documentation link is configured
- **THEN** the header shows no help button

### Requirement: User avatar
The header SHALL show the user avatar as a 24px avatar inside the kit's ghost icon button (40px hit area),
with the accessible name "Account settings" (and "Close" while its menu is open), so it shares the help button's hover, pressed and focus states. It SHALL show the user's image when available, otherwise their initials on a colour picked from
the user's name out of the theme's palette, so the same user always gets the same colour and the colour
follows the theme.
The avatar SHALL have four visual states: Default (avatar only); Hover (a 40px accent-alpha circle behind
the avatar); Focus (a focus-stroke ring, shown on keyboard focus only); Open (while its menu is open, the avatar is replaced by a close icon in the kit's Neutral Outlined
icon button; activating it closes the menu). On every viewport, activating the avatar SHALL open the user menu below it, aligned to its
right edge: one popover, not a separate mobile panel. "Log out" SHALL be styled as the danger action.

#### Scenario: Initials fallback
- **WHEN** the signed-in user has no image and is named "Dana Kim"
- **THEN** the avatar shows "DK" on a theme palette colour that stays the same across reloads

#### Scenario: Hover and focus states
- **WHEN** the user hovers the avatar, and separately when the avatar receives keyboard focus
- **THEN** hover shows the accent-alpha circle behind it, and keyboard focus shows the focus ring

#### Scenario: Menu header shows name and email
- **WHEN** the user opens the user menu and their session has a name and an email
- **THEN** the menu header shows the avatar, the name, and the email below the name; a long name or email
  truncates with the full value in a tooltip

#### Scenario: Open the user menu on desktop
- **WHEN** the user activates the avatar on desktop
- **THEN** the user menu opens below the avatar, aligned to its right edge, and the avatar turns into a
  Neutral Outlined close button until the menu closes; activating it closes the menu

#### Scenario: Same user menu on mobile
- **WHEN** the user activates the avatar below the `lg` breakpoint
- **THEN** the same user menu as on desktop opens below the avatar, aligned to its right edge and inside the
  viewport at 360px, with Settings and Log out as menu items reachable with the arrow keys

#### Scenario: Avatar tooltip follows the menu
- **WHEN** the user hovers or focuses the avatar button
- **THEN** a tooltip shows the user's name (or "Account settings" when there is none) below the button,
  aligned to its right edge, while the menu is closed, and "Close" to its left while the menu is open; the
  button's accessible name follows what it shows — "Account settings" while closed, "Close" while open, with
  `aria-expanded` — and the avatar in the menu header has no tooltip
