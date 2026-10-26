# file-upload-field Specification

## Purpose
The local file upload field (`components/Common/FileUploadField/`): ui-kit 2.0 ships only the empty drop area, so the file list, Add / Delete all actions and the format, size and count limits are built here on `FileDropzone`.

## Requirements

### Requirement: Empty and filled states
`FileUploadField` (`components/Common/FileUploadField/`) SHALL render a `Label` from `fieldTitle` above its content — followed by `: <count>` when the field is `multiple` — and its `elementId` SHALL be the id of the field's file input in both states. While `files` is empty or undefined it SHALL render a `FileDropzone` carrying the drop copy (first line; second line and Browse label joined as its description) and `acceptTypes`. While `files` is non-empty it SHALL render a bordered list with one row per file instead.

#### Scenario: No files shows the drop area
- **WHEN** `files` is empty
- **THEN** the field shows the label with count `0`, the drop copy and no file rows

#### Scenario: Files show as rows
- **WHEN** `files` holds two files
- **THEN** the field shows the label with count `2` and two rows, and no drop area

#### Scenario: Single-file field has no count
- **WHEN** `multiple` is false
- **THEN** the label shows `fieldTitle` alone

### Requirement: File rows
Each row SHALL show the file icon (`iconBeforeInput`, otherwise `dynamicIcon(name)`), the file name truncated through `EllipsisTooltip`, and a remove button named `<Delete>: <file name>`. A file for which `isInvalid(file)` is true SHALL be marked as an error in the row and show `errorText` under it. Removing a row SHALL call `onChange` with the remaining files and clear any selection error.

#### Scenario: Invalid file is marked
- **WHEN** `isInvalid` returns true for one of the files
- **THEN** that row is marked as an error and `errorText` is shown once under it

#### Scenario: Remove drops one file
- **WHEN** the user removes the first of two files
- **THEN** `onChange` is called with the second file only

### Requirement: Add and Delete all actions
In the filled state a `multiple` field SHALL offer a Delete all button when `deleteAllButtonLabel` is set, an Add button when `addButtonLabel` is set and the file count is below the limit (`maxFilesCount`), and any `additionalActionButtons`. Add SHALL open the file picker and append the picked files; Delete all SHALL call `onChange` with an empty list. Dropping files on the list SHALL append them the same way as Add. A single-file field (`multiple` false) SHALL show only the remove button.

#### Scenario: Add appends
- **WHEN** two files are listed and the user picks another through Add
- **THEN** `onChange` is called with all three

#### Scenario: Drop on the list appends
- **WHEN** the user drops a valid file on the list
- **THEN** `onChange` is called with the listed files followed by the dropped one

#### Scenario: Delete all clears
- **WHEN** the user clicks Delete all
- **THEN** `onChange` is called with an empty list

#### Scenario: Add is hidden at the limit
- **WHEN** the file count equals `maxFilesCount`
- **THEN** no Add button renders

#### Scenario: Buttons are absent without labels
- **WHEN** neither `addButtonLabel` nor `deleteAllButtonLabel` is set
- **THEN** no Add or Delete all button renders

### Requirement: Format, size and count validation
The field SHALL validate every selection — pick, drop or Add — and stop at the first failing rule, in this order: format against `acceptTypes` (case-insensitive, matching by extension or MIME type; `/` accepts any file), then each file against `maxFileSize` (MB), then the count against `maxFilesCount`, counting the files already listed. A single-file field with no `maxFilesCount` SHALL limit the list to one file. A failing selection SHALL NOT call `onChange` and SHALL show the matching text — `fileFormatError`, `fileSizeError` or `fileCountError` — until the next valid selection, a removal or Delete all. A rule with no limit set SHALL NOT be checked. On an empty single-file field, dropping or picking several files SHALL take the first.

#### Scenario: Wrong format is rejected
- **WHEN** a `.txt` file is dropped on a field accepting `application/json`
- **THEN** `onChange` is not called and `fileFormatError` is shown

#### Scenario: A mixed drop is rejected whole
- **WHEN** one valid and one wrong-format file are dropped together
- **THEN** `onChange` is not called and `fileFormatError` is shown

#### Scenario: One file too large
- **WHEN** a file larger than `maxFileSize` MB is picked
- **THEN** `onChange` is not called and `fileSizeError` is shown

#### Scenario: Too many files
- **WHEN** `maxFilesCount` is 1 and two files are picked, or one is added to a list holding one
- **THEN** `onChange` is not called and `fileCountError` is shown

#### Scenario: Error clears on a valid selection
- **WHEN** an error is shown and the user then picks a valid file
- **THEN** the error is removed and `onChange` is called with the file

### Requirement: Total size
While `multiple` and the combined size of the listed files exceeds `maxMultiFilesSize` (MB), the field SHALL show `multiFilesSizeError` under the list. This is a standing condition of the list and SHALL NOT block a selection.

#### Scenario: Total over the limit
- **WHEN** each file is under `maxFileSize` but their sum exceeds `maxMultiFilesSize` MB
- **THEN** the files stay listed and `multiFilesSizeError` is shown

### Requirement: Accessibility
The drop area SHALL be operable by keyboard through the kit's file input, the remove and action buttons SHALL carry accessible names, the field's `Label` SHALL name the file input, and the current error SHALL be announced through a `role="alert"` region rather than shown by colour alone.

#### Scenario: Error is announced
- **WHEN** a selection or total-size error appears
- **THEN** its text is rendered inside the field's `role="alert"` region
