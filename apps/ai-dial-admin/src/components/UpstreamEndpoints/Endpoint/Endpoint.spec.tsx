import { ButtonsI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import Endpoint from './Endpoint';

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

  test('renders line 1 fields and remove button by default', () => {
    render(
      <Endpoint
        index={0}
        disabled={false}
        endpoint={baseEndpoint as any}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.UpstreamEndpoint)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Weight)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Tier)).toBeInTheDocument();
    expect(screen.getByLabelText('remove')).toBeInTheDocument();
    // Key and extraData are behind the collapse toggle by default
    expect(screen.queryByPlaceholderText(EntityPlaceholdersI18nKey.UpstreamKey)).not.toBeInTheDocument();
    expect(screen.queryByText(EntityFieldsI18nKey.extraData)).not.toBeInTheDocument();
  });

  test('renders key and extraData fields after expanding', () => {
    render(
      <Endpoint
        index={0}
        disabled={false}
        endpoint={baseEndpoint as any}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );
    fireEvent.click(screen.getByLabelText('toggle expanded fields'));
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.UpstreamKey)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.extraData)).toBeInTheDocument();
    expect(screen.getByText(EntityFieldsI18nKey.secretExtraData)).toBeInTheDocument();
  });

  test('collapses key and extraData fields on second toggle click', () => {
    render(
      <Endpoint
        index={0}
        disabled={false}
        endpoint={baseEndpoint as any}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );
    fireEvent.click(screen.getByLabelText('toggle expanded fields'));
    fireEvent.click(screen.getByLabelText('toggle expanded fields'));
    expect(screen.queryByPlaceholderText(EntityPlaceholdersI18nKey.UpstreamKey)).not.toBeInTheDocument();
    expect(screen.queryByText(EntityFieldsI18nKey.extraData)).not.toBeInTheDocument();
  });

  test('calls updateEndpoint on endpoint url change', () => {
    render(
      <Endpoint
        index={0}
        disabled={false}
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

  test('calls updateEndpoint on weight and tier change', () => {
    render(
      <Endpoint
        index={0}
        disabled={false}
        endpoint={baseEndpoint as any}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Weight), { target: { value: '5' } });
    expect(updateEndpoint).toHaveBeenCalledWith({ ...baseEndpoint, weight: 5 });
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.Tier), { target: { value: '3' } });
    expect(updateEndpoint).toHaveBeenCalledWith({ ...baseEndpoint, tier: 3 });
  });

  test('calls updateEndpoint on key change after expanding', () => {
    render(
      <Endpoint
        index={0}
        disabled={false}
        endpoint={baseEndpoint as any}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );
    fireEvent.click(screen.getByLabelText('toggle expanded fields'));
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.UpstreamKey), {
      target: { value: 'new-key' },
    });
    expect(updateEndpoint).toHaveBeenCalledWith({ ...baseEndpoint, key: 'new-key' });
  });

  test('calls removeEndpoint on remove button click', () => {
    render(
      <Endpoint
        index={0}
        disabled={false}
        endpoint={baseEndpoint as any}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );
    fireEvent.click(screen.getByLabelText('remove'));
    expect(removeEndpoint).toHaveBeenCalledWith(0);
  });

  test('does not render remove button if disabled', () => {
    render(
      <Endpoint
        index={0}
        disabled={true}
        endpoint={baseEndpoint as any}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Remove })).toBeNull();
  });

  test('renders id input and calls updateEndpoint on id change when view is Models', () => {
    render(
      <Endpoint
        index={0}
        disabled={false}
        endpoint={baseEndpoint as any}
        view={ApplicationRoute.Models}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.UpstreamId)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.UpstreamId), {
      target: { value: 'new-id' },
    });
    expect(updateEndpoint).toHaveBeenCalledWith({ ...baseEndpoint, id: 'new-id' });
  });

  test('does not render id input when view is not Models', () => {
    render(
      <Endpoint
        index={0}
        disabled={false}
        endpoint={baseEndpoint as any}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );
    expect(screen.queryByPlaceholderText(EntityPlaceholdersI18nKey.UpstreamId)).not.toBeInTheDocument();
  });

  test('does not render responses endpoint when withResponses is false', () => {
    render(
      <Endpoint
        index={0}
        disabled={false}
        endpoint={baseEndpoint as any}
        withResponses={false}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );
    expect(screen.queryByPlaceholderText(EntityPlaceholdersI18nKey.ResponsesEndpoint)).not.toBeInTheDocument();
  });

  test('renders responses endpoint when withResponses is true', () => {
    render(
      <Endpoint
        index={0}
        disabled={false}
        endpoint={baseEndpoint as any}
        withResponses={true}
        updateEndpoint={updateEndpoint}
        removeEndpoint={removeEndpoint}
      />,
    );
    expect(screen.getByPlaceholderText(EntityPlaceholdersI18nKey.ResponsesEndpoint)).toBeInTheDocument();
  });
});
