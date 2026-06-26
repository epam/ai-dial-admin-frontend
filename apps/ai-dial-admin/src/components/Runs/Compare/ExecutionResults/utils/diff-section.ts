import { TreeColumnsPanelDiffSection } from '@/src/components/Grid/TreeColumnsPanel/models';
import { RunsI18nKey } from '@/src/constants/i18n';

interface CompareDiffSectionOptions {
  viewDifferencesOnly: boolean;
  onViewDifferencesOnlyChange: (value: boolean) => void;
  hideHighlights: boolean;
  onHideHighlightsChange: (value: boolean) => void;
  switchIdPrefix?: string;
}

export const getCompareDiffSection = (
  t: (key: string) => string,
  options: CompareDiffSectionOptions,
): TreeColumnsPanelDiffSection => ({
  differencesTitle: t(RunsI18nKey.RunCompareDifferences),
  viewDifferencesOnly: options.viewDifferencesOnly,
  onViewDifferencesOnlyChange: options.onViewDifferencesOnlyChange,
  viewDifferencesOnlyLabel: t(RunsI18nKey.RunCompareViewDifferencesOnly),
  hideHighlights: options.hideHighlights,
  onHideHighlightsChange: options.onHideHighlightsChange,
  hideHighlightsLabel: t(RunsI18nKey.RunCompareHideHighlights),
  switchIdPrefix: options.switchIdPrefix,
});
