'use client';

import { FC, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

/** Row for a card's pinned bottom slot; the shared minimum height centres every footer's text on the same line. */
const CardFooter: FC<Props> = ({ children }) => <div className="flex min-h-5 items-center">{children}</div>;

export default CardFooter;
