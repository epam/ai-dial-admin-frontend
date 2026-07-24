'use client';

/**
 * Renders nothing. Used for a shared (test-case-level) field on a multi-turn TURN row: the value is
 * shown once on the GROUP master row, so the turn rows deliberately leave the column blank even though
 * their merged `data` still carries the shared value.
 */
const BlankCellRenderer = () => null;

export default BlankCellRenderer;
