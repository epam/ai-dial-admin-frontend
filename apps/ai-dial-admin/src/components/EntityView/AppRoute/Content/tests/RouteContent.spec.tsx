import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import RouteContent from '../RouteContent';
import { EntityFieldsI18nKey, RoutesI18nKey, TabsI18nKey } from '@/src/constants/i18n';

describe('RouteContent', () => {
  const route = { id: 'route1', paths: [''] };

  test('renders tabs and RouteProperties by default', () => {
    render(<RouteContent route={route} onChangeRoute={vi.fn()} roles={[]} />);
    expect(screen.getByRole('tab', { name: TabsI18nKey.Attachments })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: TabsI18nKey.Roles })).toBeInTheDocument();
  });
});
