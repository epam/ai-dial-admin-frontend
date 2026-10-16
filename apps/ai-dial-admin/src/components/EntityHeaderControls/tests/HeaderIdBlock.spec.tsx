import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import HeaderIdBlock from '../HeaderIdBlock';

describe('EntityHeaderControls :: HeaderIdBlock', () => {
  test('Should render the badges in a row before the id, 20px apart', () => {
    render(<HeaderIdBlock id="my-model" statusBadges={[<span key="a">first</span>, <span key="b">second</span>]} />);

    const first = screen.getByText('first');
    const row = first.parentElement as HTMLElement;
    expect(row).toHaveClass('gap-5', 'py-1');
    expect(row).toContainElement(screen.getByText('second'));
    expect(row.compareDocumentPosition(screen.getByText('my-model')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  test('Should keep the row collapsible so it takes no space when no badge renders', () => {
    const { container } = render(<HeaderIdBlock id="my-app" statusBadges={null} />);

    expect(screen.getByText('my-app')).toBeInTheDocument();
    const row = container.firstElementChild?.firstElementChild;
    expect(row).toBeEmptyDOMElement();
    expect(row).toHaveClass('empty:hidden');
  });

  test('Should render the id with no row content when no badges are passed', () => {
    const { container } = render(<HeaderIdBlock id="my-app" />);

    expect(container.firstElementChild?.firstElementChild).toBeEmptyDOMElement();
  });
});
