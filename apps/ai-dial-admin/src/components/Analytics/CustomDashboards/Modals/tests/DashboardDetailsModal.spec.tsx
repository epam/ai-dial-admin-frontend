import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import DashboardDetailsModal from '@/src/components/Analytics/CustomDashboards/Modals/DashboardDetailsModal';
import { DashboardDetails } from '@/src/components/Analytics/CustomDashboards/models';
import { ComparePeriod } from '@/src/components/Analytics/Usage/models';
import {
  AnalyticsUsageI18nKey,
  CustomDashboardsI18nKey,
  EntityFieldsI18nKey,
  ErrorI18nKey,
} from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { DashboardVisibility } from '@/src/models/analytics/dashboard';

const SUBMIT = 'Create';

const details = (patch: Partial<DashboardDetails> = {}): DashboardDetails => ({
  name: 'Costs',
  description: '',
  compare: ComparePeriod.Off,
  visibility: DashboardVisibility.Private,
  ...patch,
});

describe('DashboardDetailsModal', () => {
  const onSubmit = vi.fn<(details: DashboardDetails) => Promise<boolean>>();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    onSubmit.mockResolvedValue(true);
  });

  const renderModal = (initial?: DashboardDetails, canPublish = true) =>
    render(
      <DashboardDetailsModal
        header="Create dashboard"
        submitLabel={SUBMIT}
        initial={initial}
        canPublish={canPublish}
        onSubmit={onSubmit}
        onClose={onClose}
      />,
    );

  test('stays open, usable and reports an error when the write is rejected', async () => {
    onSubmit.mockRejectedValue(new Error('network'));
    renderModal(details());
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: SUBMIT }));
    await act(async () => {});

    expect(useNotification().showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: ErrorI18nKey.Error }),
    );
    expect(screen.getByRole('button', { name: SUBMIT })).toBeEnabled();
    expect(onClose).not.toHaveBeenCalled();
  });

  test('keeps submit unavailable while the name is blank', async () => {
    renderModal();
    const user = userEvent.setup();

    expect(screen.getByRole('button', { name: SUBMIT })).toBeDisabled();

    await user.type(screen.getByRole('textbox', { name: new RegExp(EntityFieldsI18nKey.name) }), '   ');

    expect(screen.getByRole('button', { name: SUBMIT })).toBeDisabled();
  });

  test('submits the trimmed details and closes once the caller succeeds', async () => {
    renderModal();
    const user = userEvent.setup();

    // Per-keystroke typing drops characters in the kit field under jsdom, so the value is set in one change.
    fireEvent.change(screen.getByRole('textbox', { name: new RegExp(EntityFieldsI18nKey.name) }), {
      target: { value: '  Costs ' },
    });
    await user.click(screen.getByRole('button', { name: SUBMIT }));

    expect(onSubmit).toHaveBeenCalledWith(details());
    await vi.waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });

  test('stays open with its values when the caller reports a failure', async () => {
    onSubmit.mockResolvedValue(false);
    renderModal(details({ description: 'Spend' }));
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: SUBMIT }));

    await act(async () => {});

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: new RegExp(EntityFieldsI18nKey.name) })).toHaveValue('Costs');
  });

  test('submits the compare the dashboard opens with', async () => {
    renderModal(details());
    const user = userEvent.setup();

    await user.click(screen.getByRole('combobox', { name: new RegExp(CustomDashboardsI18nKey.DefaultCompare) }));
    await user.click(await screen.findByRole('option', { name: AnalyticsUsageI18nKey.ComparePreviousPeriod }));
    await user.click(screen.getByRole('button', { name: SUBMIT }));

    expect(onSubmit).toHaveBeenCalledWith(details({ compare: ComparePeriod.PreviousPeriod }));
  });
});

describe('DashboardDetailsModal — visibility', () => {
  const onSubmit = vi.fn<(details: DashboardDetails) => Promise<boolean>>();

  beforeEach(() => {
    vi.clearAllMocks();
    onSubmit.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderModal = (initial?: DashboardDetails, canPublish = true) =>
    render(
      <DashboardDetailsModal
        header="Edit dashboard"
        submitLabel={SUBMIT}
        initial={initial}
        canPublish={canPublish}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );

  const visibilityField = () =>
    screen.queryByRole('combobox', { name: new RegExp(CustomDashboardsI18nKey.Visibility) });

  test('lets a caller who may publish publish the dashboard', async () => {
    renderModal(details());
    const user = userEvent.setup();

    await user.click(visibilityField()!);
    await user.click(await screen.findByRole('option', { name: CustomDashboardsI18nKey.VisibilityPublic }));
    await user.click(screen.getByRole('button', { name: SUBMIT }));

    expect(onSubmit).toHaveBeenCalledWith(details({ visibility: DashboardVisibility.Public }));
  });

  test('hides the visibility from a caller who may not publish and keeps the stored one', async () => {
    renderModal(details({ visibility: DashboardVisibility.Public }), false);
    const user = userEvent.setup();

    expect(screen.getByRole('combobox', { name: new RegExp(CustomDashboardsI18nKey.DefaultCompare) })).toBeTruthy();
    expect(visibilityField()).toBeNull();

    await user.click(screen.getByRole('button', { name: SUBMIT }));
    expect(onSubmit).toHaveBeenCalledWith(details({ visibility: DashboardVisibility.Public }));
  });
});
