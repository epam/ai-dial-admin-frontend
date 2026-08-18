import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import CodeSnippet from './CodeSnippet';

const SCRIPT = 'import json\n\nROW = {\n    "score": "94.25",\n}';

describe('Common components :: CodeSnippet', () => {
  test('renders its title and value verbatim, preserving the whitespace of the snippet', () => {
    render(<CodeSnippet title="python" value={SCRIPT} />);

    expect(screen.getByText('python')).toBeInTheDocument();
    const block = document.querySelector('pre') as HTMLElement;
    expect(block.textContent).toBe(SCRIPT);
  });

  test('copies the exact snippet text, not a normalized rendering of it', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<CodeSnippet title="shell" value={SCRIPT} />);
    fireEvent.click(screen.getByLabelText('copy shell'));

    expect(writeText).toHaveBeenCalledWith(SCRIPT);
  });

  test('scrolls a long line rather than wrapping it, so a statement stays on one line', () => {
    render(<CodeSnippet title="shell" value={SCRIPT} />);

    expect(document.querySelector('pre')).toHaveClass('overflow-x-auto');
  });
});
