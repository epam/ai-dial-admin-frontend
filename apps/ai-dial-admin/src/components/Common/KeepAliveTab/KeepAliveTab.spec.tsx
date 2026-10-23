import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { useState } from 'react';

import KeepAliveTab from './KeepAliveTab';

const Counter = () => {
  const [value, setValue] = useState('');
  return <input aria-label="field" value={value} onChange={(e) => setValue(e.target.value)} />;
};

describe('Common components :: KeepAliveTab', () => {
  test('does not mount children before the first activation', () => {
    render(
      <KeepAliveTab isActive={false}>
        <Counter />
      </KeepAliveTab>,
    );

    expect(screen.queryByLabelText('field', { selector: 'input' })).not.toBeInTheDocument();
  });

  test('keeps local state and hides the content while inactive', () => {
    const { rerender } = render(
      <KeepAliveTab isActive>
        <Counter />
      </KeepAliveTab>,
    );
    const input = screen.getByLabelText('field') as HTMLInputElement;
    input.focus();
    // controlled input: drive through a native value setter so React sees the change
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'abc');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(input.value).toBe('abc');

    rerender(
      <KeepAliveTab isActive={false}>
        <Counter />
      </KeepAliveTab>,
    );
    expect(input.parentElement).toHaveClass('hidden');
    expect(input.parentElement).toHaveAttribute('inert');

    rerender(
      <KeepAliveTab isActive>
        <Counter />
      </KeepAliveTab>,
    );
    expect(screen.getByLabelText('field')).toBe(input);
    expect((screen.getByLabelText('field') as HTMLInputElement).value).toBe('abc');
    expect(input.parentElement).not.toHaveClass('hidden');
  });
});
