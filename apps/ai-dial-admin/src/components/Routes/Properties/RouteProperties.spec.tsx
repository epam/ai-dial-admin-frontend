import { CreateI18nKey, EntitiesI18nKey, RoutesI18nKey } from '@/src/constants/i18n';
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
    expect(screen.getByText(CreateI18nKey.DisplayNameTitle)).toBeInTheDocument();
    expect(screen.getByText(RoutesI18nKey.PathTitle)).toBeInTheDocument();
    expect(screen.getByText(RoutesI18nKey.RewritePath)).toBeInTheDocument();
    expect(screen.getByText(RoutesI18nKey.MethodsTitle)).toBeInTheDocument();
    expect(screen.getByText(RoutesI18nKey.Output)).toBeInTheDocument();
    expect(screen.getByText(RoutesI18nKey.StatusTitle)).toBeInTheDocument();
    expect(screen.getByText(RoutesI18nKey.BodyTitle)).toBeInTheDocument();
    expect(screen.getByText(EntitiesI18nKey.MaxRetryAttempts)).toBeInTheDocument();
    expect(screen.getByText(RoutesI18nKey.Order)).toBeInTheDocument();
  });

  test('renders description field for non-app route', () => {
    render(<RouteProperties route={baseRoute} isAppRoute={false} updateRoute={vi.fn()} />);
    expect(screen.getByText(CreateI18nKey.DescriptionTitle)).toBeInTheDocument();
  });

  test('calls updateRoute when name changes', () => {
    const updateRoute = vi.fn();
    render(<RouteProperties route={baseRoute} isAppRoute={true} updateRoute={updateRoute} />);
    fireEvent.change(screen.getByPlaceholderText(CreateI18nKey.DisplayNamePlaceholder), {
      target: { value: 'newName' },
    });
    expect(updateRoute).toHaveBeenCalledWith(expect.objectContaining({ name: 'newName' }));
  });

  test('calls updateRoute when description changes', () => {
    const updateRoute = vi.fn();
    render(<RouteProperties route={{ ...baseRoute, response: void 0 }} isAppRoute={false} updateRoute={updateRoute} />);
    fireEvent.change(screen.getByPlaceholderText(CreateI18nKey.DescriptionPlaceholder), {
      target: { value: 'newDesc' },
    });
    expect(updateRoute).toHaveBeenCalledWith(expect.objectContaining({ description: 'newDesc' }));
  });

  test('calls updateRoute when body changes', () => {
    const updateRoute = vi.fn();
    render(<RouteProperties route={baseRoute} isAppRoute={true} updateRoute={updateRoute} />);
    fireEvent.change(screen.getByPlaceholderText(RoutesI18nKey.BodyPlaceholder), { target: { value: 'newBody' } });
    expect(updateRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        response: expect.objectContaining({ body: 'newBody' }),
      }),
    );
  });

  test('calls updateRoute when order changes', () => {
    const updateRoute = vi.fn();
    render(<RouteProperties route={baseRoute} isAppRoute={true} updateRoute={updateRoute} />);
    fireEvent.change(screen.getByPlaceholderText(RoutesI18nKey.OrderPlaceholder), { target: { value: '7' } });
    expect(updateRoute).toHaveBeenCalledWith(expect.objectContaining({ order: 7 }));
    fireEvent.change(screen.getByPlaceholderText(RoutesI18nKey.OrderPlaceholder), { target: { value: null } });
    expect(updateRoute).toHaveBeenCalledWith(expect.objectContaining({ order: undefined }));
  });
});
