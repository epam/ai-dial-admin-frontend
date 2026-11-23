import { ReactNode } from 'react';

/** One labelled figure under a card total, e.g. `Model: 341s`. */
export interface BreakdownPart {
  label: string;
  value: ReactNode;
}

/**
 * Which part of a card value to render. The single-run card puts the figure in the card's value slot and the
 * footer in its pinned bottom slot so the footers line up across the row; compare cards render both together.
 */
export enum CardValueSection {
  Full = 'full',
  Figure = 'figure',
  Footer = 'footer',
}
