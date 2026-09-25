import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FC } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { FeatureFlags } from '@/src/models/feature-flags';

const { AppContextProvider, useAppContext }: typeof import('@/src/context/AppContext') =
  await vi.importActual('@/src/context/AppContext');

const FEATURE_FLAGS: FeatureFlags = {
  adminApiEnabled: true,
  catalogEnabled: true,
  dashboardEnabled: true,
  deploymentsEnabled: true,
  evaluationEnabled: true,
  mcpRegistryEnabled: false,
  nimEnabled: false,
  hfEnabled: false,
  analyticsEnabled: false,
  analyticsSessionsEnabled: false,
  analyticsUsageEnabled: false,
  queryAssistantEnabled: false,
};

const Harness: FC = () => {
  const { showConfigFiles, toggleShowConfigFiles, isReadOnlyAdmin, setEntityReadOnly } = useAppContext();

  return (
    <>
      <span>{`showConfigFiles:${showConfigFiles}`}</span>
      <span>{`isReadOnlyAdmin:${isReadOnlyAdmin}`}</span>
      <button onClick={toggleShowConfigFiles}>toggle</button>
      <button onClick={() => setEntityReadOnly(true)}>make-read-only</button>
      <button onClick={() => setEntityReadOnly(false)}>clear-read-only</button>
    </>
  );
};

const renderHarness = () =>
  render(
    <AppContextProvider featureFlags={FEATURE_FLAGS}>
      <Harness />
    </AppContextProvider>,
  );

describe('AppContextProvider — showConfigFiles', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('defaults to false with no prior stored value', () => {
    renderHarness();

    expect(screen.getByText('showConfigFiles:false')).toBeTruthy();
  });

  test('toggling flips the value and persists it to localStorage', async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByRole('button', { name: 'toggle' }));

    expect(screen.getByText('showConfigFiles:true')).toBeTruthy();
    expect(localStorage.getItem('show-config-files')).toBe('true');
  });

  test('reads a previously stored true value on mount', () => {
    localStorage.setItem('show-config-files', 'true');

    renderHarness();

    expect(screen.getByText('showConfigFiles:true')).toBeTruthy();
  });
});

describe('AppContextProvider — setEntityReadOnly', () => {
  test('folds into isReadOnlyAdmin regardless of role/feature-flag state', async () => {
    const user = userEvent.setup();
    renderHarness();

    expect(screen.getByText('isReadOnlyAdmin:false')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'make-read-only' }));

    expect(screen.getByText('isReadOnlyAdmin:true')).toBeTruthy();
  });

  test('clearing it restores the prior computation', async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByRole('button', { name: 'make-read-only' }));
    await user.click(screen.getByRole('button', { name: 'clear-read-only' }));

    expect(screen.getByText('isReadOnlyAdmin:false')).toBeTruthy();
  });
});
