import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getTableAccess } from '@/src/app/[lang]/tables/actions';
import AnalyticsRowOptionsModal from '@/src/components/ExportConfig/Content/AnalyticsRowOptionsModal';
import { ButtonsI18nKey, ExportI18nKey } from '@/src/constants/i18n';
import { TableAccessConfig } from '@/src/models/analytics/table';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { AnalyticsExportEntityType } from '@/src/types/analytics/export';
import { getErrorNotification } from '@/src/utils/notification';

vi.mock('@/src/app/[lang]/tables/actions', () => ({ getTableAccess: vi.fn() }));

vi.mock('@/src/utils/notification', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/utils/notification')>()),
  getErrorNotification: vi.fn(),
}));

const ENTRY = { privileges: [], rows: null, columns: null };
const accessWith = (roles: string[]): TableAccessConfig => ({
  generation: 1,
  roles: Object.fromEntries(roles.map((role) => [role, ENTRY])),
  ineffective_grants: [],
});

describe('AnalyticsRowOptionsModal', () => {
  const onApply = vi.fn();
  const onClose = vi.fn();

  const renderModal = (tab: AnalyticsExportEntityType, entity: EntitiesGridData) =>
    render(<AnalyticsRowOptionsModal entity={entity} tab={tab} onClose={onClose} onApply={onApply} />);

  beforeEach(() => {
    vi.mocked(getTableAccess).mockResolvedValue({ success: true, response: accessWith(['analysts', 'viewers']) });
  });

  test('exports a pipeline alone once Include dependencies is unchecked', async () => {
    const user = userEvent.setup();
    renderModal(AnalyticsExportEntityType.PIPELINE, { name: 'usage_enrich' });

    const checkbox = screen.getByRole('checkbox', { name: ExportI18nKey.AnalyticsIncludeDependencies });
    expect(checkbox).toBeChecked();
    await user.click(checkbox);
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    expect(onApply).toHaveBeenCalledWith({ name: 'usage_enrich', isExportedAlone: true });
    expect(getTableAccess).not.toHaveBeenCalled();
  });

  test('reads the roles of the table and marks it access only', async () => {
    const user = userEvent.setup();
    renderModal(AnalyticsExportEntityType.TABLE, { name: 'usage_base' });

    const checkbox = await screen.findByRole('checkbox', { name: ExportI18nKey.AnalyticsAccessOnly });
    expect(checkbox).toBeEnabled();
    await user.click(checkbox);
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    expect(getTableAccess).toHaveBeenCalledWith('usage_base');
    expect(onApply).toHaveBeenCalledWith({ name: 'usage_base', isAccessOnly: true, accessRoles: undefined });
  });

  test('keeps only the chosen roles the table still holds', async () => {
    const user = userEvent.setup();
    renderModal(AnalyticsExportEntityType.TABLE, { name: 'usage_base', accessRoles: ['analysts', 'gone'] });

    await screen.findByRole('checkbox', { name: ExportI18nKey.AnalyticsAccessOnly });
    await user.click(screen.getByRole('button', { name: ButtonsI18nKey.Save }));

    expect(onApply).toHaveBeenCalledWith({ name: 'usage_base', isAccessOnly: false, accessRoles: ['analysts'] });
  });

  test('disables Access only and says so when the table holds no access entry', async () => {
    vi.mocked(getTableAccess).mockResolvedValue({ success: true, response: accessWith([]) });
    renderModal(AnalyticsExportEntityType.TABLE, { name: 'usage_base' });

    expect(await screen.findByText(ExportI18nKey.AnalyticsNoAccessEntries)).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: ExportI18nKey.AnalyticsAccessOnly })).toBeDisabled();
  });

  test('reports a failed role read and blocks Save', async () => {
    vi.mocked(getTableAccess).mockResolvedValue({ success: false, errorMessage: 'forbidden', requestId: 'r-1' });
    renderModal(AnalyticsExportEntityType.TABLE, { name: 'usage_base' });

    expect(await screen.findByRole('checkbox', { name: ExportI18nKey.AnalyticsAccessOnly })).toBeDisabled();
    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();
    expect(screen.queryByText(ExportI18nKey.AnalyticsNoAccessEntries)).toBeNull();
    expect(getErrorNotification).toHaveBeenCalledWith(ExportI18nKey.AnalyticsRolesReadFailed, 'forbidden', 'r-1');
  });

  test('reports an unreachable service', async () => {
    vi.mocked(getTableAccess).mockRejectedValue(new Error('fetch failed'));
    renderModal(AnalyticsExportEntityType.TABLE, { name: 'usage_base' });

    expect(await screen.findByRole('checkbox', { name: ExportI18nKey.AnalyticsAccessOnly })).toBeDisabled();
    expect(getErrorNotification).toHaveBeenCalledWith(ExportI18nKey.AnalyticsRolesReadFailed);
  });
});
