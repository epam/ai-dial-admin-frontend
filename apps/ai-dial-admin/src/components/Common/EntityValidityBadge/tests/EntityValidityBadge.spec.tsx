import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { StatusBadgeI18nKey } from '@/src/constants/i18n';
import { DialModelResourceStatus } from '@/src/models/dial/resource';
import EntityValidityBadge from '../EntityValidityBadge';

describe('Common components :: EntityValidityBadge', () => {
  test('Should render a success badge without an info icon for a valid entity', () => {
    render(<EntityValidityBadge entity={{ _metadata: { status: DialModelResourceStatus.Valid } }} />);

    expect(screen.getByText(StatusBadgeI18nKey.Valid).parentElement).toHaveClass('bg-success', 'text-success');
    expect(screen.queryByRole('button', { name: StatusBadgeI18nKey.Details })).not.toBeInTheDocument();
  });

  test('Should render an error badge with an info icon for an invalid entity with a message', () => {
    render(<EntityValidityBadge entity={{ validityState: { valid: false, message: 'Missing deployment' } }} />);

    expect(screen.getByText(StatusBadgeI18nKey.Invalid).parentElement).toHaveClass('bg-error', 'text-error');
    expect(screen.getByRole('button', { name: StatusBadgeI18nKey.Details })).toBeInTheDocument();
  });

  test('Should render an error badge without an info icon when the invalid entity has no text', () => {
    render(<EntityValidityBadge entity={{ _metadata: { status: DialModelResourceStatus.Invalid } }} />);

    expect(screen.getByText(StatusBadgeI18nKey.Invalid)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: StatusBadgeI18nKey.Details })).not.toBeInTheDocument();
  });

  test('Should render nothing for an entity reporting no validity', () => {
    const { container } = render(<EntityValidityBadge entity={{}} />);

    expect(container).toBeEmptyDOMElement();
  });
});
