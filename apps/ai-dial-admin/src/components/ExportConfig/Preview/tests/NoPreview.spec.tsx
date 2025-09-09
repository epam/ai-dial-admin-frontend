import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import NoPreview from '../NoPreview';
import { ExportI18nKey } from '@/src/constants/i18n';

describe('NoPreview', () => {
  it('renders export config title and button', () => {
    render(<NoPreview />);
    expect(screen.getByText(ExportI18nKey.NoPreview)).toBeInTheDocument();
  });
});
