import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import Accordion from './Accordion';

describe('Common components :: Accordion', () => {
  test('renders title and is collapsed by default', () => {
    const title = 'My accordion';
    const { container } = render(
      <Accordion title={title}>
        <div>Child content</div>
      </Accordion>,
    );

    expect(screen.getByText(title)).toBeInTheDocument();

    const root = container.firstElementChild as HTMLElement;
    const content = root.lastElementChild as HTMLElement;
    expect(content).toHaveClass('hidden');
  });

  test('toggles collapse on click and shows children', () => {
    const title = 'My accordion';
    const { container } = render(
      <Accordion title={title}>
        <div>Child content</div>
      </Accordion>,
    );

    const root = container.firstElementChild as HTMLElement;
    const content = root.lastElementChild as HTMLElement;

    const toggleButton = screen.getByRole('button', { name: title });

    fireEvent.click(toggleButton);
    expect(content).not.toHaveClass('hidden');
    expect(screen.getByText('Child content')).toBeInTheDocument();

    fireEvent.click(toggleButton);
    expect(content).toHaveClass('hidden');
  });

  test('render error indicator', () => {
    render(
      <Accordion title={'title'} errorIndicator={true}>
        <div>Child content</div>
      </Accordion>,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
