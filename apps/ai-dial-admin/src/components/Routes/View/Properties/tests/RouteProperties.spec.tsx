import {
  ButtonsI18nKey,
  CreateI18nKey,
  EntityFieldsI18nKey,
  EntityPlaceholdersI18nKey,
  ErrorI18nKey,
  RoutesI18nKey,
} from '@/src/constants/i18n';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import RouteProperties from '@/src/components/Routes/View/Properties/RouteProperties';
import { ORDER_DEFAULT_VALUE } from '@/src/constants/routes';

describe('RouteProperties', () => {
  const baseRoute = {
    name: 'route1',
    description: 'desc',
    rewritePath: false,
    methods: ['GET'],
    response: { status: 200, body: 'ok' },
    order: 1,
    paths: ['/path1'],
    maxRetryAttempts: 3,
  };

  test('renders all fields for app route', () => {
    render(<RouteProperties route={baseRoute} isAppRoute={true} onChange={vi.fn()} />);
    expect(screen.getByText(EntityFieldsI18nKey.displayName)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.paths)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.rewritePath)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.methods)).toBeInTheDocument();
    expect(screen.getByText(RoutesI18nKey.Output)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.status)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.body)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.maxRetryAttempts)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.order)).toBeInTheDocument();
  });

  test('renders description field for non-app route', () => {
    render(<RouteProperties route={baseRoute} isAppRoute={true} onChange={vi.fn()} />);
    expect(screen.getByText(EntityFieldsI18nKey.displayName)).toBeInTheDocument();
  });

  test('calls updateRoute when displayname changes', () => {
    const updateRoute = vi.fn();
    render(<RouteProperties route={baseRoute} isAppRoute={false} onChange={updateRoute} />);
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.DisplayName), {
      target: { value: 'newName' },
    });
    expect(updateRoute).toHaveBeenCalledWith(expect.objectContaining({ displayName: 'newName' }));
  });

  test('calls updateRoute when description changes', () => {
    const updateRoute = vi.fn();
    render(<RouteProperties route={{ ...baseRoute, response: void 0 }} isAppRoute={false} onChange={updateRoute} />);
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Description), {
      target: { value: 'newDesc' },
    });
    expect(updateRoute).toHaveBeenCalledWith(expect.objectContaining({ description: 'newDesc' }));
  });

  test('calls updateRoute when body changes', () => {
    const updateRoute = vi.fn();
    render(<RouteProperties route={baseRoute} isAppRoute={true} onChange={updateRoute} />);
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Body), { target: { value: 'newBody' } });
    expect(updateRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        response: expect.objectContaining({ body: 'newBody' }),
      }),
    );
  });

  test('should render reset button if order changes', async () => {
    const updateRoute = vi.fn();
    render(<RouteProperties route={baseRoute} isAppRoute={true} onChange={updateRoute} />);
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Order), { target: { value: '1' } });
    const resetBtn = await screen.findByText(ButtonsI18nKey.ResetToDefault);
    expect(resetBtn).toBeInTheDocument();

    fireEvent.click(resetBtn);
    expect(updateRoute).toHaveBeenCalledWith(expect.objectContaining({ order: ORDER_DEFAULT_VALUE }));
  });

  test('shows alphanumeric error when app route name contains forbidden character', () => {
    render(<RouteProperties route={baseRoute} isAppRoute={true} onChange={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.DisplayName), {
      target: { value: 'my-route' },
    });
    expect(screen.getByText(ErrorI18nKey.AlphanumericUnderscore)).toBeInTheDocument();
  });

  test('calls updateRoute when order changes', () => {
    const updateRoute = vi.fn();
    render(<RouteProperties route={baseRoute} isAppRoute={true} onChange={updateRoute} />);
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Order), { target: { value: '7' } });
    expect(updateRoute).toHaveBeenCalledWith(expect.objectContaining({ order: 7 }));
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Order), { target: { value: null } });
    expect(updateRoute).toHaveBeenCalledWith(expect.objectContaining({ order: undefined }));
  });
});
