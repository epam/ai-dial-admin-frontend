import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import AggregateModeSwitch from '@/src/components/Analytics/Pipelines/Aggregate/AggregateModeSwitch';
import { AggregateMode } from '@/src/components/Analytics/Pipelines/Aggregate/models';
import { AnalyticsPipelinesI18nKey } from '@/src/constants/i18n';
const renderSwitch = (props: Partial<React.ComponentProps<typeof AggregateModeSwitch>> = {}) => {
  const handlers = { onChange: vi.fn(), onConfirm: vi.fn(), onCancel: vi.fn() };
  render(<AggregateModeSwitch mode={AggregateMode.Form} isConfirmOpen={false} {...handlers} {...props} />);
  return handlers;
};
describe('AggregateModeSwitch', () => {
  test('offers both modes under one accessible name', () => {
    renderSwitch();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.AggregateModeForm)).toBeInTheDocument();
    expect(screen.getByText(AnalyticsPipelinesI18nKey.AggregateModeSql)).toBeInTheDocument();
  });
  test('reports the mode the caller picks', () => {
    const { onChange } = renderSwitch();
    fireEvent.click(screen.getByText(AnalyticsPipelinesI18nKey.AggregateModeSql));
    expect(onChange).toHaveBeenCalledWith(AggregateMode.Sql);
  });
  test('asks nothing while no switch is pending', () => {
    renderSwitch();
    expect(screen.queryByText(AnalyticsPipelinesI18nKey.AggregateModeSwitchTitle)).not.toBeInTheDocument();
  });
  test('asks for confirmation of a pending switch, and reports either answer', () => {
    const { onConfirm } = renderSwitch({ isConfirmOpen: true });
    expect(screen.getByText(AnalyticsPipelinesI18nKey.AggregateModeSwitchTitle)).toBeInTheDocument();
    fireEvent.click(screen.getByText(AnalyticsPipelinesI18nKey.AggregateModeSwitchConfirm));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
