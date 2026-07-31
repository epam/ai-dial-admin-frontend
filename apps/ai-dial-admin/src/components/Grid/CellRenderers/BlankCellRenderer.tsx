import { FC } from 'react';

// A shared (case-level) field on a multi-turn TURN row already shows its value once on the GROUP
// master row, so turn rows render nothing here even though their merged `data` still carries it.
const BlankCellRenderer: FC = () => null;

export default BlankCellRenderer;
