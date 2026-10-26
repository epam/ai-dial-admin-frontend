# autocomplete-input Specification

## Purpose

A single-value text field that suggests values while typing and also accepts its own, drawn in the 2.0 design system. It is the admin app's replacement for the typeable legacy select until ui-kit ships a single-value combobox.

## Requirements

### Requirement: Typed text is the value

The field SHALL render as a 2.0 text input with no chevron. The text shown in the field SHALL be the controlled `value`, and every edit SHALL report the new text to the consumer with leading whitespace removed. A value that matches no suggestion SHALL be accepted as is.

#### Scenario: Typing a value that is not suggested

- **WHEN** the user types `my-custom-name` and no suggestion matches it
- **THEN** the consumer SHALL receive `my-custom-name`
- **AND** the field SHALL show `my-custom-name`

#### Scenario: Leading whitespace is dropped

- **WHEN** the user types `  name`
- **THEN** the consumer SHALL receive `name`

#### Scenario: The value changes from outside

- **WHEN** the consumer passes a new `value` while the field is not being edited
- **THEN** the field SHALL show the new value

### Requirement: Suggestion list

While the field has focus and at least one suggestion matches, a floating list SHALL show the matching suggestions under the field, at the field's width, each with its label and optional description. By default a suggestion SHALL match when its label, value or description contains the typed text, case-insensitively; the consumer SHALL be able to turn this filtering off so that every suggestion it passes is shown. The list SHALL show at most `maxSuggestions` rows (default 5). The list SHALL be no taller than 344px — the cap of the 2.0 `Select` option list — or the space left in the viewport, whichever is smaller, and SHALL scroll beyond that. When no suggestion matches, no list and no empty state SHALL be shown.

With `openOnFocus`, focusing or clicking the field SHALL open the list. When the field is empty, that list SHALL show every suggestion, uncapped by `maxSuggestions`.

#### Scenario: Typed text filters the list

- **WHEN** the suggestions are `alpha`, `beta`, `alphabet` and the user types `alp`
- **THEN** the list SHALL show `alpha` and `alphabet` only

#### Scenario: Filtering is off

- **WHEN** the consumer turns filtering off and passes `alpha`, `beta`
- **AND** the user types `zzz`
- **THEN** the list SHALL show `alpha` and `beta`

#### Scenario: Nothing matches

- **WHEN** the typed text matches no suggestion
- **THEN** no list SHALL be shown

#### Scenario: Open on focus with an empty field

- **WHEN** `openOnFocus` is set, the field is empty and the user focuses it
- **THEN** the list SHALL show every suggestion

#### Scenario: A long list scrolls

- **WHEN** the list holds more rows than fit in 344px
- **THEN** the list SHALL be 344px tall and scroll to the remaining rows

### Requirement: Loading state

While the consumer reports that suggestions are loading, the field SHALL show a spinner inside it, named "Loading" for assistive tech, and the input SHALL be marked `aria-busy`. The spinner SHALL disappear once loading ends.

#### Scenario: Suggestions load

- **WHEN** the consumer reports loading
- **THEN** a spinner SHALL show inside the field and the input SHALL be `aria-busy`

#### Scenario: Loading ends

- **WHEN** the consumer stops reporting loading
- **THEN** no spinner SHALL show and `aria-busy` SHALL be removed

### Requirement: Picking a suggestion

Clicking a suggestion, or pressing Enter while one is highlighted, SHALL report the picked option to the consumer, keep focus in the field and close the list. A pick SHALL be reported separately from a typed edit, so the consumer can tell the two apart.

#### Scenario: Click a suggestion

- **WHEN** the user clicks the suggestion with value `org/server@1.2.0` and label `org/server`
- **THEN** the consumer SHALL receive the picked option, value and label included
- **AND** the list SHALL close

#### Scenario: Enter on a highlighted suggestion

- **WHEN** a suggestion is highlighted and the user presses Enter
- **THEN** that suggestion SHALL be picked

### Requirement: Commit on leave

When the user leaves the field (blur) or presses Enter with no suggestion highlighted, the component SHALL report a commit of the current text to the consumer and close the list. Leaving the field right after a pick SHALL NOT report a second commit of the same pick.

#### Scenario: Blur commits typed text

- **WHEN** the user types `org/server` and tabs out of the field
- **THEN** the consumer SHALL receive a commit of `org/server`

#### Scenario: Enter with nothing highlighted

- **WHEN** no suggestion is highlighted and the user presses Enter
- **THEN** the consumer SHALL receive a commit of the current text
- **AND** the surrounding form SHALL NOT be submitted by that key press

### Requirement: Keyboard and ARIA model

The input SHALL be exposed as a `combobox` with `aria-autocomplete="list"`, `aria-expanded` reflecting the open list and `aria-controls` naming the list; the list SHALL be a `listbox` of `option` rows, and the highlighted row SHALL be announced through `aria-activedescendant` while focus stays in the input. Arrow Down / Arrow Up SHALL open the list or move the highlight, wrapping at the ends. Escape SHALL close the list without changing the value. Moving the pointer over a row SHALL highlight it. The field SHALL support a visible label, a caption, an error message with error styling, `disabled` and `readOnly`; a disabled or read-only field SHALL open no list.

#### Scenario: Arrow keys move the highlight

- **WHEN** the list shows three rows, the first highlighted, and the user presses Arrow Up
- **THEN** the third row SHALL be highlighted
- **AND** `aria-activedescendant` SHALL name the third row

#### Scenario: Escape closes the list

- **WHEN** the list is open and the user presses Escape
- **THEN** the list SHALL close and the value SHALL stay unchanged

#### Scenario: Escape inside a popup

- **WHEN** the field sits in a popup, its list is open and the user presses Escape
- **THEN** only the list SHALL close; the popup SHALL stay open with the typed value
- **AND** a second Escape, with the list closed, SHALL reach the popup as usual

#### Scenario: Disabled field

- **WHEN** the field is disabled and the user clicks it
- **THEN** no list SHALL open and the text SHALL NOT be editable

#### Scenario: Error state

- **WHEN** the consumer passes an error message
- **THEN** the message SHALL be shown under the field and the input SHALL be marked `aria-invalid`
