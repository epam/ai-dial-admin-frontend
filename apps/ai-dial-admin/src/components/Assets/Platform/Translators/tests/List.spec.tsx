import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ApplicationRoute } from '@/src/types/routes';
import TranslatorsList from '../List';

vi.mock('@/src/components/Assets/BaseAssetList/BaseAssetList', () => ({
  default: ({ view }: any) => <div>base-asset-list:{view}</div>,
}));

describe('TranslatorsList', () => {
  test('renders BaseAssetList scoped to the PlatformTranslators view', () => {
    render(<TranslatorsList />);

    expect(screen.getByText(`base-asset-list:${ApplicationRoute.PlatformTranslators}`)).toBeInTheDocument();
  });
});
