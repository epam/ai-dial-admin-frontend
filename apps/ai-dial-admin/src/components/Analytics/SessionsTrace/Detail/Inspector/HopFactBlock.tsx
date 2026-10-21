'use client';

import { FC } from 'react';

interface Props {
  label: string;
  text: string;
}

// A labelled block of recorded text, monospaced because what it holds is a body fragment rather than prose.
// Shared by the two halves of an MCP hop, which state the same shape on different tabs.
const HopFactBlock: FC<Props> = ({ label, text }) => (
  <div className="flex min-w-0 flex-col gap-1">
    <span className="text-secondary dial-tiny-text">{label}</span>
    <pre className="whitespace-pre-wrap break-words rounded border border-primary bg-layer-1 p-2 font-mono text-primary dial-caption-text">
      {text}
    </pre>
  </div>
);

export default HopFactBlock;
