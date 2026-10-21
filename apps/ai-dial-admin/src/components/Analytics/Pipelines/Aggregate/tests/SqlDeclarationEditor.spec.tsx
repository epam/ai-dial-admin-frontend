import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import SqlDeclarationEditor from '@/src/components/Analytics/Pipelines/Aggregate/SqlDeclarationEditor';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
describe('SqlDeclarationEditor', () => {
  test('holds the statement under its own name and states the accepted shape', () => {
    render(<SqlDeclarationEditor value="INSERT INTO t (a) SELECT 1" onChange={vi.fn()} />);
    expect(screen.getByRole('textbox', { name: AnalyticsPipelinesI18nKey.SqlDeclaration })).toHaveValue(
      'INSERT INTO t (a) SELECT 1',
    );
    expect(screen.getByText(AnalyticsPipelinesI18nKey.SqlDeclarationCaption)).toBeInTheDocument();
  });
  test('reports what is typed without rewriting it', () => {
    const onChange = vi.fn();
    render(<SqlDeclarationEditor value="" onChange={onChange} />);
    const typed = 'INSERT INTO t (a)\n  SELECT 1  ';
    fireEvent.change(screen.getByRole('textbox'), { target: { value: typed } });
    expect(onChange).toHaveBeenCalledWith(typed);
  });
});
