import { ReactNode } from 'react';

/** One labelled figure under a card total, e.g. `Model: 341s`. */
export interface BreakdownPart {
  label: string;
  value: ReactNode;
}
