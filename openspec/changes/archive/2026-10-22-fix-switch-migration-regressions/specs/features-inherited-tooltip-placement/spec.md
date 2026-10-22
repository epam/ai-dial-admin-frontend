## ADDED Requirements

### Requirement: Inherited feature tooltip anchors to its switch
On the Features tab of Models and Applications, including the asset-application (`ResourceFeatures`) Features tab, the tooltip explaining that a disabled switch's value is inherited from an Application Runner SHALL be anchored to the switch it describes and SHALL appear directly below it, not to the side of its grid cell.

#### Scenario: Tooltip appears under the hovered inherited switch
- **GIVEN** an Application with inherited features from an Application Runner
- **WHEN** the user hovers a disabled inherited switch such as "Assistant Attachments in request"
- **THEN** the tooltip "This value is inherited from Application Runner features" is shown directly below that switch

#### Scenario: Editable switch has no tooltip
- **GIVEN** a feature switch that is not inherited
- **WHEN** the user hovers it
- **THEN** no tooltip is shown

#### Scenario: Switches are not stretched across the row
- **WHEN** the Features tab renders a switch group
- **THEN** its switches and their tooltip triggers are as wide as their content, not the full row
