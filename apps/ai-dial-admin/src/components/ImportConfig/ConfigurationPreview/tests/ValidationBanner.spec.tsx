import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import ValidationBanner from '../ValidationBanner';
import { ImportI18nKey } from '@/src/constants/i18n';

describe('ValidationBanner', () => {
  test('renders nothing when count is 0', () => {
    const { container } = render(<ValidationBanner count={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('renders heading (semi-bold) and help text when count > 0', () => {
    const { container } = render(<ValidationBanner count={3} />);
    // useI18n is mocked to return the key as-is (see test-setup.tsx)
    expect(screen.getByText(ImportI18nKey.ValidationBannerHeading)).toBeInTheDocument();
    expect(screen.getByText(ImportI18nKey.ValidationBannerHelp, { exact: false })).toBeInTheDocument();
    expect(container.querySelector('.dial-small-semi-text')).toBeInTheDocument();
    expect(container.querySelector('.dial-small-text')).toBeInTheDocument();
  });
});
