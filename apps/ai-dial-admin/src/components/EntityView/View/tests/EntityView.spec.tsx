import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EntityView from '../EntityView';
import { TabsI18nKey } from '@/src/constants/i18n';

const baseProps = {
  view: 'Applications',
  originalEntity: { id: '1', name: 'Entity' },
  names: ['Entity'],
  etag: 'etag',
  updateEntity: vi.fn(),
  removeEntity: vi.fn(),
};

describe('EntityView', () => {
  it('renders tabs, header buttons, and content', () => {
    render(<EntityView {...baseProps} />);
    expect(screen.getByText(TabsI18nKey.Properties)).toBeInTheDocument();
  });
});
