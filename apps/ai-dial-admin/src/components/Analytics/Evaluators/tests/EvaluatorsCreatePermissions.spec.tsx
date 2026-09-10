import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import EvaluatorsView from '@/src/components/Analytics/Evaluators/EvaluatorsView';
import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { EvaluatorListRow } from '@/src/models/analytics/evaluator';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock('@/src/components/Analytics/Evaluators/CreateEvaluatorPopup', () => ({ default: () => <div /> }));

interface MockColDef {
  headerName?: string;
  field?: string;
  colId?: string;
}

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ columnDefs, rowData }: { columnDefs?: MockColDef[]; rowData?: EvaluatorListRow[] }) => (
    <div>
      <div>cols: {columnDefs?.map((col) => col.colId ?? col.field).join('|')}</div>
      <div>actions: {columnDefs?.some((col) => col.field === ACTIONS_COLUMN_CEL_ID) ? 'present' : 'absent'}</div>
      {rowData?.map((row) => (
        <div key={row.name}>{row.name}</div>
      ))}
    </div>
  ),
}));

// test-setup.tsx pins isFullAdmin true for the whole suite, so the non-admin case needs its own file.
const isFullAdmin = { value: false };
vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({ isFullAdmin: isFullAdmin.value, isReadOnlyAdmin: !isFullAdmin.value, isEnableAuth: true }),
}));

const row: EvaluatorListRow = {
  name: 'conversation-insights',
  latest_version: 4,
  created_at: '2026-08-17T10:00:00Z',
  usedBy: 3,
};

const renderView = () => render(<EvaluatorsView rows={[row]} />);

describe('EvaluatorsView — a caller without full-admin rights', () => {
  test('is offered no create control, disabled or otherwise', () => {
    isFullAdmin.value = false;
    renderView();

    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Create })).toBeNull();
  });

  test('still reads every row and every column', () => {
    isFullAdmin.value = false;
    renderView();

    expect(screen.getByText(/^cols:/)).toHaveTextContent('cols: name|latest_version|registeredAt|usedBy');
    expect(screen.getByText(/^actions:/)).toHaveTextContent('actions: absent');
    expect(screen.getByText('conversation-insights')).toBeTruthy();
  });

  test('a full admin is still offered the create control', () => {
    isFullAdmin.value = true;
    renderView();

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Create })).toBeTruthy();
  });
});
