import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { TestSuitesI18nKey } from '@/src/constants/i18n';

import ImportWarningsList from '@/src/components/TestSuites/TestCases/Import/ImportWarningsList';
import { CaseWarning } from '@/src/components/TestSuites/TestCases/Import/models';

const { tSpy } = vi.hoisted(() => ({ tSpy: vi.fn((key: string) => key) }));

vi.mock('@/src/locales/client', () => ({
  useI18n: () => tSpy,
  useCurrentLocale: () => 'en',
}));

describe('ImportWarningsList', () => {
  beforeEach(() => {
    tSpy.mockClear();
  });

  test('should render one entry per warning with its row number, column name and message', () => {
    const warnings: CaseWarning[] = [
      { rowNumber: 2, columnName: 'temperature', message: 'Value out of range' },
      { rowNumber: 5, columnName: 'model', message: 'Unknown model' },
    ];

    render(<ImportWarningsList warnings={warnings} />);

    expect(screen.getByText(TestSuitesI18nKey.ImportWarnings)).toBeInTheDocument();
    expect(screen.getByText(/temperature: Value out of range/)).toBeInTheDocument();
    expect(screen.getByText(/model: Unknown model/)).toBeInTheDocument();
    expect(tSpy).toHaveBeenCalledWith(TestSuitesI18nKey.ImportWarningRow, { rowNumber: 2 });
    expect(tSpy).toHaveBeenCalledWith(TestSuitesI18nKey.ImportWarningRow, { rowNumber: 5 });
  });

  test('should render nothing for an empty warnings array', () => {
    const { container } = render(<ImportWarningsList warnings={[]} />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText(TestSuitesI18nKey.ImportWarnings)).not.toBeInTheDocument();
  });

  test('should render nothing when warnings is undefined', () => {
    const { container } = render(<ImportWarningsList />);

    expect(container).toBeEmptyDOMElement();
  });
});
