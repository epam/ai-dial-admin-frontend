// ECharts draws its tooltip as a DOM node, so the theme's CSS variables reach it. These mirror the ui-kit
// tooltip bubble (`bg-control-inverted`, no border, `rounded-lg`) so chart tooltips read like every other tooltip.
export const CHART_TOOLTIP_TEXT_COLOR = 'var(--text-control-inverted, #FCFCFC)';

export const CHART_TOOLTIP_STYLE = {
  backgroundColor: 'var(--bg-control-inverted, #57647A)',
  borderWidth: 0,
  padding: [8, 12],
  textStyle: { color: CHART_TOOLTIP_TEXT_COLOR, fontSize: 12 },
  extraCssText: 'border-radius:8px;box-shadow:var(--shadow-xs);max-width:376px;',
};
