import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Endpoint from './Endpoint';
import { ButtonsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';

const baseEndpoint = {
  endpoint: 'http://test',
  key: 'key',
  weight: 1,
  tier: 2,
  extraData: undefined,
};

describe('Endpoint', () => {
  let updateEndpoint: any;
  let removeEndpoint: any;

  beforeEach(() => {
    updateEndpoint = vi.fn();
    removeEndpoint = vi.fn();
  });

  it('renders all main fields and remove button', () => {
    render(
      <Endpoint
        index={0}
        readonly={false}
        numEndpoints={2}
        endpoint={baseEndpoint as any}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );
    // Check for input fields by placeholder
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.UpstreamEndpoint)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.UpstreamKey)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Weight)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Tier)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.extraData)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Remove })).toBeInTheDocument();
  });

  it('calls updateEndpoint on endpoint url change', () => {
    render(
      <Endpoint
        index={0}
        readonly={false}
        numEndpoints={1}
        endpoint={baseEndpoint as any}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.UpstreamEndpoint), {
      target: { value: 'new-url' },
    });
    expect(updateEndpoint).toHaveBeenCalledWith({ ...baseEndpoint, endpoint: 'new-url' });
  });

  it('calls updateEndpoint on key, weight, and tier change', () => {
    render(
      <Endpoint
        index={0}
        readonly={false}
        numEndpoints={1}
        endpoint={baseEndpoint as any}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.UpstreamKey), {
      target: { value: 'new-key' },
    });
    expect(updateEndpoint).toHaveBeenCalledWith({ ...baseEndpoint, key: 'new-key' });
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Weight), { target: { value: '5' } });
    expect(updateEndpoint).toHaveBeenCalledWith({ ...baseEndpoint, weight: 5 });
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Tier), { target: { value: '3' } });
    expect(updateEndpoint).toHaveBeenCalledWith({ ...baseEndpoint, tier: 3 });
  });

  it('calls removeEndpoint on remove button click', () => {
    render(
      <Endpoint
        index={0}
        readonly={false}
        numEndpoints={2}
        endpoint={baseEndpoint as any}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );
    fireEvent.click(screen.getByLabelText('remove'));
    expect(removeEndpoint).toHaveBeenCalledWith(0);
  });

  it('does not render remove button if readonly', () => {
    render(
      <Endpoint
        index={0}
        readonly={true}
        numEndpoints={2}
        endpoint={baseEndpoint as any}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Remove })).toBeNull();
  });
});
