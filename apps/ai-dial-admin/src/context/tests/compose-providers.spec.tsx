import { ReactNode, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import { composeProviders } from '@/src/context/compose-providers';

const createProvider =
  (name: string) =>
  ({ children }: { children: ReactNode }) => (
    <div role="group" aria-label={name}>
      {children}
    </div>
  );

describe('composeProviders', () => {
  test('nests providers with the first entry outermost', () => {
    const Composed = composeProviders([createProvider('first'), createProvider('second'), createProvider('third')]);

    render(
      <Composed>
        <span>content</span>
      </Composed>,
    );

    const first = screen.getByRole('group', { name: 'first' });
    const second = screen.getByRole('group', { name: 'second' });
    const third = screen.getByRole('group', { name: 'third' });

    expect(first).toContainElement(second);
    expect(second).toContainElement(third);
    expect(third).toContainElement(screen.getByText('content'));
  });

  test('renders children as-is for an empty list', () => {
    const Composed = composeProviders([]);

    render(
      <Composed>
        <span>content</span>
      </Composed>,
    );

    expect(screen.getByText('content')).toBeInTheDocument();
  });

  test('keeps provider state across re-renders of the caller', async () => {
    const StatefulProvider = ({ children }: { children: ReactNode }) => {
      const [count, setCount] = useState(0);
      return (
        <div>
          <button onClick={() => setCount((prev) => prev + 1)}>increment</button>
          <output>{count}</output>
          {children}
        </div>
      );
    };
    const Composed = composeProviders([StatefulProvider]);
    const Parent = () => {
      const [, setTick] = useState(0);
      return (
        <>
          <button onClick={() => setTick((prev) => prev + 1)}>rerender</button>
          <Composed>
            <span>content</span>
          </Composed>
        </>
      );
    };
    const user = userEvent.setup();

    render(<Parent />);
    await user.click(screen.getByRole('button', { name: 'increment' }));
    await user.click(screen.getByRole('button', { name: 'rerender' }));

    expect(screen.getByRole('status')).toHaveTextContent('1');
  });
});
