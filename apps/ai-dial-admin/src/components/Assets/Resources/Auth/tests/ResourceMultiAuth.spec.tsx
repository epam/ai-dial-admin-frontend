import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey, ErrorI18nKey, ExternalServiceI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { DialApplicationResource } from '@/src/models/dial/resource';
import ResourceMultiAuth from '../ResourceMultiAuth';

const baseAsset = {
  path: 'public/my-app',
  external_services: {
    'service-a': { display_name: 'Service A' },
    'service-b': { display_name: 'Service B' },
  },
} as DialApplicationResource;

describe('ResourceMultiAuth', () => {
  const user = userEvent.setup();

  test('adding a service with an ID that already exists shows an error and disables Apply', async () => {
    render(<ResourceMultiAuth asset={baseAsset} onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: ExternalServiceI18nKey.AddService }));
    await user.type(screen.getByLabelText(ExternalServiceI18nKey.ServiceId, { exact: false }), 'service-a');

    expect(screen.getByText(ErrorI18nKey.NameExists)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Apply })).toBeDisabled();
  });

  test('renaming a service to an ID owned by a different entry shows an error and disables Apply', async () => {
    render(<ResourceMultiAuth asset={baseAsset} onChange={vi.fn()} />);

    // Rows render in insertion order: service-a first, service-b second.
    const [editServiceA] = screen.getAllByRole('button', { name: ButtonsI18nKey.Edit });
    await user.click(editServiceA);

    const idInput = screen.getByLabelText(ExternalServiceI18nKey.ServiceId, { exact: false });
    await user.clear(idInput);
    await user.type(idInput, 'service-b');

    expect(screen.getByText(ErrorI18nKey.NameExists)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Apply })).toBeDisabled();
  });

  test('renaming a service to its own original ID does not show the duplicate error', async () => {
    render(<ResourceMultiAuth asset={baseAsset} onChange={vi.fn()} />);

    const [editServiceA] = screen.getAllByRole('button', { name: ButtonsI18nKey.Edit });
    await user.click(editServiceA);

    const idInput = screen.getByLabelText(ExternalServiceI18nKey.ServiceId, { exact: false });
    expect(idInput).toHaveValue('service-a');

    expect(screen.queryByText(ErrorI18nKey.NameExists)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Apply })).not.toBeDisabled();
  });

  test('adding a service does not offer "Without authentication" as an auth type', async () => {
    render(<ResourceMultiAuth asset={baseAsset} onChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: ExternalServiceI18nKey.AddService }));

    expect(screen.queryByText(ToolsetI18nKey.NoneAuth)).not.toBeInTheDocument();
  });
});
