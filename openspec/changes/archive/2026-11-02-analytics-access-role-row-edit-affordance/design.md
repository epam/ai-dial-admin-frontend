## Context

Activating a roles-grid row already opens the role drawer in edit mode, and the row menu already carries Remove. The gap is discoverability, not capability.

## Decisions

### D1. Add Edit to the row menu through the shared edit operation

The grid's other menus build Edit from the shared edit operation, which fixes its icon, label and id. The roles grid does the same, so the entry reads like every other Edit in the application and no new string is introduced. Its click handler is the one the row activation already uses, and it is unavailable under Remove's condition.

- **Alternative: leave the menu and only signal the row is clickable.** Rejected: a menu entry is reachable by keyboard and by users who look for actions there first.

### D2. Signal the clickable row with the shared pointer class

Grids whose rows open something mark every row with the grid's clickable-row class, which sets a pointer cursor. The roles grid adds the same row class rule next to its existing click handlers. The cursor is a visual affordance and carries no scenario.

### D3. The removal confirmation uses the dialog's description area

The Delete table confirmation passes its content through the dialog's description, which the kit pads. The Remove role confirmation passes the same kind of content as children, which the kit leaves unpadded, so its details sit against the edge. Moving the content into the description gives both dialogs one alignment without adding any spacing of our own.

## Risks

- None known: the change reuses existing operations and a kit prop.
