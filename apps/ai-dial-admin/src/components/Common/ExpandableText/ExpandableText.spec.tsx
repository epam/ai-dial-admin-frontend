'use client';

import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import ExpandableText from './ExpandableText';

vi.mock('@epam/ai-dial-ui-kit', () => ({
  DialLinkButton: ({ label, onClick }: any) => (
    <button type="button" onClick={onClick}>
      {label}
    </button>
  ),
}));

const setOverflow = (scrollHeight: number, clientHeight: number) => {
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get: () => scrollHeight,
  });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get: () => clientHeight,
  });
};

describe('ExpandableText', () => {
  afterEach(() => {
    setOverflow(0, 0);
  });

  test('renders children', () => {
    render(<ExpandableText lines={3}>Hello world</ExpandableText>);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  test('applies className to wrapper element', () => {
    const { container } = render(
      <ExpandableText lines={3} className="my-class">
        content
      </ExpandableText>,
    );
    expect(container.firstChild).toHaveClass('my-class');
  });

  test('does not show toggle button when content fits', () => {
    render(<ExpandableText lines={3}>Short text</ExpandableText>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('shows "Show More" button when content overflows', () => {
    setOverflow(200, 100);
    render(<ExpandableText lines={3}>Long text content</ExpandableText>);
    expect(screen.getByRole('button', { name: ButtonsI18nKey.ShowMore })).toBeInTheDocument();
  });

  test('switches to "Show Less" after clicking "Show More"', () => {
    setOverflow(200, 100);
    render(<ExpandableText lines={3}>Long text content</ExpandableText>);

    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.ShowMore }));

    expect(screen.getByRole('button', { name: ButtonsI18nKey.ShowLess })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.ShowMore })).not.toBeInTheDocument();
  });

  test('switches back to "Show More" after clicking "Show Less"', () => {
    setOverflow(200, 100);
    render(<ExpandableText lines={3}>Long text content</ExpandableText>);

    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.ShowMore }));
    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.ShowLess }));

    expect(screen.getByRole('button', { name: ButtonsI18nKey.ShowMore })).toBeInTheDocument();
  });

  test('keeps "Show Less" visible when expanded even if overflow condition clears', () => {
    setOverflow(200, 100);
    render(<ExpandableText lines={3}>Long text content</ExpandableText>);

    fireEvent.click(screen.getByRole('button', { name: ButtonsI18nKey.ShowMore }));

    setOverflow(0, 0);
    expect(screen.getByRole('button', { name: ButtonsI18nKey.ShowLess })).toBeInTheDocument();
  });
});
