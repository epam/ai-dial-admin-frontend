import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import { DatasetsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';

import PrivateDatasetTag from '../PrivateDatasetTag';

describe('PrivateDatasetTag', () => {
  test('renders the private label', () => {
    render(<PrivateDatasetTag />);

    expect(screen.getByText(DatasetsI18nKey.VisibilityPrivate)).toBeInTheDocument();
  });

  test('is keyboard-focusable and reveals the explanation on focus', async () => {
    const user = userEvent.setup();
    render(<PrivateDatasetTag />);

    await user.tab();

    expect(screen.getByText(DatasetsI18nKey.VisibilityPrivate).closest('[tabindex="0"]')).toHaveFocus();
    expect(await screen.findByText(TestSuitesI18nKey.TestCasesPrivateTagTooltip)).toBeInTheDocument();
  });
});
