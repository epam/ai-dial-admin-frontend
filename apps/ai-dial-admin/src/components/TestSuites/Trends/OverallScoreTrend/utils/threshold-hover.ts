import type { EChartsType } from 'echarts';

interface MarkLineHoverParams {
  componentType?: string;
  data?: { tooltip?: { formatter?: unknown } };
  event?: { offsetX?: number; offsetY?: number };
}

// A `type`, not an interface: `onEvents` wants a `Record<string, Function>`, which interfaces don't satisfy.
export type ThresholdHoverHandlers = {
  mouseover: (params: MarkLineHoverParams) => void;
  mouseout: (params: MarkLineHoverParams) => void;
};

/**
 * The chart tooltip is click-triggered (`triggerOn: 'click'`), so a threshold mark line would never show
 * its tooltip on hover. These handlers open it on hover with the text the mark line carries, and close only
 * the tip they opened, leaving a sticky run tooltip alone.
 *
 * The text is passed to `showTip` explicitly: letting ECharts resolve the hovered element itself
 * (`showTip` with only x/y) hides the tooltip again right away.
 */
export const createThresholdHoverHandlers = (getChart: () => EChartsType | undefined): ThresholdHoverHandlers => {
  let isThresholdTipOpen = false;

  return {
    mouseover: ({ componentType, data, event }) => {
      const x = event?.offsetX;
      const y = event?.offsetY;
      const content = data?.tooltip?.formatter;
      if (componentType !== 'markLine' || x == null || y == null || typeof content !== 'string') {
        return;
      }
      getChart()?.dispatchAction({ type: 'showTip', x, y, tooltip: { content } });
      isThresholdTipOpen = true;
    },
    mouseout: ({ componentType }) => {
      if (componentType !== 'markLine' || !isThresholdTipOpen) {
        return;
      }
      isThresholdTipOpen = false;
      getChart()?.dispatchAction({ type: 'hideTip' });
    },
  };
};
