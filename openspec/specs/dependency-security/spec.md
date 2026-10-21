# dependency-security Specification

## Purpose
TBD: Define production dependency security requirements.

## Requirements

### Requirement: Production frontmatter processing has no vulnerable sprintf-js chain
The system SHALL process markdown and `SKILL.md` YAML frontmatter without installing `gray-matter`'s `js-yaml@3` → `argparse` → `sprintf-js` dependency chain. The replacement SHALL use a maintained declared dependency and preserve the application's existing frontmatter behavior.

#### Scenario: Production audit has no sprintf-js finding
- **WHEN** the production dependency tree is audited after installation
- **THEN** the audit reports no vulnerability for `sprintf-js` and no vulnerable `gray-matter` transitive chain

### Requirement: Frontmatter parsing preserves application behavior
The system SHALL extract YAML frontmatter only from a leading, closed `---` block, return the remaining markdown body unchanged, and parse frontmatter fields for use by skill manifests. A document without leading frontmatter SHALL be treated as body content.

#### Scenario: A skill manifest is parsed
- **WHEN** a `SKILL.md` document has a leading YAML block containing `name` and `description`
- **THEN** the system returns those values and the markdown content after the closing delimiter

#### Scenario: A markdown body contains a later delimiter
- **WHEN** a document has valid leading frontmatter and its body contains additional `---` lines
- **THEN** the additional delimiter lines remain part of the returned body

#### Scenario: A document has no frontmatter
- **WHEN** a document does not begin with a closed frontmatter block
- **THEN** the system treats the full document as body content

### Requirement: Skill manifest updates retain unrelated frontmatter
The system SHALL serialize staged `name`, `description`, and body updates as a valid YAML-frontmatter document while retaining parsed frontmatter fields the editor does not expose.

#### Scenario: An edited manifest contains a version field
- **WHEN** the system reassembles a manifest that originally contains `version` along with editable fields
- **THEN** the serialized document contains the updated editable values, the body, and the original `version` field
