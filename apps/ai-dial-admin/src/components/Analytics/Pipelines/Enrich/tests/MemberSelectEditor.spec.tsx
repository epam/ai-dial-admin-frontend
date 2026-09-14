import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, test, vi } from 'vitest';

import MemberSelectEditor from '@/src/components/Analytics/Pipelines/Enrich/MemberSelectEditor';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
import { MemberSelect } from '@/src/models/analytics/pipeline';

const Host = ({ seed }: { seed?: MemberSelect }) => {
  const [memberSelect, setMemberSelect] = useState<MemberSelect | undefined>(seed);
  return <MemberSelectEditor memberSelect={memberSelect} columns={[]} isLimitValid onChange={setMemberSelect} />;
};

const scopeRadio = (name: string) => screen.getByRole('radio', { name });

describe('MemberSelectEditor', () => {
  test('opens on taking every member when the pipeline declares no policy', () => {
    render(<Host />);

    expect(scopeRadio(AnalyticsPipelinesI18nKey.MemberScopeAll)).toBeChecked();
    expect(screen.queryByLabelText(AnalyticsPipelinesI18nKey.MemberLimit, { exact: false })).toBeNull();
  });

  test('opens on the selection when the pipeline declares one', () => {
    render(<Host seed={{ limit: 3 }} />);

    expect(scopeRadio(AnalyticsPipelinesI18nKey.MemberScopeSelected)).toBeChecked();
    expect(screen.getByLabelText(AnalyticsPipelinesI18nKey.MemberLimit, { exact: false })).toHaveValue(3);
  });

  test('sends no policy at all when every member is taken', () => {
    const onChange = vi.fn();
    render(<MemberSelectEditor memberSelect={{ limit: 3 }} columns={[]} isLimitValid onChange={onChange} />);

    fireEvent.click(scopeRadio(AnalyticsPipelinesI18nKey.MemberScopeAll));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  test('keeps the entered selection when switching back to it', () => {
    render(<Host seed={{ limit: 3 }} />);

    fireEvent.click(scopeRadio(AnalyticsPipelinesI18nKey.MemberScopeAll));
    fireEvent.click(scopeRadio(AnalyticsPipelinesI18nKey.MemberScopeSelected));

    expect(screen.getByLabelText(AnalyticsPipelinesI18nKey.MemberLimit, { exact: false })).toHaveValue(3);
  });

  test('states that the preference is not a filter, once under the field it belongs to', () => {
    render(<Host seed={{ limit: 3 }} />);

    expect(screen.getAllByText(new RegExp(AnalyticsPipelinesI18nKey.PreferSqlCaption))).toHaveLength(1);
  });

  test('states the tiebreak without naming columns while the read source is unresolved', () => {
    render(<Host seed={{ limit: 3 }} />);

    expect(screen.getByText(AnalyticsPipelinesI18nKey.MemberTiebreakUnresolved)).toBeTruthy();
  });
});
