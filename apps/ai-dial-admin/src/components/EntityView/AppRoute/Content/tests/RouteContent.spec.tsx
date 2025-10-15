import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import RouteContent from '../RouteContent';
import { EntityFieldsI18nKey, RoutesI18nKey, TabsI18nKey } from '@/src/constants/i18n';

describe('RouteContent', () => {
  const route = { id: 'route1', paths: [''] };

  test('renders tabs and RouteProperties by default', () => {
    render(<RouteContent route={route} onChangeRoute={vi.fn()} />);
    expect(screen.getByRole('tab', { name: TabsI18nKey.Attachments })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: TabsI18nKey.Roles })).toBeInTheDocument();
  });

  test('shows RouteAttachments when Attachments tab is clicked', () => {
    render(<RouteContent route={route} onChangeRoute={vi.fn()} />);
    fireEvent.click(screen.getByRole('tab', { name: TabsI18nKey.Attachments }));
    expect(screen.getByText(RoutesI18nKey.RequestAttachmentPaths)).toBeInTheDocument();
    expect(screen.getByText(RoutesI18nKey.ResponseAttachmentPaths)).toBeInTheDocument();
  });

  test('shows RouteProperties when Properties tab is clicked', () => {
    render(<RouteContent route={route} onChangeRoute={vi.fn()} />);
    fireEvent.click(screen.getByRole('tab', { name: TabsI18nKey.Attachments }));
    expect(screen.getByText(RoutesI18nKey.RequestAttachmentPaths)).toBeInTheDocument();
    expect(screen.getByText(RoutesI18nKey.ResponseAttachmentPaths)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: TabsI18nKey.Properties }));
    expect(screen.getByText(EntityFieldsI18nKey.paths)).toBeInTheDocument();
  });
});
