import { describe, expect, test, vi } from 'vitest';
import type { EChartsType } from 'echarts';

import { createThresholdHoverHandlers } from '@/src/components/TestSuites/Trends/OverallScoreTrend/utils/threshold-hover';

const HOVER = {
  componentType: 'markLine',
  data: { tooltip: { formatter: 'Threshold (0.5)' } },
  event: { offsetX: 10, offsetY: 20 },
};

describe('createThresholdHoverHandlers', () => {
  const setup = () => {
    const dispatchAction = vi.fn();
    const handlers = createThresholdHoverHandlers(() => ({ dispatchAction }) as unknown as EChartsType);
    return { dispatchAction, handlers };
  };

  test('shows the mark line tooltip text at the pointer when a mark line is hovered', () => {
    const { dispatchAction, handlers } = setup();

    handlers.mouseover(HOVER);

    expect(dispatchAction).toHaveBeenCalledWith({
      type: 'showTip',
      x: 10,
      y: 20,
      tooltip: { content: 'Threshold (0.5)' },
    });
  });

  test('ignores hovers on other components, without pointer coordinates, or without tooltip text', () => {
    const { dispatchAction, handlers } = setup();

    handlers.mouseover({ ...HOVER, componentType: 'series' });
    handlers.mouseover({ ...HOVER, event: undefined });
    handlers.mouseover({ ...HOVER, data: { tooltip: {} } });
    handlers.mouseover({ componentType: 'markLine', event: HOVER.event });

    expect(dispatchAction).not.toHaveBeenCalled();
  });

  test('hides the tooltip on mouse out only after it opened one', () => {
    const { dispatchAction, handlers } = setup();

    handlers.mouseout({ componentType: 'markLine' });
    expect(dispatchAction).not.toHaveBeenCalled();

    handlers.mouseover(HOVER);
    handlers.mouseout({ componentType: 'markLine' });
    handlers.mouseout({ componentType: 'markLine' });

    expect(dispatchAction).toHaveBeenLastCalledWith({ type: 'hideTip' });
    expect(dispatchAction).toHaveBeenCalledTimes(2);
  });

  test('leaves the tooltip alone when a non-mark-line element is left', () => {
    const { dispatchAction, handlers } = setup();

    handlers.mouseover(HOVER);
    handlers.mouseout({ componentType: 'series' });

    expect(dispatchAction).toHaveBeenCalledOnce();
  });
});
