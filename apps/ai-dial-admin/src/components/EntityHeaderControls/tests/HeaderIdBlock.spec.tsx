import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { StatusBadgeI18nKey } from '@/src/constants/i18n';
import { DialModelResourceStatus } from '@/src/models/dial/resource';
import HeaderIdBlock from '../HeaderIdBlock';

describe('EntityHeaderControls :: HeaderIdBlock', () => {
  test('Should render the status badge before the id with an 8px gap', () => {
    const { container } = render(<HeaderIdBlock id="my-model" metadata={{ status: DialModelResourceStatus.Valid }} />);

    const badge = screen.getByText(StatusBadgeI18nKey.Valid);
    const id = screen.getByText('my-model');
    expect(badge.compareDocumentPosition(id) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.firstChild).toHaveClass('gap-2');
  });

  test('Should render the invalid badge for an invalid status', () => {
    render(<HeaderIdBlock id="my-model" metadata={{ status: DialModelResourceStatus.Invalid }} />);

    expect(screen.getByText(StatusBadgeI18nKey.Invalid)).toBeInTheDocument();
  });

  test('Should render only the id, with no placeholder, when there is no status', () => {
    const { container } = render(<HeaderIdBlock id="my-app" metadata={{}} />);

    expect(screen.getByText('my-app')).toBeInTheDocument();
    expect(screen.queryByText(StatusBadgeI18nKey.Valid)).not.toBeInTheDocument();
    expect(screen.queryByText(StatusBadgeI18nKey.Invalid)).not.toBeInTheDocument();
    expect(container.firstChild).toHaveClass('gap-0.5');
  });

  test('Should render the sync slot before the id', () => {
    render(
      <HeaderIdBlock id="my-model" metadata={undefined}>
        <span>sync-slot</span>
      </HeaderIdBlock>,
    );

    const slot = screen.getByText('sync-slot');
    const id = screen.getByText('my-model');
    expect(slot.compareDocumentPosition(id) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
