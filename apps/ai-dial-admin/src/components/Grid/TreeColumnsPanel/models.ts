export interface TreeColumnsPanelDiffSection {
  differencesTitle: string;
  viewDifferencesOnly: boolean;
  onViewDifferencesOnlyChange: (value: boolean) => void;
  viewDifferencesOnlyLabel: string;
  hideHighlights: boolean;
  onHideHighlightsChange: (value: boolean) => void;
  hideHighlightsLabel: string;
  switchIdPrefix?: string;
}
