import { CreateI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey, RoutesI18nKey } from '@/src/constants/i18n';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import RouteProperties from './RouteProperties';

describe('RouteProperties', () => {
  const baseRoute = {
    name: 'route1',
    description: 'desc',
    rewritePath: false,
    methods: ['GET'],
    response: { status: 200, body: 'ok' },
    order: 1,
    maxRetryAttempts: 3,
  };

  test('renders all fields for app route', () => {
    render(<RouteProperties route={baseRoute} isAppRoute={true} updateRoute={vi.fn()} />);
    expect(screen.getByText(EntityFieldsI18nKey.displayName)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.paths)).toBeInTheDocument();
    expect(screen.getByText(RoutesI18nKey.RewritePath)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.methods)).toBeInTheDocument();
    expect(screen.getByText(RoutesI18nKey.Output)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.status)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.body)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.maxRetryAttempts)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.order)).toBeInTheDocument();
  });

  test('renders description field for non-app route', () => {
    render(<RouteProperties route={baseRoute} isAppRoute={false} updateRoute={vi.fn()} />);
    expect(screen.getByText(EntityFieldsI18nKey.description)).toBeInTheDocument();
  });

  test('calls updateRoute when name changes', () => {
    const updateRoute = vi.fn();
    render(<RouteProperties route={baseRoute} isAppRoute={true} updateRoute={updateRoute} />);
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.DisplayName), {
      target: { value: 'newName' },
    });
    expect(updateRoute).toHaveBeenCalledWith(expect.objectContaining({ name: 'newName' }));
  });

  test('calls updateRoute when displayname changes', () => {
    const updateRoute = vi.fn();
    render(<RouteProperties route={baseRoute} isAppRoute={false} updateRoute={updateRoute} />);
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.DisplayName), {
      target: { value: 'newName' },
    });
    expect(updateRoute).toHaveBeenCalledWith(expect.objectContaining({ displayName: 'newName' }));
  });

  test('calls updateRoute when description changes', () => {
    const updateRoute = vi.fn();
    render(<RouteProperties route={{ ...baseRoute, response: void 0 }} isAppRoute={false} updateRoute={updateRoute} />);
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Description), {
      target: { value: 'newDesc' },
    });
    expect(updateRoute).toHaveBeenCalledWith(expect.objectContaining({ description: 'newDesc' }));
  });

  test('calls updateRoute when body changes', () => {
    const updateRoute = vi.fn();
    render(<RouteProperties route={baseRoute} isAppRoute={true} updateRoute={updateRoute} />);
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Body), { target: { value: 'newBody' } });
    expect(updateRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        response: expect.objectContaining({ body: 'newBody' }),
      }),
    );
  });

  test('calls updateRoute when order changes', () => {
    const updateRoute = vi.fn();
    render(<RouteProperties route={baseRoute} isAppRoute={true} updateRoute={updateRoute} />);
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Order), { target: { value: '7' } });
    expect(updateRoute).toHaveBeenCalledWith(expect.objectContaining({ order: 7 }));
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Order), { target: { value: null } });
    expect(updateRoute).toHaveBeenCalledWith(expect.objectContaining({ order: undefined }));
  });
});
