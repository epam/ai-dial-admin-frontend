/**
 * Compare-card layout hooks into the kit's markup, which exposes no props for them.
 *
 * The kit centres the divider between the two run columns on whatever content the columns hold, so
 * cards with different heights get dividers at different levels. Pinning it to the top and pushing it
 * down by the run-title row (16px) + gap (2px) + half the difference between the value line (40px,
 * display 2) and the divider (16px) puts it on the value line of every card.
 */
export const COMPARE_CARD_CLASS = 'min-w-0 flex-1 [&_.w-px]:mt-[30px] [&_.w-px]:self-start';

/** The kit renders a card's description as its last child span; push it to the bottom of a stretched card. */
export const COMPARE_CARD_BOTTOM_LABEL_CLASS = `${COMPARE_CARD_CLASS} [&>span:last-child]:mt-auto`;
